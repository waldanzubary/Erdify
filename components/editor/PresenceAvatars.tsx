'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { OnlineUser } from '@/hooks/useRealtimeCollaboration';

interface PresenceAvatarsProps {
    users: OnlineUser[];
    myColor: string;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function PresenceAvatars({ users, myColor }: PresenceAvatarsProps) {
    return (
        <div className="flex items-center gap-1">
            {/* Me indicator */}
            <div className="relative group">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 transition-transform hover:scale-110"
                    style={{
                        backgroundColor: `${myColor}20`,
                        borderColor: myColor,
                    }}
                >
                    You
                </div>
            </div>

            {/* Other users */}
            <AnimatePresence>
                {users.map((user) => (
                    <motion.div
                        key={user.userId}
                        initial={{ opacity: 0, scale: 0, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0, x: -10 }}
                        className="relative group"
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 transition-transform hover:scale-110 cursor-default"
                            style={{
                                backgroundColor: `${user.color}30`,
                                borderColor: user.color,
                            }}
                        >
                            {getInitials(user.userName)}
                        </div>

                        {/* Tooltip */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                            style={{ backgroundColor: user.color }}
                        >
                            {user.userName}
                            <div
                                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                                style={{ backgroundColor: user.color }}
                            />
                        </div>

                        {/* Online pulse */}
                        <div
                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-primary)]"
                            style={{ backgroundColor: '#22c55e' }}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>

            {users.length > 0 && (
                <span className="text-[10px] font-bold text-[var(--text-muted)] ml-1">
                    {users.length + 1} online
                </span>
            )}
        </div>
    );
}
