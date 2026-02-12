import Link from 'next/link';
import { Database } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                                <Database size={18} className="text-white" />
                            </div>
                            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-outfit)' }}>
                                ERDify
                            </span>
                        </Link>
                        <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed">
                            Transform SQL schemas into beautiful, interactive ER diagrams. Built for developers and database architects.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Product</h4>
                        <ul className="space-y-2">
                            {['Features', 'Pricing', 'Dashboard'].map((item) => (
                                <li key={item}>
                                    <Link
                                        href={item === 'Features' ? '/#features' : `/${item.toLowerCase()}`}
                                        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Account</h4>
                        <ul className="space-y-2">
                            {['Login', 'Sign Up'].map((item) => (
                                <li key={item}>
                                    <Link
                                        href={`/${item.toLowerCase().replace(' ', '')}`}
                                        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} ERDify Studio. All rights reserved.
                    </p>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                        <span>Built by Waldan Zubary</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-white/20">Next.js & Supabase</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}
