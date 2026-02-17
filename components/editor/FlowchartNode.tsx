
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Database, Activity, Play, Octagon, HelpCircle, ArrowRightLeft } from 'lucide-react';

const FlowchartNode = ({ data, selected }: NodeProps) => {
    const { label, type } = data;

    // Academic Standard Colors
    const getColors = (type: string) => {
        switch (type) {
            case 'start':
            case 'end':
                return { bg: 'bg-[#ff9c9c]', border: 'border-[#d64545]', text: 'text-black' };
            case 'process':
                return { bg: 'bg-[#a3e635]', border: 'border-[#4d7c0f]', text: 'text-black' };
            case 'decision':
                return { bg: 'bg-[#7dd3fc]', border: 'border-[#0369a1]', text: 'text-black' };
            case 'database':
                return { bg: 'bg-[#c084fc]', border: 'border-[#7e22ce]', text: 'text-black' };
            case 'data':
                return { bg: 'bg-[#93c5fd]', border: 'border-[#1d4ed8]', text: 'text-black' };
            default:
                return { bg: 'bg-slate-200', border: 'border-slate-400', text: 'text-black' };
        }
    };

    const colors = getColors(type as string);
    const isDecision = type === 'decision';
    const isDatabase = type === 'database';
    const isTerminator = type === 'start' || type === 'end';
    const isData = type === 'data';

    let shapeClass = "border-2 flex items-center justify-center p-4 transition-all duration-300 ";
    let inlineStyle: React.CSSProperties = {};

    if (isDecision) {
        shapeClass += "w-[130px] h-[130px]";
        inlineStyle = { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
    } else if (isTerminator) {
        shapeClass += "rounded-[40px] px-8 min-w-[140px] min-h-[60px]";
    } else if (isData) {
        shapeClass += "px-8 min-w-[160px] min-h-[60px]";
        inlineStyle = { clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)' };
    } else if (isDatabase) {
        // CYLINDER BODY (Fixed clipping/ears)
        shapeClass += "w-[140px] h-[90px] pt-8 pb-4 border-t-0";
        inlineStyle = {
            borderRadius: '0 0 50% 50% / 0 0 25% 25%',
        };
    } else {
        shapeClass += "rounded-md min-w-[150px] min-h-[60px]";
    }

    return (
        <div className="relative group flex items-center justify-center">
            {/* Database Top Cap */}
            {isDatabase && (
                <div
                    className={`absolute top-0 w-[140px] h-10 ${colors.bg} ${colors.border} border-2 rounded-[50%] z-10 translate-y-[-1px]`}
                />
            )}

            <div
                className={`
                    ${shapeClass} ${colors.bg} ${colors.border} ${colors.text}
                    ${selected ? 'ring-4 ring-white/40 shadow-2xl scale-105' : 'shadow-md'}
                    hover:brightness-105 active:scale-95
                    ${isDatabase ? 'z-0 translate-y-4 border-t-0' : ''}
                `}
                style={inlineStyle}
            >
                <div className={`flex flex-col items-center gap-1 w-full px-2 ${isDatabase ? 'mt-2' : ''}`}>
                    <span className="text-[11px] font-bold leading-tight text-center uppercase tracking-tight break-words">
                        {label as string}
                    </span>
                </div>
            </div>

            {/* Connection Handles */}
            <Handle
                type="target"
                position={Position.Top}
                style={{ top: isDecision ? '0%' : isDatabase ? '5px' : '-5px', zIndex: 30 }}
                className="!w-3 !h-3 !bg-slate-900 !border-white !border-2"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                style={{ bottom: isDecision ? '0%' : isDatabase ? '-4px' : '-5px', zIndex: 30 }}
                className="!w-3 !h-3 !bg-slate-900 !border-white !border-2"
            />

            {(isDecision || isData) && (
                <>
                    <Handle
                        type="source"
                        position={Position.Left}
                        id="left"
                        style={{ left: isDecision ? '0%' : '5%', zIndex: 30 }}
                        className="!w-3 !h-3 !bg-slate-900 !border-white !border-2"
                    />
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="right"
                        style={{ right: isDecision ? '0%' : '5%', zIndex: 30 }}
                        className="!w-3 !h-3 !bg-slate-900 !border-white !border-2"
                    />
                </>
            )}
        </div>
    );
};

export default memo(FlowchartNode);
