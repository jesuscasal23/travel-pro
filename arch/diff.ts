import type { Edge, Graph, Node } from "./model";

export type ChangeKind = "added" | "removed" | "unchanged";

export type NodeChange = {
  id: string;
  type: Node["type"];
  label: string;
  change: ChangeKind;
};

export type EdgeChange = {
  from: string;
  to: string;
  kind: Edge["kind"];
  change: ChangeKind;
};

export type GraphDiff = {
  nodeChanges: NodeChange[];
  edgeChanges: EdgeChange[];
};

export function diffGraphs(baseline: Graph, current: Graph): GraphDiff {
  const baselineNodes = new Map(baseline.nodes.map((node) => [node.id, node] as const));
  const currentNodes = new Map(current.nodes.map((node) => [node.id, node] as const));

  const nodeChanges: NodeChange[] = [];

  for (const node of current.nodes) {
    nodeChanges.push({
      id: node.id,
      type: node.type,
      label: node.label,
      change: baselineNodes.has(node.id) ? "unchanged" : "added",
    });
  }

  for (const node of baseline.nodes) {
    if (currentNodes.has(node.id)) {
      continue;
    }

    nodeChanges.push({
      id: node.id,
      type: node.type,
      label: node.label,
      change: "removed",
    });
  }

  const baselineEdges = new Map(baseline.edges.map((edge) => [getEdgeKey(edge), edge] as const));
  const currentEdges = new Map(current.edges.map((edge) => [getEdgeKey(edge), edge] as const));

  const edgeChanges: EdgeChange[] = [];

  for (const edge of current.edges) {
    edgeChanges.push({
      from: edge.from,
      to: edge.to,
      kind: edge.kind,
      change: baselineEdges.has(getEdgeKey(edge)) ? "unchanged" : "added",
    });
  }

  for (const edge of baseline.edges) {
    if (currentEdges.has(getEdgeKey(edge))) {
      continue;
    }

    edgeChanges.push({
      from: edge.from,
      to: edge.to,
      kind: edge.kind,
      change: "removed",
    });
  }

  return {
    nodeChanges: nodeChanges.sort(
      (left, right) =>
        left.change.localeCompare(right.change) ||
        left.type.localeCompare(right.type) ||
        left.id.localeCompare(right.id)
    ),
    edgeChanges: edgeChanges.sort(
      (left, right) =>
        left.change.localeCompare(right.change) ||
        left.kind.localeCompare(right.kind) ||
        left.from.localeCompare(right.from) ||
        left.to.localeCompare(right.to)
    ),
  };
}

function getEdgeKey(edge: Pick<Edge, "from" | "to" | "kind">): string {
  return `${edge.from}|${edge.to}|${edge.kind}`;
}
