import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import type { Edge, EdgeKind, Graph, Node, NodeType } from "../arch/model";

// Build endpoint -> DB edges by tracing Prisma-style calls reachable from Next route handlers.
const SOURCE_FILE_PATTERN = /\.(ts|tsx|js|jsx)$/;
const ROUTE_FILE_PATTERN = /^route\.(ts|tsx)$/;
const ROUTE_GROUP_PATTERN = /^\(.*\)$/;
const SKIPPED_DIRECTORIES = new Set(["node_modules", ".git", ".next", "__tests__"]);
const ROUTE_METHOD_EXPORTS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
const DB_CLIENT_IDENTIFIERS = ["prisma"];
const DB_NODE_TYPE: NodeType = "db";
const ENDPOINT_NODE_TYPE: NodeType = "endpoint";
const ENDPOINT_DB_EDGE_KIND: EdgeKind = "endpoint-db";

type ImportTarget = {
  filePath: string;
  exportName: string;
};

type ExportTarget =
  | {
      kind: "local";
      localName: string;
    }
  | {
      kind: "reexport";
      filePath: string;
      exportName: string;
    }
  | {
      kind: "node";
      node: ts.Node;
    };

type ModuleInfo = {
  sourceFile: ts.SourceFile;
  localDeclarations: Map<string, ts.Node>;
  importsByLocalName: Map<string, ImportTarget>;
  exportsByName: Map<string, ExportTarget>;
};

type ResolvedDeclaration = {
  filePath: string;
  key: string;
  node: ts.Node;
};

type DbUsage = {
  modelName: string;
  actionName?: string;
};

type AnalysisState = {
  projectRoot: string;
  moduleCache: Map<string, ModuleInfo>;
  sourceFileCache: Map<string, ts.SourceFile>;
  visitedDeclarationKeys: Set<string>;
  dbUsageByModel: Map<string, string | undefined>;
};

async function main(): Promise<void> {
  const projectRoot = findProjectRoot(process.cwd());
  const appDirectory = detectAppDirectory(projectRoot);
  const baseGraphPath = path.join(projectRoot, "arch", "graph.pages-endpoints.json");
  const outputFile = path.join(projectRoot, "arch", "graph.full.json");
  const baseGraph = readGraphFile(baseGraphPath);
  const graphNodes = [...baseGraph.nodes];
  const graphEdges = [...baseGraph.edges];
  const nodeIds = new Set(graphNodes.map((node) => node.id));
  const edgeKeys = new Set(graphEdges.map((edge) => buildEdgeKey(edge.from, edge.to, edge.kind)));
  const sourceFileCache = new Map<string, ts.SourceFile>();
  const moduleCache = new Map<string, ModuleInfo>();

  for (const routeFilePath of getRouteHandlerFiles(appDirectory)) {
    const endpointPath = getEndpointRouteFromFile(appDirectory, routeFilePath);
    const dbUsageByModel = analyzeEndpoint(
      routeFilePath,
      projectRoot,
      moduleCache,
      sourceFileCache
    );

    if (dbUsageByModel.size === 0) {
      continue;
    }

    ensureEndpointNode(graphNodes, nodeIds, endpointPath);

    for (const [modelName, actionName] of dbUsageByModel.entries()) {
      ensureDbNode(graphNodes, nodeIds, modelName);

      const endpointId = buildEndpointNodeId(endpointPath);
      const dbId = buildDbNodeId(modelName);
      const edgeKey = buildEdgeKey(endpointId, dbId, ENDPOINT_DB_EDGE_KIND);

      if (edgeKeys.has(edgeKey)) {
        continue;
      }

      edgeKeys.add(edgeKey);
      graphEdges.push({
        from: endpointId,
        to: dbId,
        kind: ENDPOINT_DB_EDGE_KIND,
        meta: actionName ? { action: actionName } : undefined,
      });
    }
  }

  const graph: Graph = {
    nodes: graphNodes.sort((left, right) => left.id.localeCompare(right.id)),
    edges: graphEdges.sort(
      (left, right) =>
        left.kind.localeCompare(right.kind) ||
        left.from.localeCompare(right.from) ||
        left.to.localeCompare(right.to)
    ),
  };

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(graph, null, 2)}\n`, "utf8");

  const pageCount = graph.nodes.filter((node) => node.type === "page").length;
  const endpointCount = graph.nodes.filter((node) => node.type === "endpoint").length;
  const dbCount = graph.nodes.filter((node) => node.type === "db").length;
  const endpointDbEdgeCount = graph.edges.filter(
    (edge) => edge.kind === ENDPOINT_DB_EDGE_KIND
  ).length;

  console.log(
    [
      `pages=${pageCount}`,
      `endpoints=${endpointCount}`,
      `db=${dbCount}`,
      `endpointDbEdges=${endpointDbEdgeCount}`,
      `file=${path.relative(projectRoot, outputFile)}`,
    ].join(" ")
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});

function analyzeEndpoint(
  routeFilePath: string,
  projectRoot: string,
  moduleCache: Map<string, ModuleInfo>,
  sourceFileCache: Map<string, ts.SourceFile>
): Map<string, string | undefined> {
  const state: AnalysisState = {
    projectRoot,
    moduleCache,
    sourceFileCache,
    visitedDeclarationKeys: new Set<string>(),
    dbUsageByModel: new Map<string, string | undefined>(),
  };

  for (const methodName of ROUTE_METHOD_EXPORTS) {
    const resolvedDeclaration = resolveExportReference(routeFilePath, methodName, state);
    if (!resolvedDeclaration) {
      continue;
    }

    analyzeDeclaration(resolvedDeclaration, state, new Set(DB_CLIENT_IDENTIFIERS));
  }

  return state.dbUsageByModel;
}

function analyzeDeclaration(
  declaration: ResolvedDeclaration,
  state: AnalysisState,
  activeDbClients: Set<string>
): void {
  if (state.visitedDeclarationKeys.has(declaration.key)) {
    return;
  }

  state.visitedDeclarationKeys.add(declaration.key);
  visitNode(getAnalyzableNode(declaration.node), declaration.filePath, state, activeDbClients);
}

function visitNode(
  node: ts.Node,
  filePath: string,
  state: AnalysisState,
  activeDbClients: Set<string>
): void {
  if (ts.isCallExpression(node)) {
    const dbUsage = parseDbUsage(node, activeDbClients);
    if (dbUsage) {
      const existingAction = state.dbUsageByModel.get(dbUsage.modelName);
      if (!existingAction) {
        state.dbUsageByModel.set(dbUsage.modelName, dbUsage.actionName);
      }
    }

    const transactionCallback = getTransactionCallback(node, activeDbClients);
    if (transactionCallback) {
      visitNode(
        getFunctionBodyNode(transactionCallback.callback),
        filePath,
        state,
        new Set([...activeDbClients, transactionCallback.clientIdentifier])
      );
    }

    if (shouldResolveCall(node)) {
      const resolvedCallee = resolveIdentifierReference(node.expression.text, filePath, state);
      if (resolvedCallee) {
        analyzeDeclaration(resolvedCallee, state, activeDbClients);
      }
    }

    ts.forEachChild(node, (child) => visitNode(child, filePath, state, activeDbClients));

    return;
  }

  ts.forEachChild(node, (child) => visitNode(child, filePath, state, activeDbClients));
}

function shouldResolveCall(node: ts.CallExpression): node is ts.CallExpression & {
  expression: ts.Identifier;
} {
  return (
    ts.isIdentifier(node.expression) &&
    !node.arguments.some(
      (argument) => ts.isArrowFunction(argument) || ts.isFunctionExpression(argument)
    )
  );
}

function parseDbUsage(node: ts.CallExpression, activeDbClients: Set<string>): DbUsage | null {
  const callee = node.expression;
  if (
    !ts.isPropertyAccessExpression(callee) ||
    !ts.isPropertyAccessExpression(callee.expression) ||
    !ts.isIdentifier(callee.expression.expression)
  ) {
    return null;
  }

  const clientIdentifier = callee.expression.expression.text;
  if (!activeDbClients.has(clientIdentifier)) {
    return null;
  }

  return {
    modelName: callee.expression.name.text,
    actionName: callee.name.text,
  };
}

function getTransactionCallback(
  node: ts.CallExpression,
  activeDbClients: Set<string>
): {
  callback: ts.ArrowFunction | ts.FunctionExpression;
  clientIdentifier: string;
} | null {
  const callee = node.expression;
  if (
    !ts.isPropertyAccessExpression(callee) ||
    !ts.isIdentifier(callee.expression) ||
    !activeDbClients.has(callee.expression.text) ||
    callee.name.text !== "$transaction"
  ) {
    return null;
  }

  const callback = node.arguments.find(
    (argument): argument is ts.ArrowFunction | ts.FunctionExpression =>
      ts.isArrowFunction(argument) || ts.isFunctionExpression(argument)
  );
  const firstParameter = callback?.parameters[0];

  if (!callback || !firstParameter || !ts.isIdentifier(firstParameter.name)) {
    return null;
  }

  return {
    callback,
    clientIdentifier: firstParameter.name.text,
  };
}

function resolveIdentifierReference(
  identifierName: string,
  filePath: string,
  state: AnalysisState
): ResolvedDeclaration | null {
  const moduleInfo = getModuleInfo(filePath, state);
  const localDeclaration = moduleInfo.localDeclarations.get(identifierName);

  if (localDeclaration) {
    return {
      filePath,
      key: `${filePath}::local::${identifierName}`,
      node: localDeclaration,
    };
  }

  const importTarget = moduleInfo.importsByLocalName.get(identifierName);
  if (!importTarget) {
    return null;
  }

  return resolveExportReference(importTarget.filePath, importTarget.exportName, state);
}

function resolveExportReference(
  filePath: string,
  exportName: string,
  state: AnalysisState,
  seen = new Set<string>()
): ResolvedDeclaration | null {
  const seenKey = `${filePath}::${exportName}`;
  if (seen.has(seenKey)) {
    return null;
  }

  seen.add(seenKey);
  const moduleInfo = getModuleInfo(filePath, state);
  const exportTarget = moduleInfo.exportsByName.get(exportName);

  if (!exportTarget) {
    const fallbackDeclaration = moduleInfo.localDeclarations.get(exportName);
    if (!fallbackDeclaration) {
      return null;
    }

    return {
      filePath,
      key: `${filePath}::local::${exportName}`,
      node: fallbackDeclaration,
    };
  }

  if (exportTarget.kind === "local") {
    const localDeclaration = moduleInfo.localDeclarations.get(exportTarget.localName);
    if (!localDeclaration) {
      return null;
    }

    return {
      filePath,
      key: `${filePath}::local::${exportTarget.localName}`,
      node: localDeclaration,
    };
  }

  if (exportTarget.kind === "node") {
    return {
      filePath,
      key: `${filePath}::node::${exportName}`,
      node: exportTarget.node,
    };
  }

  return resolveExportReference(exportTarget.filePath, exportTarget.exportName, state, seen);
}

function getModuleInfo(filePath: string, state: AnalysisState): ModuleInfo {
  const cachedModuleInfo = state.moduleCache.get(filePath);
  if (cachedModuleInfo) {
    return cachedModuleInfo;
  }

  const sourceFile = getSourceFile(filePath, state.sourceFileCache);
  if (!sourceFile) {
    throw new Error(`Could not parse ${path.relative(state.projectRoot, filePath)}.`);
  }

  const localDeclarations = new Map<string, ts.Node>();
  const importsByLocalName = new Map<string, ImportTarget>();
  const exportsByName = new Map<string, ExportTarget>();

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      localDeclarations.set(statement.name.text, statement);

      if (hasExportModifier(statement)) {
        exportsByName.set(statement.name.text, {
          kind: "local",
          localName: statement.name.text,
        });
      }

      if (hasDefaultModifier(statement)) {
        exportsByName.set("default", {
          kind: "local",
          localName: statement.name.text,
        });
      }

      continue;
    }

    if (ts.isVariableStatement(statement)) {
      const exported = hasExportModifier(statement);

      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          continue;
        }

        localDeclarations.set(declaration.name.text, declaration);

        if (exported) {
          exportsByName.set(declaration.name.text, {
            kind: "local",
            localName: declaration.name.text,
          });
        }
      }

      continue;
    }

    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const resolvedImportPath = resolveLocalModulePath(
        filePath,
        statement.moduleSpecifier.text,
        state.projectRoot
      );
      if (!resolvedImportPath || !statement.importClause) {
        continue;
      }

      if (statement.importClause.name) {
        importsByLocalName.set(statement.importClause.name.text, {
          filePath: resolvedImportPath,
          exportName: "default",
        });
      }

      if (
        statement.importClause.namedBindings &&
        ts.isNamedImports(statement.importClause.namedBindings)
      ) {
        for (const element of statement.importClause.namedBindings.elements) {
          importsByLocalName.set(element.name.text, {
            filePath: resolvedImportPath,
            exportName: element.propertyName?.text ?? element.name.text,
          });
        }
      }

      continue;
    }

    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      const moduleSpecifier =
        statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
          ? resolveLocalModulePath(filePath, statement.moduleSpecifier.text, state.projectRoot)
          : null;

      for (const element of statement.exportClause.elements) {
        const exportName = element.name.text;
        if (moduleSpecifier) {
          exportsByName.set(exportName, {
            kind: "reexport",
            filePath: moduleSpecifier,
            exportName: element.propertyName?.text ?? element.name.text,
          });
          continue;
        }

        exportsByName.set(exportName, {
          kind: "local",
          localName: element.propertyName?.text ?? element.name.text,
        });
      }

      continue;
    }

    if (ts.isExportAssignment(statement)) {
      if (ts.isIdentifier(statement.expression)) {
        exportsByName.set("default", {
          kind: "local",
          localName: statement.expression.text,
        });
      } else {
        exportsByName.set("default", {
          kind: "node",
          node: statement.expression,
        });
      }
    }
  }

  const moduleInfo: ModuleInfo = {
    sourceFile,
    localDeclarations,
    importsByLocalName,
    exportsByName,
  };
  state.moduleCache.set(filePath, moduleInfo);
  return moduleInfo;
}

function getAnalyzableNode(node: ts.Node): ts.Node {
  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
    return node.body ?? node;
  }

  if (ts.isVariableDeclaration(node)) {
    return node.initializer ?? node;
  }

  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    return getFunctionBodyNode(node);
  }

  return node;
}

function getFunctionBodyNode(node: ts.ArrowFunction | ts.FunctionExpression): ts.Node {
  return ts.isBlock(node.body) ? node.body : node.body;
}

function getSourceFile(
  filePath: string,
  sourceFileCache: Map<string, ts.SourceFile>
): ts.SourceFile | null {
  const cachedSourceFile = sourceFileCache.get(filePath);
  if (cachedSourceFile) {
    return cachedSourceFile;
  }

  try {
    const sourceFile = ts.createSourceFile(
      filePath,
      fs.readFileSync(filePath, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      getScriptKind(filePath)
    );
    sourceFileCache.set(filePath, sourceFile);
    return sourceFile;
  } catch {
    return null;
  }
}

function getScriptKind(filePath: string): ts.ScriptKind {
  if (filePath.endsWith(".tsx")) {
    return ts.ScriptKind.TSX;
  }

  if (filePath.endsWith(".jsx")) {
    return ts.ScriptKind.JSX;
  }

  if (filePath.endsWith(".js")) {
    return ts.ScriptKind.JS;
  }

  return ts.ScriptKind.TS;
}

function getRouteHandlerFiles(appDirectory: string): string[] {
  return walkDirectory(appDirectory).filter((filePath) =>
    ROUTE_FILE_PATTERN.test(path.basename(filePath))
  );
}

function walkDirectory(directoryPath: string): string[] {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (SKIPPED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const entryPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDirectory(entryPath));
      continue;
    }

    if (SOURCE_FILE_PATTERN.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function getEndpointRouteFromFile(appDirectory: string, filePath: string): string {
  const relativePath = path.relative(appDirectory, filePath);
  const segments = relativePath.split(path.sep).filter(Boolean);

  if (segments.length === 0) {
    return "/";
  }

  const fileName = segments.pop() ?? "";
  const routeSegments = segments
    .filter((segment) => !ROUTE_GROUP_PATTERN.test(segment))
    .map(decodeRouteSegment);

  if (!ROUTE_FILE_PATTERN.test(fileName)) {
    return routeSegments.length === 0 ? "/" : `/${routeSegments.join("/")}`;
  }

  return routeSegments.length === 0 ? "/" : `/${routeSegments.join("/")}`;
}

function decodeRouteSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function resolveLocalModulePath(
  importerFilePath: string,
  specifier: string,
  projectRoot: string
): string | null {
  let basePath: string | null = null;

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    basePath = path.resolve(path.dirname(importerFilePath), specifier);
  } else if (specifier.startsWith("@/")) {
    basePath = path.join(projectRoot, "src", specifier.slice(2));
  }

  if (!basePath) {
    return null;
  }

  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
    path.join(basePath, "index.jsx"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function findProjectRoot(startDirectory: string): string {
  let currentDirectory = path.resolve(startDirectory);

  while (!fs.existsSync(path.join(currentDirectory, "package.json"))) {
    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      throw new Error("Could not find a package.json while resolving the project root.");
    }

    currentDirectory = parentDirectory;
  }

  return currentDirectory;
}

function detectAppDirectory(projectRoot: string): string {
  const appPath = path.join(projectRoot, "app");
  if (fs.existsSync(appPath) && fs.statSync(appPath).isDirectory()) {
    return appPath;
  }

  const srcAppPath = path.join(projectRoot, "src", "app");
  if (fs.existsSync(srcAppPath) && fs.statSync(srcAppPath).isDirectory()) {
    return srcAppPath;
  }

  console.error("Could not find an app/ or src/app/ directory.");
  process.exit(1);
}

function readGraphFile(filePath: string): Graph {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing ${path.relative(process.cwd(), filePath)}. Run arch:graph:pages-endpoints first.`
    );
  }

  const parsedGraph = JSON.parse(fs.readFileSync(filePath, "utf8")) as Graph;

  if (!Array.isArray(parsedGraph.nodes) || !Array.isArray(parsedGraph.edges)) {
    throw new Error(`Invalid graph JSON in ${path.relative(process.cwd(), filePath)}.`);
  }

  return parsedGraph;
}

function ensureEndpointNode(nodes: Node[], nodeIds: Set<string>, endpointPath: string): void {
  const nodeId = buildEndpointNodeId(endpointPath);
  if (nodeIds.has(nodeId)) {
    return;
  }

  nodeIds.add(nodeId);
  nodes.push({
    id: nodeId,
    type: ENDPOINT_NODE_TYPE,
    label: endpointPath,
  });
}

function ensureDbNode(nodes: Node[], nodeIds: Set<string>, modelName: string): void {
  const nodeId = buildDbNodeId(modelName);
  if (nodeIds.has(nodeId)) {
    return;
  }

  nodeIds.add(nodeId);
  nodes.push({
    id: nodeId,
    type: DB_NODE_TYPE,
    label: modelName,
  });
}

function buildEndpointNodeId(endpointPath: string): string {
  return `endpoint:${endpointPath}`;
}

function buildDbNodeId(modelName: string): string {
  return `db:${modelName}`;
}

function buildEdgeKey(from: string, to: string, kind: Edge["kind"]): string {
  return `${from}::${to}::${kind}`;
}

function hasExportModifier(node: ts.Node): boolean {
  return (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0;
}

function hasDefaultModifier(node: ts.Node): boolean {
  return (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Default) !== 0;
}
