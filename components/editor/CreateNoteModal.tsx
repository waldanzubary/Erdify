'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send } from 'lucide-react';

interface CreateNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (content: string) => void;
}

export default function CreateNoteModal({ isOpen, onClose, onCreate }: CreateNoteModalProps) {
    const [content, setContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => textareaRef.current?.focus(), 100);
            setContent('');
        }
    }, [isOpen]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!content.trim()) return;
        onCreate(content.trim());
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md glass border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 glass-subtle">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                    <MessageSquare size={20} className="text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">New Note</h3>
                                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">Canvas Sticky Note</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <div className="relative group">
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your note here... (Ctrl+Enter to create)"
                                    className="w-full min-h-[140px] bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-inner"
                                />
                                <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">Markdown supported</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3.5 rounded-2xl border border-white/5 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSubmit()}
                                disabled={!content.trim()}
                                className="flex-[2] py-3.5 rounded-2xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-400 disabled:opacity-20 shadow-[0_8px_16px_rgba(79,70,229,0.3)] transition-all active:scale-[0.98] group"
                            >
                                <span>Add to Canvas</span>
                                <Send size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
