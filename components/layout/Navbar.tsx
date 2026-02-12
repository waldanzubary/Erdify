'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Menu, X, LogOut, User, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const { user, logout } = useAuth();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/pricing', label: 'Pricing' },
        ...(user ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? 'py-4 px-6'
                    : 'py-6 px-6 bg-transparent'
                }`}
        >
            <div className={`
                max-w-7xl mx-auto px-6 h-16 rounded-[2rem] transition-all duration-500 flex items-center justify-between
                ${scrolled
                    ? 'bg-black/40 backdrop-blur-xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
                    : 'bg-transparent border border-transparent'}
            `}>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <motion.div
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.6 }}
                            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20"
                        >
                            <Database size={20} className="text-white" />
                        </motion.div>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0, 0.5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-xl bg-indigo-500 blur-md -z-10"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tighter leading-none text-white">ERDIFY</span>
                        <span className="text-[9px] text-white/40 font-bold uppercase tracking-[0.3em] mt-0.5">Studio</span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${isActive ? 'text-white' : 'text-white/40 hover:text-white/80'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-active"
                                        className="absolute inset-0 bg-white/5 border border-white/10 rounded-xl shadow-inner"
                                        transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                                    />
                                )}
                                <span className="relative z-10">{link.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Right Side */}
                <div className="hidden md:flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <Link
                                href="/profile"
                                className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                    <User size={14} className="text-indigo-400 group-hover:text-white" />
                                </div>
                                <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">
                                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                </span>
                            </Link>
                            <button
                                onClick={logout}
                                className="w-10 h-10 flex items-center justify-center rounded-2xl border border-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300"
                                title="Sign out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href="/login" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors px-4">
                                Log in
                            </Link>
                            <Link href="/signup">
                                <Button className="rounded-2xl px-8 py-5 h-auto text-[10px] font-black uppercase tracking-[0.2em] shadow-glow">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden w-12 h-12 flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/5 text-white/60 hover:text-white transition-all"
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <div className="fixed inset-0 z-[-1] md:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="absolute top-28 left-6 right-6 bg-[#0a0a0b] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            {/* Accent Background */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px]" />

                            <div className="relative z-10 flex flex-col gap-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">Navigation</span>
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={`px-6 py-4 rounded-[1.5rem] text-lg font-black tracking-tight flex items-center justify-between transition-all ${pathname === link.href
                                                ? 'bg-white/5 text-white border border-white/10 shadow-lg'
                                                : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                                            }`}
                                    >
                                        {link.label}
                                        {pathname === link.href && <Sparkles size={16} className="text-indigo-400" />}
                                    </Link>
                                ))}

                                {!user && (
                                    <div className="grid grid-cols-1 gap-3 mt-6 pt-8 border-t border-white/5">
                                        <Link href="/signup" onClick={() => setMobileOpen(false)}>
                                            <Button className="w-full py-7 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] shadow-glow">
                                                Join ERDify Pro
                                            </Button>
                                        </Link>
                                        <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center py-4 text-xs font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                                            Already a member? Log in
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </nav>
    );
}
