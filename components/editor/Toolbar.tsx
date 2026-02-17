'use client';

import { useState } from 'react';
import {
    LayoutGrid,
    Download,
    Image,
    FileJson,
    Loader2,
    Check,
    ChevronLeft,
    CloudUpload,
    MessageSquare,
    UserPlus,
    Database,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import PresenceAvatars from './PresenceAvatars';
import type { OnlineUser, RealtimeStatus } from '@/hooks/useRealtimeCollaboration';

interface ToolbarProps {
    projectName: string;
    saving: boolean;
    lastSaved: Date | null;
    status?: RealtimeStatus;
    onAutoLayout: () => void;
    onExportPng: () => void;
    onExportJson: () => void;
    onExportSql: () => void;
    onUpload: () => void;
    onlineUsers?: OnlineUser[];
    myColor?: string;
    showNotes?: boolean;
    noteCount?: number;
    onToggleNotes?: () => void;
    onAddNote?: () => void;
    onInvite?: () => void;
    onProjectNameChange?: (name: string) => void;
    projectId?: string;
    currentUserColor?: string;
    canEdit?: boolean;
    viewMode?: 'erd' | 'flowchart';
    onViewModeChange?: (mode: 'erd' | 'flowchart') => void;
    onGenerateFlowchart?: () => void;
    isGeneratingFlowchart?: boolean;
}

export default function Toolbar({
    projectName,
    saving,
    lastSaved,
    status = 'DISCONNECTED',
    onAutoLayout,
    onExportPng,
    onExportJson,
    onExportSql,
    onUpload,
    onlineUsers = [],
    myColor = '#6366f1',
    showNotes = false,
    noteCount = 0,
    onToggleNotes,
    onAddNote,
    onInvite,
    onProjectNameChange,
    projectId,
    currentUserColor,
    canEdit = false,
    viewMode = 'erd',
    onViewModeChange,
    onGenerateFlowchart,
    isGeneratingFlowchart = false,
}: ToolbarProps) {
    const [showExport, setShowExport] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(projectName);

    return (
        <div className="h-16 px-6 glass border-b border-[var(--border)] flex items-center justify-between z-50">
            {/* Left Section */}
            <div className="flex items-center gap-6">
                <Link
                    href="/dashboard"
                    className="group p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:border-[var(--border-hover)] transition-all"
                >
                    <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
                </Link>

                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        {canEdit && isEditingName ? (
                            <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={() => {
                                    onProjectNameChange?.(editName);
                                    setIsEditingName(false);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as any).blur()}
                                className="bg-transparent border-b border-indigo-500 outline-none text-sm font-bold text-white py-0 min-w-[120px]"
                                autoFocus
                            />
                        ) : (
                            <h1
                                className={`text-sm font-bold tracking-tight text-[var(--text-primary)] truncate max-w-[240px] ${canEdit ? 'cursor-pointer hover:text-indigo-400' : ''}`}
                                onClick={() => canEdit && setIsEditingName(true)}
                            >
                                {projectName}
                            </h1>
                        )}
                        <div className="h-4 w-px bg-[var(--border)] mx-1" />

                        {/* Realtime Status */}
                        <div className="flex items-center gap-1.5 mr-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${status === 'CONNECTED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                status === 'CONNECTING' ? 'bg-amber-500 animate-pulse' :
                                    status === 'ERROR' ? 'bg-rose-500' : 'bg-gray-500'
                                }`} />
                            <span className="text-[9px] font-bold uppercase tracking-tight text-[var(--text-muted)]">
                                {status.toLowerCase()}
                            </span>
                        </div>

                        <div className="h-4 w-px bg-[var(--border)] mx-1" />
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                            {saving ? (
                                <div className="flex items-center gap-1.5 text-indigo-400">
                                    <Loader2 size={12} className="animate-spin" />
                                    <span>Syncing</span>
                                </div>
                            ) : lastSaved ? (
                                <div className="flex items-center gap-1.5 text-emerald-400/80">
                                    <Check size={12} />
                                    <span>Saved</span>
                                </div>
                            ) : (
                                <span className="text-[var(--text-muted)]">Unsaved</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Center: Presence Avatars & Invite */}
            <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex p-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
                    <button
                        onClick={() => onViewModeChange?.('erd')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === 'erd'
                            ? 'bg-indigo-500 text-white shadow-lg'
                            : 'text-[var(--text-muted)] hover:text-white'
                            }`}
                    >
                        ERD
                    </button>
                    <button
                        onClick={() => onViewModeChange?.('flowchart')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${viewMode === 'flowchart'
                            ? 'bg-indigo-500 text-white shadow-lg'
                            : 'text-[var(--text-muted)] hover:text-white'
                            }`}
                    >
                        Flowchart
                    </button>
                </div>

                {viewMode === 'flowchart' && (
                    <button
                        onClick={onGenerateFlowchart}
                        disabled={isGeneratingFlowchart}
                        className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-all disabled:opacity-50"
                    >
                        <Sparkles size={14} className={isGeneratingFlowchart ? 'animate-pulse' : ''} />
                        <span className="text-xs font-bold">
                            {isGeneratingFlowchart ? 'Generating...' : 'Regenerate'}
                        </span>
                    </button>
                )}
                <div className="w-px h-6 bg-white/5" />

                <PresenceAvatars users={onlineUsers} myColor={myColor} />
                <div className="w-px h-6 bg-white/5" />
                {canEdit && (
                    <button
                        onClick={onInvite}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all group"
                    >
                        <UserPlus size={14} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Invite</span>
                    </button>
                )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
                {/* Notes Controls */}
                <div className="flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                    {canEdit && (
                        <>
                            <button
                                onClick={onAddNote}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-all flex items-center gap-2 px-3 group"
                                title="Add sticky note to canvas"
                            >
                                <MessageSquare size={14} className="group-hover:text-amber-400 transition-colors" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Add Note</span>
                            </button>
                            <div className="w-px h-4 bg-[var(--border)] mx-1" />
                        </>
                    )}
                    <button
                        onClick={onToggleNotes}
                        className={`relative p-1.5 rounded-lg transition-all flex items-center gap-2 px-3 ${showNotes
                            ? 'bg-indigo-500/10 text-indigo-400'
                            : 'hover:bg-white/5 text-[var(--text-muted)] hover:text-white'
                            }`}
                    >
                        <MessageSquare size={14} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Chat</span>
                        {noteCount > 0 && (
                            <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-[8px] font-black text-white flex items-center justify-center">
                                {noteCount > 9 ? '9+' : noteCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onUpload}
                        disabled={!canEdit}
                        className="rounded-lg h-8 px-3 gap-2 text-[10px] font-bold uppercase tracking-[0.1em]"
                    >
                        <CloudUpload size={14} className="text-indigo-400" />
                        Import SQL
                    </Button>
                    <div className="w-px h-4 bg-[var(--border)] mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onAutoLayout}
                        disabled={!canEdit}
                        className="rounded-lg h-8 px-3 gap-2 text-[10px] font-bold uppercase tracking-[0.1em]"
                    >
                        <LayoutGrid size={13} className="text-indigo-400" />
                        Auto Layout
                    </Button>
                </div>

                <div className="relative">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowExport(!showExport)}
                        className="rounded-xl h-10 px-5 gap-2 font-bold text-[10px] uppercase tracking-[0.15em] shadow-glow"
                    >
                        <Download size={14} strokeWidth={2.5} />
                        Export
                    </Button>

                    <AnimatePresence>
                        {showExport && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-3 w-52 glass rounded-2xl p-2 z-[100] shadow-2xl border border-white/5"
                            >
                                <button
                                    onClick={() => {
                                        onExportPng();
                                        setShowExport(false);
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <span>Download Image</span>
                                    <Image size={14} className="text-indigo-400" />
                                </button>
                                <button
                                    onClick={() => {
                                        onExportJson();
                                        setShowExport(false);
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <span>Schema JSON</span>
                                    <FileJson size={14} className="text-emerald-400" />
                                </button>
                                <button
                                    onClick={() => {
                                        onExportSql();
                                        setShowExport(false);
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <span>Export SQL</span>
                                    <Database size={14} className="text-purple-400" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
