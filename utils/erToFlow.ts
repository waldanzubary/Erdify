import type { Node, Edge } from '@xyflow/react';
import type { ERSchema } from '../lib/types';

export function schemaToFlow(schema: ERSchema): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = schema.tables.map((table, index) => ({
        id: table.id,
        type: 'tableNode',
        position: table.position || { x: (index % 3) * 320, y: Math.floor(index / 3) * 350 },
        data: {
            label: table.name,
            columns: table.columns,
        },
    }));

    const edges: Edge[] = schema.relationships.map((rel) => ({
        id: rel.id,
        source: rel.sourceTable,
        target: rel.targetTable,
        sourceHandle: `${rel.sourceTable}-${rel.sourceColumn}-source`,
        targetHandle: `${rel.targetTable}-${rel.targetColumn}-target`,
        type: 'relationshipEdge',
        data: {
            sourceColumn: rel.sourceColumn,
            targetColumn: rel.targetColumn,
            type: rel.type,
        },
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
    }));

    return { nodes, edges };
}

export function flowToSchema(
    nodes: Node[],
    edges: Edge[],
    existingSchema: ERSchema
): ERSchema {
    const tables = existingSchema.tables.map((table) => {
        const node = nodes.find((n) => n.id === table.id);
        return {
            ...table,
            position: node?.position,
        };
    });

    return {
        tables,
        relationships: existingSchema.relationships,
    };
}
