"use client";

import { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  type NodeProps,
  Handle,
  Position,
  useNodesInitialized,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/base.css";

type NextFile = {
  name: string;
  extension: string;
  isClient: boolean;
};

type RouteNodeData = {
  name?: string;
  path?: string;
  type?: string;
  color?: string;
  borderColor?: string;
  nextFiles?: NextFile[];
  otherFiles?: NextFile[];
};

export type RouteFlowNode = Node<RouteNodeData>;
export type RouteFlowEdge = Edge;

type DensityMode = "standard" | "compact" | "dense";

const DENSITY_CONFIG: Record<
  DensityMode,
  {
    label: string;
    fitPadding: number;
    zoomScale: number;
  }
> = {
  standard: {
    label: "Standard",
    fitPadding: 0.14,
    zoomScale: 1,
  },
  compact: {
    label: "Compact",
    fitPadding: 0.08,
    zoomScale: 0.88,
  },
  dense: {
    label: "Dense",
    fitPadding: 0.04,
    zoomScale: 0.76,
  },
};

const nodeTypes = {
  routeNode: RouteGraphNode,
};

export default function RouteGraphFlow({
  initialNodes,
  initialEdges,
}: {
  initialNodes: RouteFlowNode[];
  initialEdges: RouteFlowEdge[];
}) {
  const [density, setDensity] = useState<DensityMode>("dense");
  const densityConfig = DENSITY_CONFIG[density];

  const nodes = useMemo(
    () =>
      initialNodes.map((node) => ({
        ...node,
        draggable: false,
        deletable: false,
      })),
    [initialNodes]
  );

  const edges = useMemo(
    () =>
      initialEdges.map((edge) => ({
        ...edge,
        animated: false,
        deletable: false,
      })),
    [initialEdges]
  );

  return (
    <div className="relative h-full w-full bg-white">
      <div className="pointer-events-none absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        {(
          Object.entries(DENSITY_CONFIG) as Array<
            [DensityMode, (typeof DENSITY_CONFIG)[DensityMode]]
          >
        ).map(([mode, config]) => (
          <button
            key={mode}
            type="button"
            onClick={() => setDensity(mode)}
            className={`pointer-events-auto rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              mode === density
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: densityConfig.fitPadding, minZoom: 0.05, maxZoom: 1 }}
        minZoom={0.05}
        maxZoom={1.5}
        panOnDrag
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        className="bg-white"
      >
        <FlowAutoFit
          dependencyKey={`${density}-${nodes.length}-${edges.length}`}
          fitPadding={densityConfig.fitPadding}
          zoomScale={densityConfig.zoomScale}
        />
        <Background color="#e2e8f0" variant={BackgroundVariant.Dots} gap={20} size={1.1} />
        <MiniMap
          pannable
          zoomable
          nodeBorderRadius={12}
          nodeStrokeWidth={2}
          nodeColor={(node) => (typeof node.data?.color === "string" ? node.data.color : "#e2e8f0")}
        />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
    </div>
  );
}

function RouteGraphNode({ data, selected }: NodeProps<RouteNodeData>) {
  const fileSummary = getFileSummary(data.nextFiles);
  const runtimeLabel = getRuntimeLabel(data.nextFiles);

  return (
    <>
      <Handle
        id="Normal"
        type="target"
        position={Position.Top}
        style={{ ...hiddenHandleStyle, top: `${-HANDLE_SIZE}px` }}
      />
      <Handle
        id="Group"
        type="target"
        position={Position.Left}
        style={{ ...hiddenHandleStyle, left: `${-HANDLE_SIZE}px` }}
      />
      <Handle
        id="Group"
        type="source"
        position={Position.Right}
        style={{ ...hiddenHandleStyle, right: `${-HANDLE_SIZE}px` }}
      />
      <Handle
        id="Normal"
        type="source"
        position={Position.Bottom}
        style={{ ...hiddenHandleStyle, bottom: `${-HANDLE_SIZE}px` }}
      />

      <div
        className={`flex h-full w-full flex-col justify-between overflow-hidden rounded-[inherit] ${
          selected ? "ring-2 ring-slate-950/15" : ""
        }`}
        style={{ padding: 16 }}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className="rounded-full border border-black/10 bg-white/75 px-2 py-1 font-semibold tracking-[0.16em] uppercase backdrop-blur"
            style={{ fontSize: "0.72rem", color: data.borderColor ?? "#0f172a" }}
          >
            {data.type ?? "Route"}
          </span>
          {runtimeLabel ? (
            <span
              className="rounded-full px-2 py-1 font-semibold tracking-[0.14em] text-white uppercase"
              style={{
                fontSize: "0.72rem",
                backgroundColor: data.borderColor ?? "#0f172a",
              }}
            >
              {runtimeLabel}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 items-center justify-center py-2 text-center">
          <p
            className="line-clamp-4 text-[0.95rem] leading-tight font-semibold text-slate-950"
            title={data.path ?? data.name}
          >
            {data.name ?? data.path ?? "Route"}
          </p>
        </div>

        <div className="min-h-[1rem] text-center">
          {fileSummary ? (
            <p className="line-clamp-1 font-mono text-[0.72rem] font-semibold text-slate-600">
              {fileSummary}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

const HANDLE_SIZE = 5;

const hiddenHandleStyle = {
  width: `${HANDLE_SIZE}px`,
  height: `${HANDLE_SIZE}px`,
  minWidth: 0,
  minHeight: 0,
  opacity: 0,
  background: "transparent",
  border: "none",
} as const;

function FlowAutoFit({
  dependencyKey,
  fitPadding,
  zoomScale,
}: {
  dependencyKey: string;
  fitPadding: number;
  zoomScale: number;
}) {
  const reactFlow = useReactFlow<RouteNodeData>();
  const nodesInitialized = useNodesInitialized();

  useEffect(() => {
    if (!nodesInitialized) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void reactFlow.fitView({
        duration: 250,
        minZoom: 0.05,
        maxZoom: 1,
        padding: fitPadding,
      });

      window.requestAnimationFrame(() => {
        const viewport = reactFlow.getViewport();
        void reactFlow.zoomTo(clamp(viewport.zoom * zoomScale, 0.05, 1), {
          duration: 220,
        });
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [dependencyKey, fitPadding, nodesInitialized, reactFlow, zoomScale]);

  return null;
}

function getFileSummary(files?: NextFile[]): string | null {
  const names = [...new Set((files ?? []).map((file) => file.name.split(".")[0]))].slice(0, 3);

  return names.length > 0 ? names.join(" · ") : null;
}

function getRuntimeLabel(files?: NextFile[]): string | null {
  const pageFile = files?.find((file) => file.name.startsWith("page"));

  if (!pageFile) {
    return null;
  }

  return pageFile.isClient ? "Client" : "Server";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
