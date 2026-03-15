"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { Graph } from "../../../../arch/model";
import type { ChangeKind, GraphDiff } from "../../../../arch/diff";

type ViewMode = "snapshot" | "diff";
type GraphNode = Graph["nodes"][number];
type GraphEdge = Graph["edges"][number];
type GroupedEndpoints = {
  pageId: string;
  pageLabel: string;
  endpointIds: string[];
  endpoints: string[];
};
type SelectedPageDetails = {
  pageId: string;
  pageLabel: string;
  endpoints: string[];
  dbEntities: string[];
  uiComponents: string[];
};
type UiUsageSummary = {
  componentName: string;
  pageCount: number;
};

interface RoutesVisualizerProps {
  snapshotGraph: Graph | null;
  baselineGraph: Graph | null;
  currentGraph: Graph | null;
  graphDiff: GraphDiff | null;
  visualizerPageIdsByRoute: Record<string, string[]>;
  visualizer: ReactNode;
}

export default function RoutesVisualizer({
  snapshotGraph,
  baselineGraph,
  currentGraph,
  graphDiff,
  visualizerPageIdsByRoute,
  visualizer,
}: RoutesVisualizerProps) {
  const [mode, setMode] = useState<ViewMode>("snapshot");
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [showPagesWithoutEndpoints, setShowPagesWithoutEndpoints] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const routeByVisualizerNodeId = buildRouteByVisualizerNodeId(visualizerPageIdsByRoute);
  const snapshotGroups = getPageEndpointGroups(snapshotGraph);
  const snapshotPageCount = countNodes(snapshotGraph, "page");
  const snapshotEndpointCount = countNodes(snapshotGraph, "endpoint");
  const snapshotDbCount = countNodes(snapshotGraph, "db");
  const snapshotUiCount = countNodes(snapshotGraph, "ui");
  const snapshotEdgeCount = snapshotGraph?.edges.length ?? 0;
  const currentPageCount = countNodes(currentGraph, "page");
  const currentEndpointCount = countNodes(currentGraph, "endpoint");
  const mergedNodesById = buildNodeMap(snapshotGraph, baselineGraph, currentGraph);
  const addedPages = getPageChanges(graphDiff, "added");
  const removedPages = getPageChanges(graphDiff, "removed");
  const addedEndpointGroups = getDiffEndpointGroups(graphDiff, mergedNodesById, "added");
  const removedEndpointGroups = getDiffEndpointGroups(graphDiff, mergedNodesById, "removed");
  const missingDiffData = !baselineGraph || !currentGraph || !graphDiff;
  const addedVisualizerNodeIds = addedPages.flatMap(
    (pageChange) => visualizerPageIdsByRoute[pageChange.label] ?? []
  );
  const visibleSnapshotGroups = snapshotGroups.filter((group) => {
    if (selectedRoute) {
      return group.pageLabel === selectedRoute;
    }

    return showPagesWithoutEndpoints || group.endpoints.length > 0;
  });
  const selectedPageDetails = getSelectedPageDetails(snapshotGraph, selectedRoute);
  const topUiComponents = getTopUiComponents(snapshotGraph, 5);

  useEffect(() => {
    const visualizerRoot = document.querySelector<HTMLElement>(".arch-map-visualizer");
    if (!visualizerRoot) {
      return;
    }

    const applyDiffHighlight = () => {
      visualizerRoot
        .querySelectorAll<HTMLElement>(".react-flow__node.arch-diff-added-node")
        .forEach((node) => node.classList.remove("arch-diff-added-node"));

      if (mode !== "diff") {
        return;
      }

      for (const nodeId of addedVisualizerNodeIds) {
        const nodeElement = visualizerRoot.querySelector<HTMLElement>(
          `.react-flow__node[data-id="${nodeId}"]`
        );
        nodeElement?.classList.add("arch-diff-added-node");
      }
    };

    applyDiffHighlight();

    const observer = new MutationObserver(() => applyDiffHighlight());
    observer.observe(visualizerRoot, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      visualizerRoot
        .querySelectorAll<HTMLElement>(".react-flow__node.arch-diff-added-node")
        .forEach((node) => node.classList.remove("arch-diff-added-node"));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, addedVisualizerNodeIds.join("|")]);

  useEffect(() => {
    const visualizerRoot = document.querySelector<HTMLElement>(".arch-map-visualizer");
    if (!visualizerRoot) {
      return;
    }

    const handleNodeClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const nodeElement = target.closest<HTMLElement>(".react-flow__node[data-id]");
      if (!nodeElement) {
        return;
      }

      const nodeId = nodeElement.dataset.id;
      if (!nodeId) {
        return;
      }

      const route = routeByVisualizerNodeId.get(nodeId);
      if (route) {
        setSelectedRoute(route);
        setShowSidebar(true);
      }
    };

    visualizerRoot.addEventListener("click", handleNodeClick);

    return () => {
      visualizerRoot.removeEventListener("click", handleNodeClick);
    };
  }, [routeByVisualizerNodeId]);

  return (
    <>
      <style jsx global>{`
        .arch-map-visualizer {
          isolation: isolate;
        }

        .arch-map-visualizer [data-menu] {
          position: relative !important;
          inset: auto !important;
          width: 100% !important;
          height: 100% !important;
          z-index: auto !important;
        }

        .arch-map-visualizer [data-menu] > :first-child {
          display: none !important;
        }

        .arch-map-visualizer [data-menu] > :nth-child(2) {
          width: 100% !important;
          height: 100% !important;
        }

        .arch-map-visualizer .react-flow__node.arch-diff-added-node {
          box-shadow:
            0 0 0 3px #16a34a,
            0 18px 36px rgba(22, 163, 74, 0.18);
          border-radius: 1.25rem;
        }
      `}</style>
      <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-[2200px] space-y-6">
          <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
              Development Only
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Architecture Map</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-600">
              Inspect the App Router graph alongside snapshot and diff data loaded directly from
              `arch/`.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Snapshot:{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run arch:graph:full</code>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Diff flow:{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5">
                npm run arch:graph:pages-endpoints:baseline
              </code>{" "}
              then{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5">
                npm run arch:graph:pages-endpoints:current
              </code>{" "}
              and{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5">
                npm run arch:diff:pages-endpoints
              </code>
              .
            </p>
            <p className="mt-2 text-sm text-slate-600">
              If the route graph trips on ReactFlow hot reload, hard refresh this page or start dev
              with <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run dev:webpack</code>.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ModeButton active={mode === "snapshot"} onClick={() => setMode("snapshot")}>
                Snapshot
              </ModeButton>
              <ModeButton active={mode === "diff"} onClick={() => setMode("diff")}>
                Diff
              </ModeButton>
              <ModeButton
                active={showSidebar}
                onClick={() => setShowSidebar((current) => !current)}
              >
                {showSidebar ? "Hide sidebar" : "Show sidebar"}
              </ModeButton>
            </div>
          </header>

          <div className={`grid gap-6 ${showSidebar ? "xl:grid-cols-[minmax(0,1fr)_24rem]" : ""}`}>
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold">Route Graph</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Powered by `next-route-visualizer`
                  {mode === "diff" ? "; added pages are highlighted in green." : "."}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Use the graph controls to zoom and switch between standard, compact, and dense
                  layouts.
                </p>
              </div>
              <div
                className={`arch-map-visualizer bg-white ${
                  showSidebar ? "h-[70vh] min-h-[640px]" : "h-[82vh] min-h-[760px]"
                }`}
              >
                {visualizer}
              </div>
            </section>

            {showSidebar ? (
              <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h2 className="text-lg font-semibold">
                    {mode === "snapshot" ? "Page → Endpoints" : "Graph Diff"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {mode === "snapshot"
                      ? "from `graph.full.json`"
                      : "from baseline/current/diff graph snapshots"}
                  </p>
                </div>

                <div className="space-y-4 p-4">
                  {mode === "snapshot" ? (
                    <>
                      <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Run{" "}
                        <code className="rounded bg-white px-1.5 py-0.5">
                          npm run arch:graph:full
                        </code>{" "}
                        before expecting snapshot data here.
                      </p>

                      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm text-slate-700">
                          Pages:{" "}
                          <span className="font-semibold text-slate-950">{snapshotPageCount}</span>,{" "}
                          Endpoints:{" "}
                          <span className="font-semibold text-slate-950">
                            {snapshotEndpointCount}
                          </span>
                          , DB entities:{" "}
                          <span className="font-semibold text-slate-950">{snapshotDbCount}</span>,
                          UI components:{" "}
                          <span className="font-semibold text-slate-950">{snapshotUiCount}</span>,
                          Edges:{" "}
                          <span className="font-semibold text-slate-950">{snapshotEdgeCount}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowPagesWithoutEndpoints((current) => !current)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                              showPagesWithoutEndpoints
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                            }`}
                          >
                            {showPagesWithoutEndpoints
                              ? "Hide pages without endpoints"
                              : "Show pages without endpoints"}
                          </button>
                          {selectedRoute ? (
                            <button
                              type="button"
                              onClick={() => setSelectedRoute(null)}
                              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
                            >
                              Clear selection
                            </button>
                          ) : null}
                        </div>
                        {selectedRoute ? (
                          <p className="text-xs text-slate-600">
                            Selected page:{" "}
                            <span className="font-mono font-semibold text-slate-900">
                              {selectedRoute}
                            </span>
                          </p>
                        ) : null}
                      </div>

                      {!snapshotGraph ? (
                        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                          No graph.full.json found. Run{" "}
                          <code className="rounded bg-white/80 px-1.5 py-0.5">
                            npm run arch:graph:full
                          </code>{" "}
                          to generate it.
                        </p>
                      ) : null}

                      {snapshotGraph && snapshotEndpointCount === 0 && snapshotDbCount === 0 ? (
                        <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                          No endpoints detected yet. The scan currently only picks up direct
                          string-literal calls (for example{" "}
                          <code className="rounded bg-white/80 px-1 py-0.5">
                            fetch(&quot;/api/...&quot;)
                          </code>
                          ). We&apos;ll widen this in the next steps.
                        </p>
                      ) : null}

                      {snapshotGraph && snapshotDbCount === 0 ? (
                        <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                          No DB usage detected yet. The scanner currently looks for patterns like{" "}
                          <code className="rounded bg-white/80 px-1 py-0.5">
                            prisma.&lt;model&gt;.&lt;action&gt;(...)
                          </code>
                          .
                        </p>
                      ) : null}

                      {snapshotGraph && snapshotUiCount === 0 ? (
                        <p className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                          No UI usage data detected yet. The scanner currently looks at imports from{" "}
                          <code className="rounded bg-white/80 px-1 py-0.5">src/components/**</code>{" "}
                          and components folders.
                        </p>
                      ) : null}

                      {selectedPageDetails ? (
                        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <h3 className="font-mono text-sm font-semibold text-slate-900">
                            {selectedPageDetails.pageLabel}
                          </h3>
                          <p className="mt-2 text-xs text-slate-600">
                            Endpoints:{" "}
                            <span className="font-semibold text-slate-950">
                              {selectedPageDetails.endpoints.length}
                            </span>
                            , DB entities:{" "}
                            <span className="font-semibold text-slate-950">
                              {selectedPageDetails.dbEntities.length}
                            </span>
                            , UI components:{" "}
                            <span className="font-semibold text-slate-950">
                              {selectedPageDetails.uiComponents.length}
                            </span>
                          </p>
                          <div className="mt-3 space-y-3">
                            <div>
                              <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
                                Endpoints This Page Calls
                              </p>
                              {selectedPageDetails.endpoints.length > 0 ? (
                                <ul className="mt-2 space-y-2">
                                  {selectedPageDetails.endpoints.map((endpoint) => (
                                    <li
                                      key={`${selectedPageDetails.pageId}-selected-${endpoint}`}
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700"
                                    >
                                      {endpoint}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                                  No endpoints detected for the selected page yet.
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
                                Data Touched By This Page
                              </p>
                              {selectedPageDetails.dbEntities.length > 0 ? (
                                <ul className="mt-2 space-y-2">
                                  {selectedPageDetails.dbEntities.map((dbEntity) => (
                                    <li
                                      key={`${selectedPageDetails.pageId}-db-${dbEntity}`}
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700"
                                    >
                                      {dbEntity}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                                  No DB entities are linked to the selected page yet.
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
                                UI Components Used On This Page
                              </p>
                              {selectedPageDetails.uiComponents.length > 0 ? (
                                <ul className="mt-2 space-y-2">
                                  {selectedPageDetails.uiComponents.map((componentName) => (
                                    <li
                                      key={`${selectedPageDetails.pageId}-ui-${componentName}`}
                                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700"
                                    >
                                      {componentName}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                                  No UI components were detected for the selected page yet.
                                </p>
                              )}
                            </div>
                          </div>
                        </section>
                      ) : null}

                      {!selectedPageDetails && topUiComponents.length > 0 ? (
                        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <h3 className="text-sm font-semibold text-slate-950">
                            Most Reused UI Components
                          </h3>
                          <ul className="mt-3 space-y-2">
                            {topUiComponents.map((component) => (
                              <li
                                key={`top-ui-${component.componentName}`}
                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                              >
                                <span className="font-mono text-xs text-slate-700">
                                  {component.componentName}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">
                                  {component.pageCount} page{component.pageCount === 1 ? "" : "s"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : null}

                      {snapshotGraph && visibleSnapshotGroups.length === 0 ? (
                        <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          {selectedRoute
                            ? "The selected page has no detected endpoints yet."
                            : "No page → endpoint edges are visible with the current filters."}
                        </p>
                      ) : null}

                      {visibleSnapshotGroups.map((group) => (
                        <section
                          key={group.pageId}
                          className={`rounded-2xl border p-4 ${
                            group.pageLabel === selectedRoute
                              ? "border-slate-900 bg-slate-100 ring-2 ring-slate-900/10"
                              : "border-slate-200 bg-slate-50/70"
                          }`}
                        >
                          <h3 className="font-mono text-sm font-semibold text-slate-900">
                            {group.pageLabel}
                          </h3>
                          {group.endpoints.length > 0 ? (
                            <ul className="mt-3 space-y-2">
                              {group.endpoints.map((endpoint) => (
                                <li
                                  key={`${group.pageId}-${endpoint}`}
                                  className="overflow-hidden rounded-xl border border-slate-200 bg-white px-3 py-2"
                                >
                                  <code className="block truncate text-xs text-slate-700">
                                    {endpoint}
                                  </code>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                              (no endpoints)
                            </p>
                          )}
                        </section>
                      ))}
                    </>
                  ) : (
                    <>
                      <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Diff mode uses the current route graph as the visual base and the generated
                        diff JSON for change lists.
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <StatCard label="Current Pages" value={currentPageCount} />
                        <StatCard label="Current Endpoints" value={currentEndpointCount} />
                        <StatCard label="Pages Added" value={addedPages.length} />
                        <StatCard label="Pages Removed" value={removedPages.length} />
                      </div>

                      {missingDiffData ? (
                        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                          No diff data found. Run{" "}
                          <code className="rounded bg-white/80 px-1.5 py-0.5">
                            npm run arch:graph:pages-endpoints:baseline
                          </code>{" "}
                          on main, then{" "}
                          <code className="rounded bg-white/80 px-1.5 py-0.5">
                            npm run arch:graph:pages-endpoints:current
                          </code>{" "}
                          and{" "}
                          <code className="rounded bg-white/80 px-1.5 py-0.5">
                            npm run arch:diff:pages-endpoints
                          </code>{" "}
                          on this branch.
                        </p>
                      ) : null}

                      {!missingDiffData &&
                      addedPages.length === 0 &&
                      removedPages.length === 0 &&
                      addedEndpointGroups.length === 0 &&
                      removedEndpointGroups.length === 0 ? (
                        <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                          No page or page-endpoint changes were found between the baseline and
                          current graphs.
                        </p>
                      ) : null}

                      {renderPageChangeSection("Pages added", addedPages, "emerald")}
                      {renderPageChangeSection("Pages removed", removedPages, "rose")}
                      {renderEndpointChangeSection(
                        "Endpoints added",
                        addedEndpointGroups,
                        "emerald"
                      )}
                      {renderEndpointChangeSection(
                        "Endpoints removed",
                        removedEndpointGroups,
                        "rose"
                      )}
                    </>
                  )}
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function renderPageChangeSection(
  title: string,
  pageChanges: GraphDiff["nodeChanges"],
  tone: "emerald" | "rose"
) {
  if (pageChanges.length === 0) {
    return null;
  }

  const toneClasses =
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/60";

  return (
    <section className={`rounded-2xl border p-4 ${toneClasses}`}>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <ul className="mt-3 space-y-2">
        {pageChanges.map((pageChange) => (
          <li
            key={`${title}-${pageChange.id}`}
            className="rounded-xl border border-white/80 bg-white px-3 py-2 font-mono text-xs text-slate-700"
          >
            {pageChange.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

function renderEndpointChangeSection(
  title: string,
  groups: GroupedEndpoints[],
  tone: "emerald" | "rose"
) {
  if (groups.length === 0) {
    return null;
  }

  const toneClasses =
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/60" : "border-rose-200 bg-rose-50/60";

  return (
    <section className={`rounded-2xl border p-4 ${toneClasses}`}>
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <div className="mt-3 space-y-3">
        {groups.map((group) => (
          <div
            key={`${title}-${group.pageId}`}
            className="rounded-xl border border-white/80 bg-white p-3"
          >
            <p className="font-mono text-xs font-semibold text-slate-900">{group.pageLabel}</p>
            <ul className="mt-2 space-y-2">
              {group.endpoints.map((endpoint) => (
                <li
                  key={`${group.pageId}-${endpoint}`}
                  className="font-mono text-xs text-slate-700"
                >
                  {endpoint}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function countNodes(graph: Graph | null, nodeType: GraphNode["type"]): number {
  return graph?.nodes.filter((node) => node.type === nodeType).length ?? 0;
}

function buildRouteByVisualizerNodeId(
  visualizerPageIdsByRoute: Record<string, string[]>
): Map<string, string> {
  const routeByVisualizerNodeId = new Map<string, string>();

  for (const [route, nodeIds] of Object.entries(visualizerPageIdsByRoute)) {
    for (const nodeId of nodeIds) {
      routeByVisualizerNodeId.set(nodeId, route);
    }
  }

  return routeByVisualizerNodeId;
}

function buildNodeMap(...graphs: Array<Graph | null>): Map<string, GraphNode> {
  const nodesById = new Map<string, GraphNode>();

  for (const graph of graphs) {
    for (const node of graph?.nodes ?? []) {
      if (!nodesById.has(node.id)) {
        nodesById.set(node.id, node);
      }
    }
  }

  return nodesById;
}

function getPageEndpointGroups(graph: Graph | null): GroupedEndpoints[] {
  if (!graph) {
    return [];
  }

  const nodesById = buildNodeMap(graph);
  const edgesByPageId = new Map<string, GraphEdge[]>();

  for (const edge of graph.edges) {
    if (edge.kind !== "page-endpoint") {
      continue;
    }

    const pageEdges = edgesByPageId.get(edge.from) ?? [];
    pageEdges.push(edge);
    edgesByPageId.set(edge.from, pageEdges);
  }

  return graph.nodes
    .filter((node) => node.type === "page")
    .sort((left, right) => left.label.localeCompare(right.label))
    .map((pageNode) => {
      const pageEdges = [...(edgesByPageId.get(pageNode.id) ?? [])];

      return {
        pageId: pageNode.id,
        pageLabel: pageNode.label,
        endpointIds: [...new Set(pageEdges.map((edge) => edge.to))],
        endpoints: [
          ...new Set(
            pageEdges.map((edge) =>
              formatEndpointDisplay(nodesById.get(edge.to), edge.meta?.method)
            )
          ),
        ].sort((left, right) => left.localeCompare(right)),
      };
    });
}

function getSelectedPageDetails(
  graph: Graph | null,
  selectedRoute: string | null
): SelectedPageDetails | null {
  if (!graph || !selectedRoute) {
    return null;
  }

  const nodesById = buildNodeMap(graph);
  const pageGroup = getPageEndpointGroups(graph).find((group) => group.pageLabel === selectedRoute);
  if (!pageGroup) {
    return null;
  }

  const endpointIds = new Set(pageGroup.endpointIds);
  const dbEntityIds = new Set<string>();
  const uiComponentIds = new Set<string>();

  for (const edge of graph.edges) {
    if (edge.kind === "endpoint-db" && endpointIds.has(edge.from)) {
      dbEntityIds.add(edge.to);
      continue;
    }

    if (edge.kind === "page-ui" && edge.from === pageGroup.pageId) {
      uiComponentIds.add(edge.to);
    }
  }

  return {
    pageId: pageGroup.pageId,
    pageLabel: pageGroup.pageLabel,
    endpoints: pageGroup.endpoints,
    dbEntities: [...dbEntityIds]
      .map((dbId) => nodesById.get(dbId)?.label ?? dbId.replace(/^db:/, ""))
      .sort((left, right) => left.localeCompare(right)),
    uiComponents: [...uiComponentIds]
      .map((uiId) => nodesById.get(uiId)?.label ?? uiId.replace(/^ui:/, ""))
      .sort((left, right) => left.localeCompare(right)),
  };
}

function getTopUiComponents(graph: Graph | null, limit: number): UiUsageSummary[] {
  if (!graph) {
    return [];
  }

  const nodesById = buildNodeMap(graph);
  const pageIdsByUiId = new Map<string, Set<string>>();

  for (const edge of graph.edges) {
    if (edge.kind !== "page-ui") {
      continue;
    }

    const pageIds = pageIdsByUiId.get(edge.to) ?? new Set<string>();
    pageIds.add(edge.from);
    pageIdsByUiId.set(edge.to, pageIds);
  }

  return [...pageIdsByUiId.entries()]
    .map(([uiId, pageIds]) => ({
      componentName: nodesById.get(uiId)?.label ?? uiId.replace(/^ui:/, ""),
      pageCount: pageIds.size,
    }))
    .sort(
      (left, right) =>
        right.pageCount - left.pageCount || left.componentName.localeCompare(right.componentName)
    )
    .slice(0, limit);
}

function getPageChanges(graphDiff: GraphDiff | null, change: ChangeKind): GraphDiff["nodeChanges"] {
  return (graphDiff?.nodeChanges ?? [])
    .filter((nodeChange) => nodeChange.type === "page" && nodeChange.change === change)
    .sort((left, right) => left.label.localeCompare(right.label));
}

function getDiffEndpointGroups(
  graphDiff: GraphDiff | null,
  nodesById: Map<string, GraphNode>,
  change: ChangeKind
): GroupedEndpoints[] {
  const endpointsByPageId = new Map<string, Set<string>>();

  for (const edgeChange of graphDiff?.edgeChanges ?? []) {
    if (edgeChange.kind !== "page-endpoint" || edgeChange.change !== change) {
      continue;
    }

    const pageEndpoints = endpointsByPageId.get(edgeChange.from) ?? new Set<string>();
    pageEndpoints.add(formatEndpointDisplay(nodesById.get(edgeChange.to)));
    endpointsByPageId.set(edgeChange.from, pageEndpoints);
  }

  return [...endpointsByPageId.entries()]
    .map(([pageId, endpoints]) => ({
      pageId,
      pageLabel: nodesById.get(pageId)?.label ?? pageId.replace(/^page:/, ""),
      endpointIds: [],
      endpoints: [...endpoints].sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) => left.pageLabel.localeCompare(right.pageLabel));
}

function formatEndpointDisplay(node?: GraphNode, method?: unknown): string {
  const resolvedMethod =
    typeof method === "string"
      ? method
      : typeof node?.meta?.method === "string"
        ? node.meta.method
        : "";
  const label = node?.label ?? "";

  if (!resolvedMethod) {
    return label || "Unknown endpoint";
  }

  return label.startsWith(`${resolvedMethod} `) ? label : `${resolvedMethod} ${label}`;
}
