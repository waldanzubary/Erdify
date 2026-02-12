'use client';

import { memo } from 'react';
import {
    BaseEdge,
    getSmoothStepPath,
    type EdgeProps,
} from '@xyflow/react';

function RelationshipEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}: EdgeProps) {
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 24,
    });

    return (
        <>
            {/* Outer glow line */}
            <BaseEdge
                path={edgePath}
                style={{
                    ...style,
                    stroke: '#818cf8',
                    strokeWidth: 4,
                    strokeOpacity: 0.1,
                }}
            />
            {/* Main line */}
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    stroke: '#6366f1',
                    strokeWidth: 1.5,
                    strokeOpacity: 0.8,
                }}
            />
            {/* Interactive area */}
            <BaseEdge
                path={edgePath}
                style={{
                    stroke: '#6366f1',
                    strokeWidth: 10,
                    strokeOpacity: 0,
                    cursor: 'pointer',
                }}
            />
        </>
    );
}

export default memo(RelationshipEdge);
