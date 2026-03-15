import fs from "node:fs";
import path from "node:path";
import type { Graph } from "../arch/model";
import type { GraphDiff } from "../arch/diff";

async function main(): Promise<void> {
  const { diffGraphs } = await import(new URL("../arch/diff.ts", import.meta.url).href);
  const projectRoot = findProjectRoot(process.cwd());
  const baselinePath = resolveArgPath(
    process.argv.slice(2),
    "--baseline",
    path.join(projectRoot, "arch", "graph.pages-endpoints.baseline.json"),
    projectRoot
  );
  const currentPath = resolveArgPath(
    process.argv.slice(2),
    "--current",
    path.join(projectRoot, "arch", "graph.pages-endpoints.current.json"),
    projectRoot
  );
  const outputPath = resolveArgPath(
    process.argv.slice(2),
    "--output",
    path.join(projectRoot, "arch", "graph.pages-endpoints.diff.json"),
    projectRoot
  );

  if (!fs.existsSync(baselinePath)) {
    console.error(`Missing baseline graph: ${path.relative(projectRoot, baselinePath)}`);
    process.exit(1);
  }

  if (!fs.existsSync(currentPath)) {
    console.error(`Missing current graph: ${path.relative(projectRoot, currentPath)}`);
    process.exit(1);
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8")) as Graph;
  const current = JSON.parse(fs.readFileSync(currentPath, "utf8")) as Graph;
  const diff = diffGraphs(baseline, current);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(diff, null, 2)}\n`, "utf8");

  const addedPages = countNodeChanges(diff, "page", "added");
  const removedPages = countNodeChanges(diff, "page", "removed");
  const addedEndpoints = countNodeChanges(diff, "endpoint", "added");
  const removedEndpoints = countNodeChanges(diff, "endpoint", "removed");
  const addedEdges = countEdgeChanges(diff, "added");
  const removedEdges = countEdgeChanges(diff, "removed");

  console.log(
    [
      `pages=+${addedPages}/-${removedPages}`,
      `endpoints=+${addedEndpoints}/-${removedEndpoints}`,
      `edges=+${addedEdges}/-${removedEdges}`,
      `file=${path.relative(projectRoot, outputPath)}`,
    ].join(" ")
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});

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

function resolveArgPath(
  args: string[],
  argName: string,
  defaultPath: string,
  projectRoot: string
): string {
  const argIndex = args.indexOf(argName);
  if (argIndex === -1 || !args[argIndex + 1]) {
    return defaultPath;
  }

  return path.resolve(projectRoot, args[argIndex + 1]);
}

function countNodeChanges(
  diff: GraphDiff,
  nodeType: Graph["nodes"][number]["type"],
  change: GraphDiff["nodeChanges"][number]["change"]
): number {
  return diff.nodeChanges.filter((node) => node.type === nodeType && node.change === change).length;
}

function countEdgeChanges(
  diff: GraphDiff,
  change: GraphDiff["edgeChanges"][number]["change"]
): number {
  return diff.edgeChanges.filter((edge) => edge.change === change).length;
}
