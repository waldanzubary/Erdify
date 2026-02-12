'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/ui/Button';

const features = [
    'Unlimited projects',
    'SQL file upload & parsing',
    'Auto ER diagram generation',
    'Dagre auto-layout',
    'Realtime editing',
    'Export to PNG & JSON',
    'Supabase cloud sync',
    'Google authentication',
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Navbar />

            <section className="pt-32 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl sm:text-5xl font-bold mb-4"
                            style={{ fontFamily: 'var(--font-outfit)' }}
                        >
                            Simple pricing
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-[var(--text-muted)] max-w-xl mx-auto"
                        >
                            Everything you need, completely free. No credit card required.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="relative glass rounded-2xl p-8 gradient-border">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent)] text-white text-xs font-medium shadow-lg shadow-indigo-500/30">
                                    <Sparkles size={12} />
                                    Free Forever
                                </span>
                            </div>

                            <div className="text-center mb-8 mt-4">
                                <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-outfit)' }}>
                                    Starter
                                </h3>
                                <div className="flex items-end justify-center gap-1 mb-2">
                                    <span className="text-5xl font-bold">$0</span>
                                    <span className="text-[var(--text-muted)] mb-1">/month</span>
                                </div>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Perfect for individuals and small teams
                                </p>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                            <Check size={12} className="text-emerald-400" />
                                        </div>
                                        <span className="text-[var(--text-secondary)]">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link href="/signup">
                                <Button className="w-full" size="lg">
                                    Get Started Free
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
