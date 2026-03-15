declare module "next-route-visualizer/dist/visualizer/lib/index.js" {
  const getNodesEdges: (props: {
    path?: string;
    baseURL?: string;
    displayColocating?: boolean;
  }) => unknown;

  export default getNodesEdges;
}
