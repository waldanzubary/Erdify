'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Zap, Shield, Sparkles } from 'lucide-react';

interface UploadZoneProps {
    onFileContent: (content: string, filename: string) => void;
    variant?: 'mini' | 'hero';
}

export default function UploadZone({ onFileContent, variant = 'mini' }: UploadZoneProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    onFileContent(text, file.name);
                }
            };
            reader.readAsText(file);
        },
        [onFileContent]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/sql': ['.sql'], 'text/plain': ['.sql', '.txt'] },
        maxFiles: 1,
    });

    if (variant === 'hero') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full relative group"
            >
                <input {...getInputProps()} />
                <div
                    {...getRootProps()}
                    className={`
                    relative overflow-hidden rounded-[2.5rem] border-2 border-dashed transition-all duration-500
                    ${isDragActive
                            ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.2)] scale-[0.99]'
                            : 'border-white/10 bg-white/[0.02] hover:border-indigo-500/40 hover:bg-white/[0.04]'}
                `}>
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                        <motion.div
                            animate={{
                                opacity: isDragActive ? 0.2 : 0.05,
                                scale: isDragActive ? 1.2 : 1
                            }}
                            className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full blur-[80px]"
                        />
                        <motion.div
                            animate={{
                                opacity: isDragActive ? 0.15 : 0.03,
                                scale: isDragActive ? 1.1 : 1
                            }}
                            className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500 rounded-full blur-[80px]"
                        />
                    </div>

                    <div className="relative z-10 p-12 flex flex-col items-center text-center">
                        <motion.div
                            animate={isDragActive ? { scale: 1.1, rotate: [0, -5, 5, 0] } : { y: [0, -8, 0] }}
                            transition={isDragActive ? { duration: 0.3 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className={`
                                w-24 h-24 rounded-3xl flex items-center justify-center mb-8 transition-all duration-500 shadow-2xl
                                ${isDragActive ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}
                            `}
                        >
                            {isDragActive ? <Sparkles size={40} /> : <Upload size={40} strokeWidth={1.5} />}
                        </motion.div>

                        <div className="space-y-4 max-w-sm">
                            <h2 className="text-2xl font-black tracking-tight text-white">
                                {isDragActive ? 'Release to architect' : 'Drop SQL to generate'}
                            </h2>
                            <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">
                                {isDragActive
                                    ? 'We are ready to parse your schema DNA.'
                                    : 'Drag and drop your .sql file here to instantly visualize your entire database architecture.'}
                            </p>
                        </div>

                        <div className="mt-10 flex items-center gap-6">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                                <Zap size={12} />
                                <span>Instant Parse</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                <Shield size={12} />
                                <span>Private & Secure</span>
                            </div>
                        </div>
                    </div>

                    {/* Glowing border effect on hover */}
                    <div className="absolute inset-0 pointer-events-none rounded-[2.5rem] bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
        >
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragActive
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-[var(--border)] hover:border-indigo-500/30 hover:bg-white/[0.02]'
                    }`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                    <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isDragActive ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-indigo-500/10 border border-indigo-500/20'
                            }`}
                    >
                        {isDragActive ? (
                            <FileText size={22} className="text-white" />
                        ) : (
                            <Upload size={22} className="text-indigo-400" />
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white tracking-tight">
                            {isDragActive ? 'Drop SQL DNA' : 'Import .sql file'}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">
                            or click to browse
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
