'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useViewport } from '@xyflow/react';
import type { CursorPosition } from '@/hooks/useRealtimeCollaboration';

interface LiveCursorsProps {
    cursors: Map<string, CursorPosition>;
    lastMessages: Map<string, { text: string; timestamp: number }>;
}

function CursorIcon({ color }: { color: string }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
        >
            <path
                d="M5.65 3.15l13.14 10.43-6.03 1.2-3.96 4.94L5.65 3.15z"
                fill={color}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1"
            />
        </svg>
    );
}

export default function LiveCursors({ cursors, lastMessages }: LiveCursorsProps) {
    const entries = Array.from(cursors.values());
    const { x: xOffset, y: yOffset, zoom } = useViewport();

    return (
        <div className="pointer-events-none absolute inset-0 z-[9999] overflow-hidden">
            <AnimatePresence>
                {entries.map((cursor) => {
                    const lastMsg = lastMessages.get(cursor.userId);
                    const isMsgActive = lastMsg && (Date.now() - lastMsg.timestamp < 5000);

                    // Transform flow coordinates to screen-relative pixels based on current user's viewport
                    const screenX = cursor.x * zoom + xOffset;
                    const screenY = cursor.y * zoom + yOffset;

                    return (
                        <motion.div
                            key={cursor.userId}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                x: screenX,
                                y: screenY,
                            }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{
                                x: { type: 'spring', damping: 40, stiffness: 400, restDelta: 0.001 },
                                y: { type: 'spring', damping: 40, stiffness: 400, restDelta: 0.001 },
                                opacity: { duration: 0.2 },
                                scale: { duration: 0.2 },
                            }}
                            className="absolute top-0 left-0"
                        >
                            <CursorIcon color={cursor.color} />

                            {/* Name Tag */}
                            <div
                                className="absolute left-4 top-4 px-2 py-0.5 rounded-md text-[10px] font-bold text-white whitespace-nowrap shadow-lg flex items-center gap-1.5"
                                style={{
                                    backgroundColor: cursor.color,
                                    boxShadow: `0 2px 8px ${cursor.color}40`,
                                }}
                            >
                                {cursor.userName}
                            </div>

                            {/* Flash Message Bubble */}
                            <AnimatePresence>
                                {isMsgActive && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="absolute left-4 -top-8 bg-white text-gray-950 px-3 py-1.5 rounded-2xl rounded-bl-none text-[11px] font-bold shadow-2xl border border-white/20 whitespace-normal min-w-[80px] max-w-[200px]"
                                    >
                                        {lastMsg.text}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
