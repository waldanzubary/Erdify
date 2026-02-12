'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Database,
  Upload,
  Zap,
  Download,
  ArrowRight,
  Link2,
  Key,
  Hash,
  Layout,
  Shield,
  Sparkles,
  MousePointer2,
  Share2,
  Code2,
  User,
  Activity,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import UploadZone from '../components/editor/UploadZone';
import { useAuth } from '../hooks/useAuth';
import { createProject } from '../lib/db/actions';
import { parseSQL } from '../utils/sqlParser';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const features = [
  {
    icon: Share2,
    title: 'Real-time Collaboration',
    description: 'Work together with your team in real-time. See cursors, instant updates, and shared sticky notes as they happen.',
  },
  {
    icon: Upload,
    title: 'Instant SQL Import',
    description: 'Drop your .sql file and watch it transform into a structured visual diagram in milliseconds.',
  },
  {
    icon: Zap,
    title: 'Intelligent Parsing',
    description: 'Our engine automatically identifies constraints, data types, and complex schemas with 99% accuracy.',
  },
  {
    icon: Layout,
    title: 'Smart Layout engine',
    description: 'Powered by Dagre, your diagrams are automatically organized for maximum readability and zero overlap.',
  },
  {
    icon: Sparkles,
    title: 'Premium Editor',
    description: 'A dedicated workspace with glass-morphism panels to refine your database structure in real-time.',
  },
  {
    icon: Code2,
    title: 'Developer Focused',
    description: 'Export to JSON, clean SQL, or high-resolution PNGs tailored for documentation and presentations.',
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.21, 1.02, 0.47, 0.98] },
  }),
};

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleQuickUpload = async (content: string, filename: string) => {
    if (!user) {
      router.push('/signup?message=Please sign up to save your ER diagrams');
      return;
    }
    setLoading(true);
    try {
      const schema = parseSQL(content);
      const name = filename.replace(/\.(sql|txt)$/i, '');
      const id = await createProject(user.id, name, '', schema);
      router.push(`/editor/${id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to parse SQL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] selection:bg-indigo-500/30">
      <Navbar />

      {/* ── Hero Section ── */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="glow-orb top-[-100px] left-1/4 opacity-50" />
        <div className="glow-orb bottom-[-200px] right-1/4 opacity-30" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 mb-10"
          >
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
              Transform Your Database
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[0.95]"
          >
            Visualize SQL <br />
            <span className="gradient-text tracking-tighter italic">into perfection</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-14 font-medium leading-relaxed"
          >
            The professional standard for entity-relationship mapping.
            Upload your schema and generate interactive, presentation-ready diagrams in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center gap-8"
          >
            <div className="w-full max-w-xl p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
              <UploadZone onFileContent={handleQuickUpload} />
            </div>

            <div className="flex items-center gap-10">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--bg-primary)] bg-zinc-800 flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-[var(--bg-primary)] bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                  +2k
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex flex-col items-start">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Sparkles key={i} size={12} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <span className="text-[10px] font-medium text-[var(--text-muted)] mt-1">Trusted by 2,000+ developers</span>
              </div>
            </div>
          </motion.div>

          {/* Editor Snapshot Preview */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-32 relative group"
          >
            <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000" />
            <div className="relative glass rounded-3xl p-1 bg-white/5 border-white/10 shadow-[0_32px_128px_rgba(0,0,0,0.8)]">
              <div className="bg-[#0c0c0e] rounded-[22px] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-[var(--text-muted)] font-mono">
                    erdify.app/editor/demo
                  </div>
                  <div className="w-12" />
                </div>
                <div className="h-[600px] grid-pattern relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent pointer-events-none z-10" />

                  {/* Mock Diagram Rendering */}
                  <div className="flex items-center gap-16 relative z-0">
                    {[
                      {
                        name: 'Accounts',
                        cols: [
                          { name: 'id', type: 'INT', pk: true },
                          { name: 'email', type: 'VARCHAR' },
                          { name: 'password_hash', type: 'VARCHAR' }
                        ],
                        color: 'text-indigo-400'
                      },
                      {
                        name: 'Orders',
                        cols: [
                          { name: 'id', type: 'INT', pk: true },
                          { name: 'account_id', type: 'INT', fk: true },
                          { name: 'amount', type: 'DECIMAL' }
                        ],
                        color: 'text-violet-400'
                      },
                      {
                        name: 'Products',
                        cols: [
                          { name: 'id', type: 'INT', pk: true },
                          { name: 'slug', type: 'VARCHAR' },
                          { name: 'price_cents', type: 'INT' }
                        ],
                        color: 'text-sky-400'
                      }
                    ].map((table, i) => (
                      <motion.div
                        key={table.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + i * 0.15 }}
                        className="w-64 glass border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group/table"
                      >
                        {/* Table Header */}
                        <div className="px-4 py-3 bg-white/[0.03] border-b border-white/5 flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-indigo-400">
                            <Database size={14} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-muted)] leading-none mb-1">Entity</span>
                            <span className="text-sm font-bold text-white truncate leading-none">{table.name}</span>
                          </div>
                          <div className="ml-auto flex items-center px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                            <span className="text-[9px] font-black text-white/50">{table.cols.length}</span>
                          </div>
                        </div>

                        {/* Columns Area */}
                        <div className="py-2">
                          {table.cols.map((col, j) => (
                            <div key={j} className="flex items-center gap-3 px-4 py-2 hover:bg-white/[0.03] transition-colors group/row">
                              <div className="shrink-0">
                                {col.pk ? (
                                  <div className="w-5 h-5 rounded-md bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                                    <Key size={10} />
                                  </div>
                                ) : col.fk ? (
                                  <div className="w-5 h-5 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <Link2 size={10} />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[var(--text-muted)] group-hover/row:text-white transition-colors">
                                    {col.type === 'INT' || col.type === 'DECIMAL' ? <Hash size={10} /> : <Code2 size={10} />}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-1 flex-col min-w-0">
                                <span className={`text-[12px] font-bold tracking-tight truncate ${col.pk ? 'text-white' : 'text-[var(--text-secondary)] group-hover/row:text-[var(--text-primary)]'}`}>
                                  {col.name}
                                </span>
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]/60 bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
                                {col.type}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                      </motion.div>
                    ))}

                    {/* Mock Native Note */}
                    <motion.div
                      initial={{ opacity: 0, rotate: -3 }}
                      animate={{ opacity: 1, rotate: -2 }}
                      transition={{ delay: 1.5 }}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 glass border border-white/10 rounded-2xl p-4 shadow-2xl z-20"
                    >
                      <div className="flex items-center gap-2 mb-3 opacity-40">
                        <User size={10} className="text-amber-400" />
                        <span className="text-[8px] font-black uppercase tracking-wider text-white">Sarah Chen</span>
                      </div>
                      <p className="text-[10px] font-medium text-[var(--text-secondary)] leading-relaxed">
                        Need to add index on account_id for faster lookups.
                      </p>
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-400">Working on</span>
                      </div>
                    </motion.div>

                    {/* Mock Live Cursors */}
                    <motion.div
                      animate={{
                        x: [240, 280, 260],
                        y: [120, 160, 140]
                      }}
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      className="absolute pointer-events-none z-30 flex flex-col items-start gap-1"
                    >
                      <MousePointer2 size={16} className="text-indigo-500 fill-indigo-500" />
                      <div className="px-2 py-0.5 rounded-full bg-indigo-500 text-[8px] font-bold text-white shadow-lg">
                        Alex Rivera
                      </div>
                    </motion.div>

                    <motion.div
                      animate={{
                        x: [480, 440, 460],
                        y: [320, 280, 300]
                      }}
                      transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                      className="absolute pointer-events-none z-30 flex flex-col items-start gap-1"
                    >
                      <MousePointer2 size={16} className="text-emerald-500 fill-emerald-500" />
                      <div className="px-2 py-0.5 rounded-full bg-emerald-500 text-[8px] font-bold text-white shadow-lg">
                        Jamie Doe
                      </div>
                    </motion.div>

                    {/* SVG Connector Mock */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                      <path d="M 224 300 L 304 300" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" fill="none" strokeDasharray="4 4" />
                      <path d="M 450 300 L 530 300" stroke="rgba(99,102,241,0.3)" strokeWidth="1.5" fill="none" strokeDasharray="4 4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-24">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">Built for scale.</h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl leading-relaxed">
              Every feature is meticulously crafted to handle complex database architectures
              while maintaining a beautiful, intuitive user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Card
                key={feature.title}
                variant="feature"
                className="group"
              >
                <div className="p-2 w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:bg-indigo-500 transition-colors duration-500">
                  <feature.icon className="text-indigo-400 group-hover:text-white transition-colors duration-500" size={24} />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Container ── */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-16 rounded-[40px] bg-gradient-to-b from-indigo-600 to-indigo-700 relative overflow-hidden text-center shadow-[0_0_100px_rgba(99,102,241,0.2)]"
          >
            {/* CTA Background Blasts */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/20 rounded-full blur-[80px] -ml-24 -mb-24" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
                Ready to architect your future?
              </h2>
              <p className="text-indigo-100 text-lg mb-12 font-medium opacity-90">
                Join thousands of developers turning raw SQL into visual clarity.
                Free to start, forever powerful.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto bg-white text-indigo-700 hover:bg-white uppercase tracking-widest font-bold text-xs ring-offset-indigo-600">
                    Get Started Now
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 uppercase tracking-widest font-bold text-xs">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
