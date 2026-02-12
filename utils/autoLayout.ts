import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 260;
const NODE_HEIGHT_BASE = 60;
const COLUMN_HEIGHT = 28;

export function getAutoLayout(
    nodes: Node[],
    edges: Edge[],
    direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: direction,
        nodesep: 80,
        ranksep: 100,
        marginx: 50,
        marginy: 50,
    });

    nodes.forEach((node) => {
        const columnCount = (node.data as any)?.columns?.length || 3;
        const height = NODE_HEIGHT_BASE + columnCount * COLUMN_HEIGHT;
        g.setNode(node.id, { width: NODE_WIDTH, height });
    });

    edges.forEach((edge) => {
        g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const layoutedNodes = nodes.map((node) => {
        const pos = g.node(node.id);
        const columnCount = (node.data as any)?.columns?.length || 3;
        const height = NODE_HEIGHT_BASE + columnCount * COLUMN_HEIGHT;
        return {
            ...node,
            position: {
                x: pos.x - NODE_WIDTH / 2,
                y: pos.y - height / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
}
