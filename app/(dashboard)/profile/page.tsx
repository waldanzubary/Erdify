'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

export default function ProfilePage() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto">
            <h1
                className="text-3xl font-bold mb-8"
                style={{ fontFamily: 'var(--font-outfit)' }}
            >
                Profile
            </h1>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card glass className="p-8">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 rounded-2xl bg-[var(--accent-muted)] flex items-center justify-center">
                            {user.user_metadata?.avatar_url ? (
                                <img src={user.user_metadata.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                            ) : (
                                <User size={32} className="text-[var(--accent)]" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">
                                {user.user_metadata?.full_name || 'Anonymous'}
                            </h2>
                            <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
                            <Mail size={18} className="text-[var(--text-muted)]" />
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">Email</p>
                                <p className="text-sm font-medium">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
                            <Calendar size={18} className="text-[var(--text-muted)]" />
                            <div>
                                <p className="text-xs text-[var(--text-muted)]">Joined</p>
                                <p className="text-sm font-medium">
                                    {user.created_at
                                        ? new Date(user.created_at).toLocaleDateString()
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button variant="danger" onClick={logout} className="gap-2">
                        <LogOut size={16} />
                        Sign Out
                    </Button>
                </Card>
            </motion.div>
        </div>
    );
}
