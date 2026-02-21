'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Database, Clock, Trash2, FolderOpen,
    Search, Layout, Settings, History, Star,
    Grid, List, Globe, Shield, Cpu, Zap, Activity,
    ChevronRight, Users, BarChart3, TrendingUp,
    SortAsc, SortDesc, X, Check, ArrowRight, LogOut,
    User, CreditCard, Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { listProjects, createProject, deleteProject } from '../../../lib/db/actions';
import type { ProjectMeta } from '../../../lib/types';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Card from '../../../components/ui/Card';
import UploadZone from '../../../components/editor/UploadZone';
import { parseSQL } from '../../../utils/sqlParser';
import { supabase } from '../../../lib/supabase';

const PROJECT_ICONS = [Database, Cpu, Zap, Activity, Shield, Globe];

type TabId = 'all' | 'recent' | 'favorites' | 'shared' | 'trash';
type SortKey = 'updated' | 'name' | 'tables';
type SortDir = 'asc' | 'desc';

const FAVORITES_KEY = 'erdify_favorites';
const RECENTS_KEY = 'erdify_recents';
const MAX_RECENTS = 10;

function getFavorites(): Set<string> {
    try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')); }
    catch { return new Set(); }
}
function toggleFavoriteStore(id: string): Set<string> {
    const favs = getFavorites();
    if (favs.has(id)) favs.delete(id); else favs.add(id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs]));
    return favs;
}
function addRecent(id: string) {
    try {
        const current: string[] = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
        const filtered = current.filter(x => x !== id);
        filtered.unshift(id);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(filtered.slice(0, MAX_RECENTS)));
    } catch { }
}
function getRecentIds(): string[] {
    try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]'); }
    catch { return []; }
}

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<ProjectMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabId>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortKey, setSortKey] = useState<SortKey>('updated');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [recentIds, setRecentIds] = useState<string[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        setFavorites(getFavorites());
        setRecentIds(getRecentIds());
    }, []);

    useEffect(() => {
        if (!user) return;
        loadProjects();
    }, [user]);

    const loadProjects = async () => {
        if (!user) return;
        try {
            const data = await listProjects(user.id, user.email || undefined);
            setProjects(data);
        } catch (err) {
            console.error('Failed to load projects', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!user || !newName.trim()) return;
        setCreating(true);
        try {
            const id = await createProject(user.id, newName.trim(), newDesc.trim());
            setShowNewModal(false);
            setNewName('');
            setNewDesc('');
            addRecent(id);
            router.push(`/editor/${id}`);
        } catch (err) {
            console.error('Failed to create project', err);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!user) return;
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        setDeletingId(id);
        try {
            await deleteProject(id);
            setProjects(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Failed to delete project', err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleQuickUpload = async (content: string, filename: string) => {
        if (!user) return;
        setCreating(true);
        try {
            const schema = parseSQL(content);
            const name = filename.replace(/\.(sql|txt)$/i, '');
            const id = await createProject(user.id, name, '', schema);
            addRecent(id);
            router.push(`/editor/${id}`);
        } catch (err: any) {
            alert(err.message || 'Failed to parse SQL');
        } finally {
            setCreating(false);
        }
    };

    const handleOpenProject = (id: string) => {
        addRecent(id);
        setRecentIds(getRecentIds());
        router.push(`/editor/${id}`);
    };

    const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = toggleFavoriteStore(id);
        setFavorites(new Set(next));
    }, []);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    // ── Filtering + Sorting ──────────────────────────────────────────────────
    const filteredProjects = useMemo(() => {
        let list = [...projects];

        // tab filter
        if (activeTab === 'recent') {
            const order = recentIds;
            list = list.filter(p => order.includes(p.id));
            list.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
            return list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (activeTab === 'favorites') {
            list = list.filter(p => favorites.has(p.id));
        }
        if (activeTab === 'shared') {
            // Projects where userId !== current user (shared via public role)
            list = list.filter(p => (p as any).userId !== user?.id);
        }

        // search
        list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

        // sort
        list.sort((a, b) => {
            let cmp = 0;
            if (sortKey === 'updated') cmp = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            else if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
            else if (sortKey === 'tables') cmp = (b.tableCount || 0) - (a.tableCount || 0);
            return sortDir === 'asc' ? -cmp : cmp;
        });

        return list;
    }, [projects, activeTab, searchQuery, favorites, recentIds, sortKey, sortDir, user?.id]);

    const stats = useMemo(() => ({
        total: projects.length,
        tables: projects.reduce((acc, p) => acc + (p.tableCount || 0), 0),
        favorites: favorites.size,
        recent: recentIds.filter(id => projects.some(p => p.id === id)).length,
    }), [projects, favorites, recentIds]);

    // ────────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden relative">
            {/* Ambient glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.05, 0.03], x: [0, 50, 0], y: [0, -30, 0] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[120px] -mr-64 -mt-64" />
                <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.02, 0.04, 0.02], x: [0, -40, 0], y: [0, 40, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-500 rounded-full blur-[120px] -ml-64 -mb-64" />
            </div>

            {/* ── Sidebar ── */}
            <div className="w-72 border-r border-[var(--border)] glass flex flex-col z-10">
                <div className="p-5 border-b border-[var(--border)]">
                    <Button
                        variant="primary"
                        className="w-full rounded-2xl py-6 shadow-glow gap-3 font-bold text-xs uppercase tracking-widest"
                        onClick={() => setShowNewModal(true)}
                    >
                        <Plus size={16} /> New Project
                    </Button>
                </div>

                <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {/* Nav */}
                    <SidebarNav icon={Grid} label="All Projects" active={activeTab === 'all'} count={stats.total} onClick={() => setActiveTab('all')} />
                    <SidebarNav icon={History} label="Recent" active={activeTab === 'recent'} count={stats.recent || undefined} onClick={() => setActiveTab('recent')} />
                    <SidebarNav icon={Star} label="Favorites" active={activeTab === 'favorites'} count={stats.favorites || undefined} onClick={() => setActiveTab('favorites')} />

                    <div className="pt-6 pb-1 px-3">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Workspace</span>
                    </div>
                    <SidebarNav icon={Users} label="Shared with me" active={activeTab === 'shared'} onClick={() => setActiveTab('shared')} />
                    <SidebarNav icon={Globe} label="All Projects" active={false} onClick={() => setActiveTab('all')} />

                    {/* Sort control */}
                    <div className="pt-6 pb-1 px-3">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Sort by</span>
                    </div>
                    <div className="px-1 space-y-0.5">
                        {(['updated', 'name', 'tables'] as SortKey[]).map(key => (
                            <button key={key} onClick={() => handleSort(key)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${sortKey === key ? 'bg-white/5 text-white' : 'text-[var(--text-muted)] hover:text-white hover:bg-white/[0.02]'}`}>
                                <span className="capitalize">{key === 'updated' ? 'Last Updated' : key === 'tables' ? 'Table Count' : 'Name'}</span>
                                {sortKey === key && (
                                    sortDir === 'desc' ? <SortDesc size={12} className="text-indigo-400" /> : <SortAsc size={12} className="text-indigo-400" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Quick Stats */}
                    <div className="pt-6 pb-1 px-3">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Insights</span>
                    </div>
                    <div className="mx-1 p-3 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2.5">
                        <StatRow icon={BarChart3} label="Total Tables" value={String(stats.tables)} color="text-indigo-400" />
                        <StatRow icon={Database} label="Projects" value={String(stats.total)} color="text-violet-400" />
                        <StatRow icon={Star} label="Saved" value={String(stats.favorites)} color="text-amber-400" />
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (stats.total / 10) * 100)}%` }}
                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                        </div>
                        <p className="text-[9px] text-[var(--text-muted)]">{stats.total}/10 free tier projects</p>
                    </div>
                </div>

                {/* Bottom: user + settings */}
                <div className="border-t border-[var(--border)] p-3 space-y-1">
                    <SidebarNav icon={Settings} label="Settings" active={showSettings} onClick={() => setShowSettings(true)} />
                    <SidebarNav icon={CreditCard} label="Upgrade to Pro" active={false} onClick={() => router.push('/pricing')}
                        badge={<span className="text-[8px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full">PRO</span>} />
                    {user && (
                        <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-2xl bg-white/[0.02] border border-white/5">
                            <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                {user.user_metadata?.avatar_url
                                    ? <img src={user.user_metadata.avatar_url} className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" alt="avatar" />
                                    : <User size={13} className="text-indigo-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-white truncate">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                                <p className="text-[9px] text-[var(--text-muted)] truncate">{user.email}</p>
                            </div>
                            <button onClick={handleSignOut} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all" title="Sign out">
                                <LogOut size={12} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col z-10 overflow-hidden">
                {/* Header */}
                <div className="h-18 px-8 py-4 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-primary)]/50 backdrop-blur-md">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <div className="relative flex-1 group">
                            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-[var(--surface)] border border-[var(--border)] focus:border-indigo-500/50 rounded-xl pl-10 pr-8 py-2.5 text-sm text-[var(--text-primary)] transition-all outline-none"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors">
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 ml-6">
                        <div className="flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}><Grid size={15} /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}><List size={15} /></button>
                        </div>
                        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-500/20">
                            <Plus size={13} /> New
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="max-w-6xl mx-auto">
                        {/* Upload zone */}
                        <div className="mb-8">
                            <UploadZone variant="hero" onFileContent={handleQuickUpload} />
                        </div>

                        {/* Section header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black tracking-tight text-white mb-0.5">
                                    {activeTab === 'all' && 'All Projects'}
                                    {activeTab === 'recent' && 'Recently Opened'}
                                    {activeTab === 'favorites' && '⭐ Favorites'}
                                    {activeTab === 'shared' && 'Shared with Me'}
                                    {activeTab === 'trash' && 'Trash'}
                                </h2>
                                <p className="text-xs text-[var(--text-muted)] font-medium">
                                    {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                                    {searchQuery && ` matching "${searchQuery}"`}
                                </p>
                            </div>

                            {/* Inline sort buttons */}
                            <div className="flex items-center gap-2">
                                {(['updated', 'name', 'tables'] as SortKey[]).map(key => (
                                    <button key={key} onClick={() => handleSort(key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${sortKey === key
                                            ? 'bg-white/5 border-white/10 text-white'
                                            : 'border-transparent text-[var(--text-muted)] hover:text-white'
                                            }`}>
                                        {key === 'updated' ? 'Updated' : key === 'tables' ? 'Tables' : 'Name'}
                                        {sortKey === key && (sortDir === 'desc' ? <SortDesc size={10} /> : <SortAsc size={10} />)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Project grid/list */}
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-52 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />)}
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <EmptyState tab={activeTab} searchQuery={searchQuery} onClear={() => setSearchQuery('')} onNew={() => setShowNewModal(true)} />
                        ) : (
                            <div className={viewMode === 'grid'
                                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                                : 'flex flex-col gap-3'
                            }>
                                <AnimatePresence mode="popLayout">
                                    {filteredProjects.map((project, i) => (
                                        <ProjectCard
                                            key={project.id}
                                            project={project}
                                            index={i}
                                            viewMode={viewMode}
                                            isFavorited={favorites.has(project.id)}
                                            isDeleting={deletingId === project.id}
                                            onDelete={() => handleDelete(project.id, project.name)}
                                            onClick={() => handleOpenProject(project.id)}
                                            onToggleFavorite={(e) => toggleFavorite(project.id, e)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── New Project Modal ── */}
            <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="New Project">
                <div className="space-y-5">
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">Start fresh or describe your schema and let AI set up the tables.</p>
                    <Input id="project-name" label="Project Name" placeholder="e.g. E-commerce Backend" value={newName}
                        onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && newDesc === '' && handleCreate()} autoFocus />
                    <Input id="project-desc" label="Description (optional)" placeholder="Briefly describe your schema..." value={newDesc}
                        onChange={e => setNewDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
                    <div className="flex gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setShowNewModal(false)} className="flex-1 text-[10px] uppercase font-bold tracking-wider">Cancel</Button>
                        <Button onClick={handleCreate} isLoading={creating} disabled={!newName.trim()} className="flex-1 py-6 text-xs font-black uppercase tracking-widest shadow-glow">
                            Create Project
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ── Settings Modal ── */}
            <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings">
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                            {user?.user_metadata?.avatar_url
                                ? <img src={user?.user_metadata?.avatar_url} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" alt="avatar" />
                                : <User size={20} className="text-indigo-400" />}
                        </div>
                        <div>
                            <p className="font-bold text-white">{user?.user_metadata?.full_name || 'User'}</p>
                            <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)] border border-white/5 mt-1 inline-block">Free Plan</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Preferences</h4>
                        <SettingRow label="Default view" value={viewMode === 'grid' ? 'Grid' : 'List'} onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} />
                        <SettingRow label="Sort by" value={sortKey === 'updated' ? 'Last Updated' : sortKey === 'name' ? 'Name' : 'Tables'} onClick={() => handleSort(sortKey === 'updated' ? 'name' : sortKey === 'name' ? 'tables' : 'updated')} />
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Account</h4>
                        <button onClick={() => { setShowSettings(false); router.push('/pricing'); }}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/30 transition-all group">
                            <div className="flex items-center gap-3">
                                <Sparkles size={16} className="text-indigo-400" />
                                <span className="text-sm font-bold text-white">Upgrade to Pro</span>
                            </div>
                            <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:text-indigo-400 transition-colors" />
                        </button>
                        <button onClick={handleSignOut}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/10 hover:border-red-500/30 hover:bg-red-500/10 transition-all group">
                            <div className="flex items-center gap-3">
                                <LogOut size={16} className="text-red-400" />
                                <span className="text-sm font-bold text-red-300">Sign Out</span>
                            </div>
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SidebarNav({ icon: Icon, label, active, onClick, count, badge }: {
    icon: any; label: string; active: boolean; onClick?: () => void;
    count?: number; badge?: React.ReactNode;
}) {
    return (
        <button onClick={onClick}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${active ? 'bg-indigo-500/10 text-white border border-indigo-500/20'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-white/[0.03] border border-transparent'
                }`}>
            <div className="flex items-center gap-2.5">
                <Icon size={15} className={active ? 'text-indigo-400' : 'group-hover:text-indigo-400 transition-colors'} />
                <span className="text-xs font-bold">{label}</span>
            </div>
            {badge}
            {count !== undefined && count > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? 'bg-indigo-500 text-white' : 'bg-white/5 text-[var(--text-muted)]'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function StatRow({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Icon size={11} className={color} />
                <span className="text-[10px] text-[var(--text-muted)] font-bold">{label}</span>
            </div>
            <span className="text-[10px] text-white font-black">{value}</span>
        </div>
    );
}

function SettingRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
    return (
        <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
            <span className="text-sm text-[var(--text-secondary)] font-medium">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-muted)]">{value}</span>
                <ChevronRight size={12} className="text-[var(--text-muted)]" />
            </div>
        </button>
    );
}

function EmptyState({ tab, searchQuery, onClear, onNew }: { tab: TabId; searchQuery: string; onClear: () => void; onNew: () => void }) {
    const messages: Record<TabId, { title: string; desc: string }> = {
        all: { title: 'No projects yet', desc: 'Create your first ERD or import a SQL file to get started.' },
        recent: { title: 'No recent projects', desc: 'Open a project to see it here.' },
        favorites: { title: 'No favorites yet', desc: 'Click the ☆ star on any project card to save it here.' },
        shared: { title: 'Nothing shared with you', desc: 'Projects shared via invite link will appear here.' },
        trash: { title: 'Trash is empty', desc: 'Deleted projects will appear here.' },
    };
    const msg = searchQuery ? { title: `No results for "${searchQuery}"`, desc: 'Try a different search term.' } : messages[tab];

    return (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center mb-6">
                <FolderOpen size={32} className="text-indigo-400 opacity-40" />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">{msg.title}</h3>
            <p className="text-sm text-[var(--text-muted)] max-w-xs mb-8 leading-relaxed">{msg.desc}</p>
            {searchQuery
                ? <button onClick={onClear} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold text-white transition-all border border-white/5"><X size={14} /> Clear Search</button>
                : tab === 'all' && <button onClick={onNew} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20"><Plus size={14} /> New Project</button>
            }
        </motion.div>
    );
}

function ProjectCard({ project, index, viewMode, isFavorited, isDeleting, onDelete, onClick, onToggleFavorite }: {
    project: ProjectMeta; index: number; viewMode: 'grid' | 'list';
    isFavorited: boolean; isDeleting: boolean;
    onDelete: () => void; onClick: () => void;
    onToggleFavorite: (e: React.MouseEvent) => void;
}) {
    const Icon = PROJECT_ICONS[index % PROJECT_ICONS.length];

    if (viewMode === 'list') {
        return (
            <motion.div layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.02 }} onClick={onClick}
                className={`group p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:border-indigo-500/30 transition-all flex items-center gap-5 cursor-pointer ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                    <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate group-hover:text-indigo-400 transition-colors text-sm">{project.name}</h3>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">{project.description || 'No description'}</p>
                </div>
                <div className="hidden md:flex items-center gap-6 text-[10px] font-bold text-[var(--text-muted)] whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><Layout size={11} className="text-indigo-400/50" />{project.tableCount} Tables</div>
                    <div className="flex items-center gap-1.5"><Clock size={11} className="text-indigo-400/50" />{new Date(project.updatedAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onToggleFavorite} className={`p-1.5 rounded-lg transition-all ${isFavorited ? 'text-amber-400' : 'text-[var(--text-muted)] hover:text-amber-400'}`}>
                        <Star size={13} fill={isFavorited ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all">
                        <Trash2 size={13} />
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.04, duration: 0.4 }}
            className={isDeleting ? 'opacity-50 pointer-events-none' : ''}>
            <Card hover className="relative flex flex-col overflow-hidden group border-[var(--border)] hover:border-indigo-500/30 transition-all duration-500 bg-[var(--surface)]/50 rounded-[2rem]">
                {/* Card header visual */}
                <div className="h-20 w-full bg-indigo-500/[0.03] border-b border-[var(--border)] relative overflow-hidden flex items-center justify-center">
                    <Icon size={40} className="text-indigo-500/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] to-transparent opacity-60" />
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                </div>

                {/* Top-right action buttons */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                    <button onClick={onToggleFavorite}
                        className={`p-2 rounded-xl bg-[var(--bg-primary)]/80 backdrop-blur-md border border-white/5 transition-all shadow-xl ${isFavorited ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-[var(--text-muted)] hover:text-amber-400'}`}>
                        <Star size={12} fill={isFavorited ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onDelete(); }}
                        className="p-2 rounded-xl bg-[var(--bg-primary)]/80 backdrop-blur-md border border-white/5 text-[var(--text-muted)] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-xl">
                        <Trash2 size={12} />
                    </button>
                </div>

                <div className="p-6 cursor-pointer flex flex-col h-full relative" onClick={onClick}>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-500">
                        <Icon size={22} className="text-indigo-400 group-hover:text-white transition-colors" />
                    </div>

                    <h3 className="text-base font-bold mb-2 tracking-tight text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{project.name}</h3>
                    <p className="text-[var(--text-muted)] text-xs mb-6 line-clamp-2 font-medium leading-relaxed">
                        {project.description || 'Visualizing a unique database architecture.'}
                    </p>

                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
                            {project.tableCount} Entities
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-full border border-white/5">
                            <Clock size={10} className="text-indigo-400" />
                            {new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
