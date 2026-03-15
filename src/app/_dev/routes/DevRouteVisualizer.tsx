import { headers } from "next/headers";
import RouteGraphFlow, { type RouteFlowEdge, type RouteFlowNode } from "./RouteGraphFlow";

type VisualizerGraph = {
  nodes: RouteFlowNode[];
  edges: RouteFlowEdge[];
};

// Architecture visualization only: keep next-route-visualizer's route extraction isolated to this dev path.
export async function DevRouteVisualizer() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol =
    host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const baseURL = host ? `${protocol}://${host}` : "http://localhost:3000";
  const getNodesEdgesModule =
    (await import("next-route-visualizer/dist/visualizer/lib/index.js")) as {
      default: (props: {
        path?: string;
        baseURL?: string;
        displayColocating?: boolean;
      }) => VisualizerGraph;
    };
  const graph = getNodesEdgesModule.default({
    baseURL,
    displayColocating: false,
  });

  return <RouteGraphFlow initialNodes={graph.nodes} initialEdges={graph.edges} />;
}
