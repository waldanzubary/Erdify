'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ERSchema } from '@/lib/types';

// 8 distinct cursor colors
const CURSOR_COLORS = [
    '#6366f1', // indigo
    '#f43f5e', // rose
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#14b8a6', // teal
];

export interface CursorPosition {
    x: number;
    y: number;
    userId: string;
    userName: string;
    color: string;
}

export interface OnlineUser {
    userId: string;
    userName: string;
    color: string;
    joinedAt: string;
}

function getColorForUser(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

export type RealtimeStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

interface UseRealtimeCollaborationOptions {
    projectId: string;
    userId: string;
    userName: string;
    onRemoteSchemaChange?: (schema: ERSchema) => void;
    onRemoteNoteAdd?: (note: any) => void;
    onRemoteNoteUpdate?: (noteId: string, updates: any) => void;
    onRemoteNoteChange?: () => void;
    onRemoteNodeMove?: (payload: { nodeId: string; x: number; y: number }) => void;
    onRemoteNameChange?: (name: string) => void;
}

export function useRealtimeCollaboration({
    projectId,
    userId,
    userName,
    onRemoteSchemaChange,
    onRemoteNoteAdd,
    onRemoteNoteUpdate,
    onRemoteNoteChange,
    onRemoteNodeMove,
    onRemoteNameChange,
}: UseRealtimeCollaborationOptions) {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
    const [lastMessages, setLastMessages] = useState<Map<string, { text: string; timestamp: number }>>(new Map());
    const [status, setStatus] = useState<RealtimeStatus>('DISCONNECTED');

    const broadcastChannelRef = useRef<RealtimeChannel | null>(null);
    const dbChannelRef = useRef<RealtimeChannel | null>(null);
    const cursorThrottleRef = useRef<number>(0);
    const myColor = getColorForUser(userId);

    // Store callbacks in refs to avoid reconnecting when they change
    const handlersRef = useRef({
        onRemoteSchemaChange,
        onRemoteNoteAdd,
        onRemoteNoteUpdate,
        onRemoteNoteChange,
        onRemoteNodeMove,
        onRemoteNameChange
    });

    useEffect(() => {
        handlersRef.current = {
            onRemoteSchemaChange,
            onRemoteNoteAdd,
            onRemoteNoteUpdate,
            onRemoteNoteChange,
            onRemoteNodeMove,
            onRemoteNameChange
        };
    }, [onRemoteSchemaChange, onRemoteNoteAdd, onRemoteNoteUpdate, onRemoteNoteChange, onRemoteNodeMove, onRemoteNameChange]);

    useEffect(() => {
        if (!projectId || !userId) return;

        let active = true;
        const initTimeout = setTimeout(() => {
            if (!active) return;

            console.log(`[Realtime] Syncing project ${projectId}...`);
            setStatus('CONNECTING');

            // ── 1. Broadcast & Presence (Crucial) ──
            const broadcastChannel = supabase.channel(`broadcast:${projectId}`, {
                config: {
                    presence: { key: userId },
                    broadcast: { self: false },
                },
            });

            broadcastChannel.on('presence', { event: 'sync' }, () => {
                const state = broadcastChannel.presenceState();
                const users: OnlineUser[] = [];
                for (const [, presences] of Object.entries(state)) {
                    const p = presences[0] as any;
                    if (p.userId !== userId) {
                        users.push({
                            userId: p.userId,
                            userName: p.userName,
                            color: p.color,
                            joinedAt: p.joinedAt,
                        });
                    }
                }
                if (active) setOnlineUsers(users);
            });

            broadcastChannel.on('presence', { event: 'leave' }, ({ key }) => {
                if (!active) return;
                setCursors((prev) => {
                    const next = new Map(prev);
                    next.delete(key as string);
                    return next;
                });
                setLastMessages((prev) => {
                    const next = new Map(prev);
                    next.delete(key as string);
                    return next;
                });
            });

            broadcastChannel
                .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
                    if (payload.userId === userId || !active) return;
                    setCursors((prev) => {
                        const next = new Map(prev);
                        next.set(payload.userId, {
                            x: payload.x,
                            y: payload.y,
                            userId: payload.userId,
                            userName: payload.userName,
                            color: payload.color,
                        });
                        return next;
                    });
                })
                .on('broadcast', { event: 'schema-change' }, ({ payload }) => {
                    if (payload.userId === userId || !active) return;
                    handlersRef.current.onRemoteSchemaChange?.(payload.schema);
                })
                .on('broadcast', { event: 'chat-message' }, ({ payload }) => {
                    if (payload.userId === userId || !active) return;
                    setLastMessages((prev) => {
                        const next = new Map(prev);
                        next.set(payload.userId, {
                            text: payload.text,
                            timestamp: Date.now(),
                        });
                        return next;
                    });
                })
                .on('broadcast', { event: 'note-added' }, ({ payload }) => {
                    if (payload.userId === userId || !active) return;
                    handlersRef.current.onRemoteNoteAdd?.(payload.note);
                })
                .on('broadcast', { event: 'note-updated' }, ({ payload }) => {
                    if (payload.userId === userId || !active) return;
                    handlersRef.current.onRemoteNoteUpdate?.(payload.noteId, payload.updates);
                })
                .on('broadcast', { event: 'node-move' }, ({ payload }) => {
                    if (payload.userId === userId || !active) return;
                    handlersRef.current.onRemoteNodeMove?.({
                        nodeId: payload.nodeId,
                        x: payload.x,
                        y: payload.y
                    });
                })
                .on('broadcast', { event: 'name-change' }, ({ payload }) => {
                    if (payload.userId === userId || !active) return;
                    handlersRef.current.onRemoteNameChange?.(payload.name);
                });

            broadcastChannel.subscribe(async (s) => {
                if (!active) return;
                console.log(`[Realtime] Broadcast: ${s}`);
                if (s === 'SUBSCRIBED') {
                    setStatus('CONNECTED');
                    await broadcastChannel.track({
                        userId,
                        userName,
                        color: myColor,
                        joinedAt: new Date().toISOString(),
                    });
                } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') {
                    setStatus('ERROR');
                }
            });

            // ── 2. DB Fallback (Optional) ──
            const dbChannel = supabase.channel(`db-sync:${projectId}`);
            dbChannel
                .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `project_id=eq.${projectId}` },
                    () => handlersRef.current.onRemoteNoteChange?.())
                .subscribe((s) => {
                    console.log(`[Realtime] DB-Sync: ${s}`);
                });

            broadcastChannelRef.current = broadcastChannel;
            dbChannelRef.current = dbChannel;
        }, 300); // 300ms delay to allow client to stabilize

        return () => {
            active = false;
            clearTimeout(initTimeout);
            if (broadcastChannelRef.current) supabase.removeChannel(broadcastChannelRef.current);
            if (dbChannelRef.current) supabase.removeChannel(dbChannelRef.current);
            broadcastChannelRef.current = null;
            dbChannelRef.current = null;
        };
    }, [projectId, userId, userName, myColor]);

    // Throttled cursor broadcast (max ~30fps)
    const broadcastCursorMove = useCallback(
        (x: number, y: number) => {
            if (status !== 'CONNECTED' || !broadcastChannelRef.current) return;
            const now = Date.now();
            if (now - cursorThrottleRef.current < 33) return; // ~30fps
            cursorThrottleRef.current = now;

            broadcastChannelRef.current.send({
                type: 'broadcast',
                event: 'cursor-move',
                payload: { x, y, userId, userName, color: myColor },
            });
        },
        [userId, userName, myColor, status]
    );

    const broadcastSchemaChange = useCallback(
        (schema: ERSchema) => {
            if (status !== 'CONNECTED' || !broadcastChannelRef.current) return;
            broadcastChannelRef.current.send({
                type: 'broadcast',
                event: 'schema-change',
                payload: { userId, schema },
            });
        },
        [userId, status]
    );

    const broadcastChatMessage = useCallback(
        (text: string) => {
            if (status !== 'CONNECTED' || !broadcastChannelRef.current) return;
            broadcastChannelRef.current.send({
                type: 'broadcast',
                event: 'chat-message',
                payload: { userId, text },
            });
        },
        [userId, status]
    );

    const broadcastNoteAdd = useCallback(
        (note: any) => {
            if (status !== 'CONNECTED' || !broadcastChannelRef.current) return;
            broadcastChannelRef.current.send({
                type: 'broadcast',
                event: 'note-added',
                payload: { userId, note },
            });
        },
        [userId, status]
    );

    const broadcastNoteUpdate = useCallback(
        (noteId: string, updates: any) => {
            if (status !== 'CONNECTED' || !broadcastChannelRef.current) return;
            broadcastChannelRef.current.send({
                type: 'broadcast',
                event: 'note-updated',
                payload: { userId, noteId, updates },
            });
        },
        [userId, status]
    );

    const broadcastNodeMove = useCallback(
        (nodeId: string, x: number, y: number) => {
            if (status !== 'CONNECTED' || !broadcastChannelRef.current) return;
            broadcastChannelRef.current.send({
                type: 'broadcast',
                event: 'node-move',
                payload: { userId, nodeId, x, y },
            });
        },
        [userId, status]
    );

    return {
        onlineUsers,
        cursors,
        lastMessages,
        status,
        myColor,
        broadcastCursorMove,
        broadcastSchemaChange,
        broadcastChatMessage,
        broadcastNoteAdd,
        broadcastNoteUpdate,
        broadcastNodeMove,
        broadcastProjectName: useCallback(
            (name: string) => {
                if (status !== 'CONNECTED' || !broadcastChannelRef.current) return;
                broadcastChannelRef.current.send({
                    type: 'broadcast',
                    event: 'name-change',
                    payload: { userId, name },
                });
            },
            [userId, status]
        ),
    };
}
