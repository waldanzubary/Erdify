'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Trash2, CheckCircle2, Circle, PlayCircle, MoreVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createNote, listNotes, deleteNote, updateNote } from '@/lib/db/actions';

export type NoteStatus = 'todo' | 'working' | 'done';

export interface Note {
    id: string;
    userId: string;
    userName: string;
    content: string;
    status: string; // From DB it's string, we can cast it
    createdAt: Date;
    positionX?: number;
    positionY?: number;
}

interface NotesPanelProps {
    projectId: string;
    userId: string;
    userName: string;
    isOpen: boolean;
    onClose: () => void;
    onNoteCount?: (count: number) => void;
    onSendMessage?: (text: string) => void;
    notes: Note[];
    onDeleteNote?: (id: string) => void;
    onCreateNote?: (content: string) => Promise<void>;
    onUpdateNote?: (id: string, updates: Partial<Note>) => void;
    canEdit?: boolean;
}

export default function NotesPanel({
    projectId,
    userId,
    userName,
    isOpen,
    onClose,
    onNoteCount,
    onSendMessage,
    notes,
    onDeleteNote,
    onCreateNote,
    onUpdateNote,
    canEdit = false,
}: NotesPanelProps) {
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [notes, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || sending) return;
        setSending(true);
        try {
            onSendMessage?.(input.trim());
            const content = input.trim();
            setInput('');
            if (onCreateNote) {
                await onCreateNote(content);
            } else {
                await createNote(projectId, userId, userName, content);
            }
        } catch (err) {
            console.error('Failed to send note', err);
        } finally {
            setSending(false);
        }
    };

    const toggleStatus = async (note: Note) => {
        const statuses: NoteStatus[] = ['todo', 'working', 'done'];
        const currentIdx = statuses.indexOf(note.status as NoteStatus);
        const nextStatus = statuses[(currentIdx + 1) % statuses.length];

        if (onUpdateNote) {
            onUpdateNote(note.id, { status: nextStatus });
        } else {
            await updateNote(note.id, { status: nextStatus });
        }
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDateSeparator = (date: Date) => {
        const d = new Date(date);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) return 'Today';
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Grouping Logic: Date -> User Group -> Messages
    const groupedMessages: any[] = [];
    let lastDate: string | null = null;
    let lastUserGroup: any = null;

    notes.forEach((note) => {
        const dateStr = formatDateSeparator(note.createdAt);

        // Date Separator
        if (dateStr !== lastDate) {
            groupedMessages.push({ type: 'date', label: dateStr });
            lastDate = dateStr;
            lastUserGroup = null; // Reset user group on new date
        }

        // Consecutive User Grouping (within 5 mins)
        const noteTime = new Date(note.createdAt).getTime();
        const isConsecutive =
            lastUserGroup &&
            lastUserGroup.userId === note.userId &&
            (noteTime - lastUserGroup.lastTime < 5 * 60 * 1000);

        if (isConsecutive) {
            lastUserGroup.messages.push(note);
            lastUserGroup.lastTime = noteTime;
        } else {
            const newGroup = {
                type: 'user-group',
                userId: note.userId,
                userName: note.userName,
                messages: [note],
                lastTime: noteTime
            };
            groupedMessages.push(newGroup);
            lastUserGroup = newGroup;
        }
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'done': return <CheckCircle2 size={12} className="text-emerald-400" />;
            case 'working': return <PlayCircle size={12} className="text-amber-400" />;
            default: return <Circle size={12} className="text-indigo-400/50" />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: 360, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 360, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="absolute right-0 top-0 bottom-0 w-[360px] glass border-l border-[var(--border)] flex flex-col z-40"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-[var(--border)] glass-subtle">
                        <div className="flex items-center gap-2">
                            <MessageSquare size={14} className="text-indigo-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                Collaboration Feed
                            </span>
                            <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                                {notes.length}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    {/* Notes List */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        {notes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                                <div className="w-16 h-16 rounded-full bg-indigo-500/5 flex items-center justify-center mb-4 border border-indigo-500/10">
                                    <MessageSquare size={24} className="text-indigo-500/30 font-bold" />
                                </div>
                                <p className="text-xs text-white font-bold tracking-tight">
                                    No activity yet
                                </p>
                                <p className="text-[10px] text-[var(--text-muted)] mt-1 max-w-[180px]">
                                    Share ideas and track tasks with your team here.
                                </p>
                            </div>
                        ) : (
                            <div className="pb-6">
                                {groupedMessages.map((group, gIdx) => (
                                    <div key={`${group.type}-${gIdx}`}>
                                        {group.type === 'date' ? (
                                            <div className="flex items-center gap-4 py-6 px-4">
                                                <div className="flex-1 h-px bg-white/5" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                                    {group.label}
                                                </span>
                                                <div className="flex-1 h-px bg-white/5" />
                                            </div>
                                        ) : (
                                            <div className="px-4 mb-4 flex gap-3 group/user">
                                                {/* Left Column: Avatar */}
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                                    <span className="text-[10px] font-black text-indigo-300">
                                                        {group.userName.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>

                                                {/* Right Column: Messages */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-[11px] font-black text-white truncate">
                                                            {group.userId === userId ? 'You' : group.userName}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-[var(--text-muted)]">
                                                            {formatTime(group.messages[0].createdAt)}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1">
                                                        {group.messages.map((note: Note) => (
                                                            <div
                                                                key={note.id}
                                                                className="relative group/msg flex items-start gap-2"
                                                            >
                                                                <div className={`flex-1 rounded-2xl p-2.5 transition-all
                                                                    ${note.userId === userId
                                                                        ? 'bg-indigo-500/[0.07] border border-indigo-500/10'
                                                                        : 'bg-white/[0.02] border border-white/5'
                                                                    } hover:border-white/10`}
                                                                >
                                                                    <p className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed break-words">
                                                                        {note.content}
                                                                    </p>

                                                                    {/* Task Status Bar if it's a task */}
                                                                    <div className={`mt-2 flex items-center justify-between ${canEdit ? 'opacity-40 group-hover/msg:opacity-100' : 'opacity-60'} transition-opacity`}>
                                                                        <button
                                                                            onClick={() => canEdit && toggleStatus(note)}
                                                                            className={`flex items-center gap-1.5 ${canEdit ? 'hover:text-white cursor-pointer' : 'cursor-default'} transition-colors`}
                                                                        >
                                                                            {getStatusIcon(note.status)}
                                                                            <span className="text-[9px] font-black uppercase tracking-wider">
                                                                                {note.status === 'todo' ? 'Todo' : note.status === 'working' ? 'Working on' : 'Done'}
                                                                            </span>
                                                                        </button>
                                                                        {canEdit && note.userId === userId && (
                                                                            <button
                                                                                onClick={() => onDeleteNote?.(note.id)}
                                                                                className="p-1 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all opacity-0 group-hover/msg:opacity-100"
                                                                            >
                                                                                <Trash2 size={10} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    {canEdit && (
                        <div className="p-4 border-t border-[var(--border)] glass-subtle">
                            <div className="flex items-center gap-2 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] p-1.5 focus-within:border-indigo-500/50 transition-all shadow-inner">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    placeholder="Write a message or task..."
                                    className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-3 py-2 outline-none"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || sending}
                                    className="p-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-20 transition-all shadow-lg active:scale-95"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                            <p className="text-[9px] text-[var(--text-muted)] mt-2 text-center font-bold tracking-tight uppercase opacity-50">
                                Press Enter to send
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
