'use client';

import { useCallback, useRef, useMemo } from 'react';
import {
    ReactFlow,
    Controls,
    MiniMap,
    Background,
    BackgroundVariant,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
    type OnNodesChange,
    type OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TableNode from './TableNode';
import RelationshipEdge from './RelationshipEdge';

interface ERCanvasProps {
    initialNodes: Node[];
    initialEdges: Edge[];
    onNodesChange?: (nodes: Node[]) => void;
    onNodeSelect?: (nodeId: string | null) => void;
}

export default function ERCanvas({
    initialNodes,
    initialEdges,
    onNodesChange: onNodesChangeCallback,
    onNodeSelect,
}: ERCanvasProps) {
    const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges);
    const flowRef = useRef<HTMLDivElement>(null);

    const nodeTypes = useMemo(
        () => ({
            tableNode: TableNode,
        }),
        []
    );

    const edgeTypes = useMemo(
        () => ({
            relationshipEdge: RelationshipEdge,
        }),
        []
    );

    const onNodesChange: OnNodesChange = useCallback(
        (changes) => {
            handleNodesChange(changes);
        },
        [handleNodesChange]
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes) => {
            handleEdgesChange(changes);
        },
        [handleEdgesChange]
    );

    const onNodeClick = useCallback(
        (_: React.MouseEvent, node: Node) => {
            onNodeSelect?.(node.id);
        },
        [onNodeSelect]
    );

    const onPaneClick = useCallback(() => {
        onNodeSelect?.(null);
    }, [onNodeSelect]);

    // Expose methods to parent
    const updateNodes = useCallback(
        (newNodes: Node[]) => setNodes(newNodes),
        [setNodes]
    );

    const updateEdges = useCallback(
        (newEdges: Edge[]) => setEdges(newEdges),
        [setEdges]
    );

    return (
        <div ref={flowRef} className="w-full h-full" id="er-canvas">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
                defaultEdgeOptions={{
                    type: 'relationshipEdge',
                    animated: true,
                }}
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    color="rgba(255,255,255,0.05)"
                />
                <Controls
                    showInteractive={false}
                    className="!bg-[var(--bg-secondary)] !border-[var(--border)] !rounded-lg !shadow-lg"
                />
                <MiniMap
                    nodeColor="#6366f1"
                    maskColor="rgba(0,0,0,0.7)"
                    className="!bg-[var(--bg-secondary)]"
                />
            </ReactFlow>
        </div>
    );
}

export { ERCanvas };
