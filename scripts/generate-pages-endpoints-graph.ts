import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import type { Edge, EdgeKind, Graph, Node, NodeType } from "../arch/model";

// Build a single pages -> endpoints graph from App Router files and direct literal HTTP calls.
const SOURCE_FILE_PATTERN = /\.(ts|tsx|js|jsx)$/;
const ROUTE_GROUP_PATTERN = /^\(.*\)$/;
const PAGE_FILE_PATTERN = /^page\.(ts|tsx|js|jsx)$/;
const SKIPPED_DIRECTORIES = new Set(["node_modules", ".git", ".next"]);
const PAGE_NODE_TYPE: NodeType = "page";
const ENDPOINT_NODE_TYPE: NodeType = "endpoint";
const PAGE_ENDPOINT_EDGE_KIND: EdgeKind = "page-endpoint";
const EXTRA_SCAN_DIRS = ["src/features", "src/services", "src/lib", "src/hooks"];
const VERBOSE_ENDPOINT_SCAN = process.env.VERBOSE_ENDPOINT_SCAN === "1";
let httpClientIdentifiersSet = new Set<string>();
let httpClientMethodsSet = new Set<string>();

type HttpCall = {
  endpoint: string;
  method?: string;
};

type GraphAccumulator = {
  nodes: Node[];
  edges: Edge[];
  pageIdByRoute: Map<string, string>;
  endpointIdByUrl: Map<string, string>;
  edgeKeys: Set<string>;
};

async function main(): Promise<void> {
  const { httpClientIdentifiers, httpClientMethods } = await import(
    new URL("../arch/endpointDetectionConfig.ts", import.meta.url).href
  );
  httpClientIdentifiersSet = new Set(httpClientIdentifiers);
  httpClientMethodsSet = new Set(httpClientMethods);

  const projectRoot = findProjectRoot(process.cwd());
  const appDirectory = detectAppDirectory(projectRoot);
  const outputFile = resolveOutputFile(process.argv.slice(2), projectRoot);
  const sourceFileCache = new Map<string, ts.SourceFile>();
  const graphState: GraphAccumulator = {
    nodes: [],
    edges: [],
    pageIdByRoute: new Map(),
    endpointIdByUrl: new Map(),
    edgeKeys: new Set(),
  };

  for (const filePath of walkDirectory(appDirectory)) {
    if (isIgnoredSourceFile(filePath)) {
      continue;
    }

    if (isPageFile(filePath)) {
      ensurePageNode(graphState, getPageRouteFromFile(appDirectory, filePath));
    }

    const sourceFile = getSourceFile(filePath, sourceFileCache);
    if (!sourceFile) {
      continue;
    }

    const route = getPageRouteFromFile(appDirectory, filePath);

    for (const call of collectHttpCalls(sourceFile)) {
      logDetectedCall(projectRoot, filePath, route, call);
      addPageEndpointEdge(graphState, route, call.endpoint, call.method);
    }
  }

  for (const directoryPath of getExistingExtraScanDirs(projectRoot)) {
    for (const filePath of walkDirectory(directoryPath)) {
      if (isIgnoredSourceFile(filePath)) {
        continue;
      }

      const sourceFile = getSourceFile(filePath, sourceFileCache);
      if (!sourceFile) {
        continue;
      }

      for (const call of collectHttpCalls(sourceFile)) {
        logDetectedCall(projectRoot, filePath, null, call);
        ensureEndpointNode(graphState, call.endpoint, call.method);
      }
    }
  }

  const graph: Graph = {
    nodes: graphState.nodes.sort((left, right) => left.id.localeCompare(right.id)),
    edges: graphState.edges.sort(
      (left, right) =>
        left.from.localeCompare(right.from) ||
        left.to.localeCompare(right.to) ||
        String(left.meta?.method ?? "").localeCompare(String(right.meta?.method ?? ""))
    ),
  };

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(graph, null, 2)}\n`, "utf8");

  const pageNodeCount = graph.nodes.filter((node) => node.type === PAGE_NODE_TYPE).length;
  const endpointNodeCount = graph.nodes.filter((node) => node.type === ENDPOINT_NODE_TYPE).length;

  console.log(
    [
      `pages=${pageNodeCount}`,
      `endpoints=${endpointNodeCount}`,
      `edges=${graph.edges.length}`,
      `file=${path.relative(projectRoot, outputFile)}`,
    ].join(" ")
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});

function resolveOutputFile(args: string[], projectRoot: string): string {
  const outputIndex = args.indexOf("--output");
  const defaultOutput = path.join(projectRoot, "arch", "graph.pages-endpoints.json");

  if (outputIndex === -1 || !args[outputIndex + 1]) {
    return defaultOutput;
  }

  return path.resolve(projectRoot, args[outputIndex + 1]);
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

function getExistingExtraScanDirs(projectRoot: string): string[] {
  return EXTRA_SCAN_DIRS.map((directoryPath) => path.join(projectRoot, directoryPath)).filter(
    (directoryPath) => fs.existsSync(directoryPath) && fs.statSync(directoryPath).isDirectory()
  );
}

function detectAppDirectory(rootDirectory: string): string {
  const appPath = path.join(rootDirectory, "app");
  if (fs.existsSync(appPath) && fs.statSync(appPath).isDirectory()) {
    return appPath;
  }

  const srcAppPath = path.join(rootDirectory, "src", "app");
  if (fs.existsSync(srcAppPath) && fs.statSync(srcAppPath).isDirectory()) {
    return srcAppPath;
  }

  console.error("Could not find an app/ or src/app/ directory.");
  process.exit(1);
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

function getPageRouteFromFile(appDir: string, filePath: string): string {
  const relativePath = path.relative(appDir, filePath);
  const segments = relativePath.split(path.sep).filter(Boolean);

  if (segments.length === 0) {
    return "/";
  }

  segments.pop();

  const routeSegments = segments
    .filter((segment) => !ROUTE_GROUP_PATTERN.test(segment))
    .map(decodeRouteSegment);

  return routeSegments.length === 0 ? "/" : `/${routeSegments.join("/")}`;
}

function isPageFile(filePath: string): boolean {
  return PAGE_FILE_PATTERN.test(path.basename(filePath));
}

function decodeRouteSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function isIgnoredSourceFile(filePath: string): boolean {
  return (
    !SOURCE_FILE_PATTERN.test(filePath) ||
    filePath.includes(`${path.sep}__tests__${path.sep}`) ||
    filePath.endsWith(".test.ts") ||
    filePath.endsWith(".test.tsx") ||
    filePath.endsWith(".test.js") ||
    filePath.endsWith(".test.jsx")
  );
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
    const fileContents = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath,
      fileContents,
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

function collectHttpCalls(sourceFile: ts.SourceFile): HttpCall[] {
  const calls: HttpCall[] = [];
  const constMap = collectStringConstants(sourceFile);

  const visitNode = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const httpCall = parseHttpCall(node, constMap);
      if (httpCall) {
        calls.push(httpCall);
      }
    }

    ts.forEachChild(node, visitNode);
  };

  visitNode(sourceFile);

  return calls;
}

function collectStringConstants(sourceFile: ts.SourceFile): Map<string, string> {
  const constMap = new Map<string, string>();

  const visitNode = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isVariableDeclarationList(node.parent) &&
      (node.parent.flags & ts.NodeFlags.Const) !== 0
    ) {
      const stringValue = getStringLiteralValue(node.initializer);
      if (stringValue !== null) {
        constMap.set(node.name.text, stringValue);
      }
    }

    ts.forEachChild(node, visitNode);
  };

  visitNode(sourceFile);

  return constMap;
}

function parseHttpCall(node: ts.CallExpression, constMap: Map<string, string>): HttpCall | null {
  const callee = node.expression;
  const endpoint = getEndpointArgument(node.arguments[0], constMap);

  if (!endpoint) {
    return null;
  }

  if (ts.isIdentifier(callee) && httpClientIdentifiersSet.has(callee.text)) {
    return {
      endpoint,
      method: "GET",
    };
  }

  if (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(callee.expression) &&
    httpClientIdentifiersSet.has(callee.expression.text) &&
    httpClientMethodsSet.has(callee.name.text)
  ) {
    return {
      endpoint,
      method: callee.name.text.toUpperCase(),
    };
  }

  return null;
}

function getEndpointArgument(
  expression: ts.Expression | undefined,
  constMap: Map<string, string>
): string | null {
  if (!expression) {
    return null;
  }

  if (ts.isIdentifier(expression)) {
    return constMap.has(expression.text) ? (constMap.get(expression.text) ?? null) : null;
  }

  return getStringLiteralValue(expression);
}

function getStringLiteralValue(expression: ts.Expression): string | null {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }

  return null;
}

function ensurePageNode(graphState: GraphAccumulator, route: string): string {
  const existingId = graphState.pageIdByRoute.get(route);
  if (existingId) {
    return existingId;
  }

  const nodeId = `page:${route}`;
  graphState.pageIdByRoute.set(route, nodeId);
  graphState.nodes.push({
    id: nodeId,
    type: PAGE_NODE_TYPE,
    label: route,
  });
  return nodeId;
}

function ensureEndpointNode(
  graphState: GraphAccumulator,
  endpoint: string,
  method?: string
): string {
  const existingId = graphState.endpointIdByUrl.get(endpoint);
  if (existingId) {
    return existingId;
  }

  const nodeId = `endpoint:${endpoint}`;
  graphState.endpointIdByUrl.set(endpoint, nodeId);
  graphState.nodes.push({
    id: nodeId,
    type: ENDPOINT_NODE_TYPE,
    label: endpoint,
    meta: method ? { method } : undefined,
  });
  return nodeId;
}

function addPageEndpointEdge(
  graphState: GraphAccumulator,
  route: string,
  endpoint: string,
  method?: string
): void {
  const pageId = ensurePageNode(graphState, route);
  const endpointId = ensureEndpointNode(graphState, endpoint, method);
  const edgeKey = `${pageId}::${endpointId}::${method ?? ""}`;

  if (graphState.edgeKeys.has(edgeKey)) {
    return;
  }

  graphState.edgeKeys.add(edgeKey);
  graphState.edges.push({
    from: pageId,
    to: endpointId,
    kind: PAGE_ENDPOINT_EDGE_KIND,
    meta: method ? { method } : undefined,
  });
}

function logDetectedCall(
  projectRoot: string,
  filePath: string,
  route: string | null,
  call: HttpCall
): void {
  if (!VERBOSE_ENDPOINT_SCAN) {
    return;
  }

  const relativeFilePath = path.relative(projectRoot, filePath);
  const resolvedMethod = call.method ?? "GET";
  console.log(
    `[endpoint-scan] ${relativeFilePath} route=${route ?? "-"} ${resolvedMethod} ${call.endpoint}`
  );
}
