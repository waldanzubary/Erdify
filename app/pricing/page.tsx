'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import { Check, Zap, Sparkles, Lock, Crown, Infinity } from 'lucide-react';
import Link from 'next/link';

const plans = [
    {
        name: 'Free',
        price: '$0',
        period: '/month',
        description: 'Perfect for students and solo developers exploring database design.',
        icon: <Zap size={20} className="text-slate-400" />,
        badge: null,
        color: 'border-white/10',
        accent: 'bg-white/5',
        buttonClass: 'bg-white/5 hover:bg-white/10 border border-white/10 text-white',
        buttonText: 'Get Started Free',
        buttonHref: '/dashboard',
        features: [
            { label: '3 flowchart generations / week', included: true },
            { label: '1 dummy data generation / week', included: true },
            { label: 'Up to 200 rows per generation', included: true },
            { label: 'SQL export (CREATE TABLE)', included: true },
            { label: 'Real-time collaboration', included: true },
            { label: 'Unlimited ERD diagrams', included: true },
            { label: 'Priority support', included: false },
            { label: 'SQL + Data export', included: false },
        ],
    },
    {
        name: 'Pro',
        price: '$9',
        period: '/month',
        description: 'For professional developers and teams who need more power.',
        icon: <Crown size={20} className="text-indigo-400" />,
        badge: '✦ Most Popular',
        color: 'border-indigo-500/40',
        accent: 'bg-indigo-500/5',
        buttonClass: 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/30',
        buttonText: 'Upgrade to Pro',
        buttonHref: '/pricing#pro',
        features: [
            { label: '50 flowchart generations / week', included: true },
            { label: '30 dummy data generations / week', included: true },
            { label: 'Up to 5,000 rows per generation', included: true },
            { label: 'SQL + Data export (INSERT INTO)', included: true },
            { label: 'Real-time collaboration', included: true },
            { label: 'Unlimited ERD diagrams', included: true },
            { label: 'Priority support', included: true },
            { label: 'Early access to new features', included: true },
        ],
    },
    {
        name: 'Developer',
        price: 'Custom',
        period: '',
        description: 'For teams and contributors who need unlimited access.',
        icon: <Infinity size={20} className="text-emerald-400" />,
        badge: '⚡ Unlimited',
        color: 'border-emerald-500/30',
        accent: 'bg-emerald-500/5',
        buttonClass: 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300',
        buttonText: 'Contact Us',
        buttonHref: 'mailto:contact@erdify.my.id',
        features: [
            { label: 'Unlimited flowchart generations', included: true },
            { label: 'Unlimited dummy data generations', included: true },
            { label: 'Unlimited rows per generation', included: true },
            { label: 'SQL + Data export', included: true },
            { label: 'Real-time collaboration', included: true },
            { label: 'Unlimited ERD diagrams', included: true },
            { label: 'Priority support', included: true },
            { label: 'Manually assigned by ERDify team', included: true },
        ],
    },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Navbar />
            <section className="pt-32 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6"
                        >
                            <Sparkles size={12} />
                            Simple Pricing
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="text-4xl sm:text-5xl font-black mb-4 tracking-tight"
                        >
                            Choose your plan
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto"
                        >
                            Start free, upgrade when you need more AI-powered generations and larger dataset exports.
                        </motion.p>
                    </div>

                    {/* Plan Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {plans.map((plan, i) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 + i * 0.08 }}
                                className={`relative glass rounded-2xl p-8 border ${plan.color} ${plan.accent} flex flex-col`}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-lg ${plan.name === 'Pro'
                                            ? 'bg-indigo-500 text-white shadow-indigo-500/30'
                                            : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                                            }`}>
                                            {plan.badge}
                                        </span>
                                    </div>
                                )}

                                {/* Plan header */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${plan.name === 'Pro' ? 'bg-indigo-500/10 border-indigo-500/20' :
                                            plan.name === 'Developer' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                                'bg-white/5 border-white/10'
                                            }`}>
                                            {plan.icon}
                                        </div>
                                        <h3 className="text-lg font-black text-white">{plan.name}</h3>
                                    </div>
                                    <div className="flex items-end gap-1 mb-2">
                                        <span className="text-4xl font-black text-white">{plan.price}</span>
                                        {plan.period && <span className="text-sm text-[var(--text-muted)] mb-1">{plan.period}</span>}
                                    </div>
                                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">{plan.description}</p>
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map(f => (
                                        <li key={f.label} className={`flex items-center gap-3 text-sm ${f.included ? 'text-[var(--text-secondary)]' : 'text-white/25 line-through'}`}>
                                            <span className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${f.included
                                                ? plan.name === 'Pro' ? 'bg-indigo-500/20 text-indigo-400'
                                                    : plan.name === 'Developer' ? 'bg-emerald-500/20 text-emerald-400'
                                                        : 'bg-white/10 text-white/60'
                                                : 'bg-white/5 text-white/20'
                                                }`}>
                                                {f.included ? <Check size={10} strokeWidth={3} /> : <Lock size={10} />}
                                            </span>
                                            {f.label}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <Link
                                    href={plan.buttonHref}
                                    className={`w-full flex items-center justify-center py-3 rounded-xl font-bold text-sm transition-all ${plan.buttonClass}`}
                                >
                                    {plan.buttonText}
                                    {plan.name === 'Pro' && <span className="ml-2 text-xs opacity-70">(Coming Soon)</span>}
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* FAQ strip */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-16 text-center"
                    >
                        <p className="text-sm text-[var(--text-muted)]">
                            All plans include unlimited ERD diagrams, real-time collaboration, and SQL export.{' '}
                            <a href="mailto:contact@erdify.my.id" className="text-[var(--accent)] hover:underline">Questions? Contact us →</a>
                        </p>
                    </motion.div>
                </div>
            </section>
            <Footer />
        </div>
    );
}
