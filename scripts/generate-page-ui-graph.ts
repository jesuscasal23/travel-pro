import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import type { Edge, EdgeKind, Graph, Node, NodeType } from "../arch/model";

// Build page -> UI component edges by scanning page imports for component-like modules.
const PAGE_FILE_PATTERN = /^page\.(ts|tsx)$/;
const SOURCE_FILE_PATTERN = /\.(ts|tsx|js|jsx)$/;
const ROUTE_GROUP_PATTERN = /^\(.*\)$/;
const SKIPPED_DIRECTORIES = new Set(["node_modules", ".git", ".next", "__tests__"]);
const UI_NODE_TYPE: NodeType = "ui";
const PAGE_NODE_TYPE: NodeType = "page";
const PAGE_UI_EDGE_KIND: EdgeKind = "page-ui";

async function main(): Promise<void> {
  const projectRoot = findProjectRoot(process.cwd());
  const appDirectory = detectAppDirectory(projectRoot);
  const graphFile = path.join(projectRoot, "arch", "graph.full.json");
  const graph = readGraphFile(graphFile);
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const edgeKeys = new Set(graph.edges.map((edge) => buildEdgeKey(edge.from, edge.to, edge.kind)));

  for (const pageFilePath of walkDirectory(appDirectory)) {
    if (!PAGE_FILE_PATTERN.test(path.basename(pageFilePath))) {
      continue;
    }

    const route = getPageRouteFromFile(appDirectory, pageFilePath);
    const pageId = ensurePageNode(graph.nodes, nodeIds, route);
    const componentNames = collectUiComponentNames(pageFilePath, projectRoot);

    for (const componentName of componentNames) {
      const uiId = ensureUiNode(graph.nodes, nodeIds, componentName);
      const edgeKey = buildEdgeKey(pageId, uiId, PAGE_UI_EDGE_KIND);

      if (edgeKeys.has(edgeKey)) {
        continue;
      }

      edgeKeys.add(edgeKey);
      graph.edges.push({
        from: pageId,
        to: uiId,
        kind: PAGE_UI_EDGE_KIND,
      });
    }
  }

  const normalizedGraph: Graph = {
    nodes: graph.nodes.sort((left, right) => left.id.localeCompare(right.id)),
    edges: graph.edges.sort(
      (left, right) =>
        left.kind.localeCompare(right.kind) ||
        left.from.localeCompare(right.from) ||
        left.to.localeCompare(right.to)
    ),
  };

  fs.writeFileSync(graphFile, `${JSON.stringify(normalizedGraph, null, 2)}\n`, "utf8");

  const uiNodeCount = normalizedGraph.nodes.filter((node) => node.type === "ui").length;
  const pageUiEdgeCount = normalizedGraph.edges.filter(
    (edge) => edge.kind === PAGE_UI_EDGE_KIND
  ).length;

  console.log(
    [
      `pages=${normalizedGraph.nodes.filter((node) => node.type === "page").length}`,
      `ui=${uiNodeCount}`,
      `pageUiEdges=${pageUiEdgeCount}`,
      `file=${path.relative(projectRoot, graphFile)}`,
    ].join(" ")
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});

function collectUiComponentNames(pageFilePath: string, projectRoot: string): string[] {
  const sourceFile = getSourceFile(pageFilePath);
  if (!sourceFile) {
    return [];
  }

  const componentNames = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }

    const importSource = statement.moduleSpecifier.text;
    const resolvedImportPath = resolveLocalModulePath(pageFilePath, importSource, projectRoot);
    if (!isUiLikeImport(importSource, resolvedImportPath, projectRoot)) {
      continue;
    }

    const importClause = statement.importClause;
    if (!importClause || importClause.isTypeOnly) {
      continue;
    }

    if (importClause.name && isUiComponentName(importClause.name.text)) {
      componentNames.add(importClause.name.text);
    }

    if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
      for (const element of importClause.namedBindings.elements) {
        if (element.isTypeOnly) {
          continue;
        }

        if (isUiComponentName(element.name.text)) {
          componentNames.add(element.name.text);
        }
      }
    }
  }

  return [...componentNames].sort((left, right) => left.localeCompare(right));
}

function isUiLikeImport(
  importSource: string,
  resolvedImportPath: string | null,
  projectRoot: string
): boolean {
  if (importSource.startsWith("@/components/") || importSource === "@/components") {
    return true;
  }

  if (importSource.startsWith("./components") || importSource.startsWith("../components")) {
    return true;
  }

  if (!resolvedImportPath) {
    return false;
  }

  const normalizedResolvedPath = resolvedImportPath.replace(/\\/g, "/");
  const normalizedProjectRoot = projectRoot.replace(/\\/g, "/");

  return (
    normalizedResolvedPath.startsWith(`${normalizedProjectRoot}/src/components/`) ||
    (normalizedResolvedPath.startsWith(`${normalizedProjectRoot}/src/features/`) &&
      normalizedResolvedPath.includes("/components/")) ||
    (normalizedResolvedPath.startsWith(`${normalizedProjectRoot}/src/app/`) &&
      normalizedResolvedPath.includes("/components/"))
  );
}

function isUiComponentName(identifierName: string): boolean {
  return /^[A-Z]/.test(identifierName);
}

function ensurePageNode(nodes: Node[], nodeIds: Set<string>, route: string): string {
  const nodeId = `page:${route}`;
  if (nodeIds.has(nodeId)) {
    return nodeId;
  }

  nodeIds.add(nodeId);
  nodes.push({
    id: nodeId,
    type: PAGE_NODE_TYPE,
    label: route,
  });
  return nodeId;
}

function ensureUiNode(nodes: Node[], nodeIds: Set<string>, componentName: string): string {
  const nodeId = `ui:${componentName}`;
  if (nodeIds.has(nodeId)) {
    return nodeId;
  }

  nodeIds.add(nodeId);
  nodes.push({
    id: nodeId,
    type: UI_NODE_TYPE,
    label: componentName,
  });
  return nodeId;
}

function getSourceFile(filePath: string): ts.SourceFile | null {
  try {
    return ts.createSourceFile(
      filePath,
      fs.readFileSync(filePath, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
  } catch {
    return null;
  }
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

function getPageRouteFromFile(appDirectory: string, filePath: string): string {
  const relativePath = path.relative(appDirectory, filePath);
  const segments = relativePath.split(path.sep).filter(Boolean);

  if (segments.length === 0) {
    return "/";
  }

  segments.pop();

  const routeSegments = segments
    .filter((segment) => !ROUTE_GROUP_PATTERN.test(segment))
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });

  return routeSegments.length === 0 ? "/" : `/${routeSegments.join("/")}`;
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

  throw new Error("Could not find an app/ or src/app/ directory.");
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

function readGraphFile(filePath: string): Graph {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing ${path.relative(process.cwd(), filePath)}. Run arch:graph:endpoint-db first.`
    );
  }

  const parsedGraph = JSON.parse(fs.readFileSync(filePath, "utf8")) as Graph;
  if (!Array.isArray(parsedGraph.nodes) || !Array.isArray(parsedGraph.edges)) {
    throw new Error(`Invalid graph JSON in ${path.relative(process.cwd(), filePath)}.`);
  }

  return parsedGraph;
}

function buildEdgeKey(from: string, to: string, kind: Edge["kind"]): string {
  return `${from}::${to}::${kind}`;
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
