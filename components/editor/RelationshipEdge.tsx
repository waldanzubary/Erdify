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
                    stroke: '#ffffff',
                    strokeWidth: 4,
                    strokeOpacity: 0.05,
                }}
            />
            {/* Main line */}
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    stroke: '#ffffff',
                    strokeWidth: 1.5,
                    strokeOpacity: 0.4,
                }}
            />
            {/* Interactive area */}
            <BaseEdge
                path={edgePath}
                style={{
                    stroke: '#ffffff',
                    strokeWidth: 10,
                    strokeOpacity: 0,
                    cursor: 'pointer',
                }}
            />
        </>
    );
}

export default memo(RelationshipEdge);
