import type { Metadata } from "next";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, dirname, relative, resolve } from "node:path";
import RoutesVisualizer from "./RoutesVisualizer";
import type { Graph } from "../../../../arch/model";
import type { GraphDiff } from "../../../../arch/diff";

export const metadata: Metadata = {
  title: "Architecture Map",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RoutesDevPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-16 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
            Development Only
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Architecture Map</h1>
          <p className="mt-3 text-sm text-slate-600">Not available in production.</p>
        </div>
      </main>
    );
  }

  const [snapshotGraph, baselineGraph, currentGraph, graphDiff] = await Promise.all([
    readGraphFile("graph.full.json"),
    readGraphFile("graph.pages-endpoints.baseline.json"),
    readGraphFile("graph.pages-endpoints.current.json"),
    readDiffFile("graph.pages-endpoints.diff.json"),
  ]);
  const visualizerPageIdsByRoute = buildVisualizerPageIdsByRoute();
  const { DevRouteVisualizer } = await import("./DevRouteVisualizer");

  return (
    <RoutesVisualizer
      snapshotGraph={snapshotGraph}
      baselineGraph={baselineGraph}
      currentGraph={currentGraph}
      graphDiff={graphDiff}
      visualizerPageIdsByRoute={visualizerPageIdsByRoute}
      visualizer={<DevRouteVisualizer />}
    />
  );
}

async function readGraphFile(fileName: string): Promise<Graph | null> {
  try {
    const graphPath = resolve(process.cwd(), "arch", fileName);
    const graphContents = await readFile(graphPath, "utf8");
    const parsedGraph = JSON.parse(graphContents);

    if (!isGraph(parsedGraph)) {
      return null;
    }

    return parsedGraph;
  } catch {
    return null;
  }
}

async function readDiffFile(fileName: string): Promise<GraphDiff | null> {
  try {
    const diffPath = resolve(process.cwd(), "arch", fileName);
    const diffContents = await readFile(diffPath, "utf8");
    const parsedDiff = JSON.parse(diffContents) as GraphDiff;

    if (!Array.isArray(parsedDiff.nodeChanges) || !Array.isArray(parsedDiff.edgeChanges)) {
      return null;
    }

    return parsedDiff;
  } catch {
    return null;
  }
}

function buildVisualizerPageIdsByRoute(): Record<string, string[]> {
  const projectRoot = process.cwd();
  const appDirectory = detectAppDirectory(projectRoot);

  if (!appDirectory) {
    return {};
  }

  const pageIdsByRoute = new Map<string, Set<string>>();

  for (const filePath of walkFiles(appDirectory)) {
    if (!isPageFile(filePath)) {
      continue;
    }

    const route = getPageRouteFromFile(appDirectory, filePath);
    const visualizerPath = `./${relative(projectRoot, dirname(filePath)).replace(/\\/g, "/")}`;
    const visualizerNodeId = createHash("sha256").update(visualizerPath).digest("hex");
    const routeIds = pageIdsByRoute.get(route) ?? new Set<string>();
    routeIds.add(visualizerNodeId);
    pageIdsByRoute.set(route, routeIds);
  }

  return Object.fromEntries(
    [...pageIdsByRoute.entries()]
      .sort(([leftRoute], [rightRoute]) => leftRoute.localeCompare(rightRoute))
      .map(([route, routeIds]) => [route, [...routeIds]])
  );
}

function detectAppDirectory(projectRoot: string): string | null {
  const appDirectory = resolve(projectRoot, "app");
  if (existsSync(appDirectory) && statSync(appDirectory).isDirectory()) {
    return appDirectory;
  }

  const srcAppDirectory = resolve(projectRoot, "src", "app");
  if (existsSync(srcAppDirectory) && statSync(srcAppDirectory).isDirectory()) {
    return srcAppDirectory;
  }

  return null;
}

function walkFiles(directoryPath: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = resolve(directoryPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(entryPath));
      continue;
    }

    if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

function isPageFile(filePath: string): boolean {
  return /^page\.(ts|tsx|js|jsx)$/.test(basename(filePath));
}

function getPageRouteFromFile(appDirectory: string, filePath: string): string {
  const relativePath = relative(appDirectory, filePath);
  const segments = relativePath.split(/[/\\]/).filter(Boolean);

  if (segments.length === 0) {
    return "/";
  }

  segments.pop();

  const routeSegments = segments
    .filter((segment) => !/^\(.*\)$/.test(segment))
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });

  return routeSegments.length === 0 ? "/" : `/${routeSegments.join("/")}`;
}

function isGraph(value: unknown): value is Graph {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.nodes) &&
    value.nodes.every((node) => isGraphNode(node)) &&
    Array.isArray(value.edges) &&
    value.edges.every((edge) => isGraphEdge(edge))
  );
}

function isGraphNode(value: unknown): value is Graph["nodes"][number] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    (value.type === "page" ||
      value.type === "endpoint" ||
      value.type === "db" ||
      value.type === "ui") &&
    typeof value.label === "string" &&
    (value.meta === undefined || isRecord(value.meta))
  );
}

function isGraphEdge(value: unknown): value is Graph["edges"][number] {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.from === "string" &&
    typeof value.to === "string" &&
    (value.kind === "page-endpoint" || value.kind === "endpoint-db" || value.kind === "page-ui") &&
    (value.meta === undefined || isRecord(value.meta))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
