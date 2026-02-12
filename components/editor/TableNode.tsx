'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Database, Key, Link2, Hash, Type, Calendar, ToggleLeft, Braces } from 'lucide-react';
import type { ERColumn } from '@/lib/types';

interface TableNodeData {
    label: string;
    columns: ERColumn[];
    selected?: boolean;
}

const getTypeIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('INT')) return <Hash size={10} />;
    if (t.includes('CHAR') || t.includes('TEXT')) return <Type size={10} />;
    if (t.includes('DATE') || t.includes('TIME')) return <Calendar size={10} />;
    if (t.includes('BOOL') || t.includes('BIT')) return <ToggleLeft size={10} />;
    if (t.includes('JSON')) return <Braces size={10} />;
    return <Type size={10} />;
};

function TableNode({ data, selected }: NodeProps) {
    const nodeData = data as unknown as TableNodeData;
    const { label, columns = [] } = nodeData;

    return (
        <div
            className={`min-w-[260px] glass rounded-2xl overflow-hidden transition-all duration-300 border ${selected
                ? 'border-indigo-500/50 shadow-[0_0_40px_rgba(99,102,241,0.2)] ring-1 ring-indigo-500/30'
                : 'border-white/10 hover:border-white/20'
                }`}
        >
            {/* Table Header */}
            <div className="px-4 py-3 bg-white/[0.03] border-b border-white/5 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${selected ? 'bg-indigo-500 text-white' : 'bg-white/5 text-indigo-400'}`}>
                    <Database size={14} />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[var(--text-muted)] leading-none mb-1">Entity</span>
                    <span className="text-sm font-bold text-white truncate leading-none">
                        {label}
                    </span>
                </div>
                <div className="ml-auto flex items-center px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                    <span className="text-[9px] font-black text-white/50">{columns.length}</span>
                </div>
            </div>

            {/* Columns Area */}
            <div className="py-2">
                {columns.map((col, i) => (
                    <div
                        key={`${col.name}-${i}`}
                        className="relative flex items-center gap-3 px-4 py-2 hover:bg-white/[0.03] transition-colors group"
                    >
                        {/* Target handle - Styled as a small glowing dot */}
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={`${label}-${col.name}-target`}
                            className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-[#0d0d0f] !-left-1.25 hover:!scale-125 transition-transform"
                            style={{ top: '50%' }}
                        />

                        {/* Column Metadata Icon */}
                        <div className="shrink-0">
                            {col.isPrimaryKey ? (
                                <div className="w-5 h-5 rounded-md bg-yellow-500/10 flex items-center justify-center text-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.2)]">
                                    <Key size={10} />
                                </div>
                            ) : col.isForeignKey ? (
                                <div className="w-5 h-5 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.2)]">
                                    <Link2 size={10} />
                                </div>
                            ) : (
                                <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[var(--text-muted)] group-hover:text-white transition-colors">
                                    {getTypeIcon(col.type)}
                                </div>
                            )}
                        </div>

                        {/* Name & Type */}
                        <div className="flex flex-1 flex-col min-w-0">
                            <span className={`text-[12px] font-bold tracking-tight truncate ${col.isPrimaryKey ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                                {col.name}
                            </span>
                        </div>

                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]/60 bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
                            {col.type.split('(')[0]}
                        </span>

                        {/* Source handle */}
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`${label}-${col.name}-source`}
                            className="!w-2.5 !h-2.5 !bg-indigo-500 !border-2 !border-[#0d0d0f] !-right-1.25 hover:!scale-125 transition-transform"
                            style={{ top: '50%' }}
                        />
                    </div>
                ))}
            </div>

            {/* Subtle footer gradient */}
            <div className="h-1 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent" />
        </div>
    );
}

export default memo(TableNode);
