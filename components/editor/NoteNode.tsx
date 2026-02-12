'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { MessageSquare, User, Clock } from 'lucide-react';

interface NoteNodeData {
    id: string;
    content: string;
    userName: string;
    createdAt: string | Date;
    status: string;
    canEdit?: boolean;
    onStatusToggle?: (id: string, currentStatus: string) => void;
}

function NoteNode({ data, selected }: NodeProps) {
    const { id, content, userName, createdAt, status = 'todo', canEdit, onStatusToggle } = data as unknown as NoteNodeData;

    const formatTime = (date: string | Date) => {
        return new Date(date).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusStyles = (s: string) => {
        switch (s) {
            case 'done': return { color: 'bg-emerald-500', label: 'Done', text: 'text-emerald-400' };
            case 'working': return { color: 'bg-amber-500', label: 'Working on', text: 'text-amber-400' };
            default: return { color: 'bg-indigo-500', label: 'Todo', text: 'text-indigo-400' };
        }
    };

    const styles = getStatusStyles(status);

    return (
        <div
            className={`w-[240px] glass rounded-2xl p-0 shadow-2xl transition-all duration-300 relative overflow-hidden ${selected
                ? 'border-white/40 ring-4 ring-white/10 scale-[1.02]'
                : 'hover:border-white/20'
                }`}
        >
            {/* Top Accent Bar (Status based) */}
            <div className={`h-1 w-full ${styles.color}/50`} />

            <div className="p-4 pt-3 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-1.5">
                        <User size={10} className={styles.text} />
                        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                            {userName}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span className="text-[9px] font-bold text-[var(--text-muted)]">
                            {formatTime(createdAt)}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="min-h-[40px]">
                    <p className="text-[12px] leading-relaxed font-medium text-[var(--text-secondary)] break-words selection:bg-indigo-500/30">
                        {content}
                    </p>
                </div>

                {/* Footer Decor & Status Badge */}
                <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/5">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (canEdit && onStatusToggle) {
                                onStatusToggle(id, status);
                            }
                        }}
                        className={`flex items-center gap-2 ${canEdit ? 'hover:bg-white/5 cursor-pointer -m-1 p-1 rounded-lg transition-colors' : 'cursor-default'}`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${styles.color} animate-pulse`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${styles.text}`}>
                            {styles.label}
                        </span>
                    </button>
                    <MessageSquare size={12} className="text-white/10" />
                </div>
            </div>

            {/* Handles for connection */}
            <Handle type="target" position={Position.Top} className="!opacity-0" />
            <Handle type="source" position={Position.Bottom} className="!opacity-0" />
        </div>
    );
}

export default memo(NoteNode);
