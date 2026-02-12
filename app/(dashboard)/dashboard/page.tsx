'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Database, Clock, Trash2, FolderOpen,
    ArrowRight, Search, Layout, Settings,
    History, Star, Grid, List, Globe,
    Shield, Cpu, Zap, Activity
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

// Aesthetic icons for project "DNA"
const PROJECT_ICONS = [Database, Cpu, Zap, Activity, Shield, Globe];

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<ProjectMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'trash'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
            const id = await createProject(user.id, newName.trim());
            setShowNewModal(false);
            setNewName('');
            router.push(`/editor/${id}`);
        } catch (err) {
            console.error('Failed to create project', err);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!user) return;
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
        try {
            await deleteProject(id);
            setProjects((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error('Failed to delete project', err);
        }
    };

    const handleQuickUpload = async (content: string, filename: string) => {
        if (!user) return;
        setCreating(true);
        try {
            const schema = parseSQL(content);
            const name = filename.replace(/\.(sql|txt)$/i, '');
            const id = await createProject(user.id, name, '', schema);
            router.push(`/editor/${id}`);
        } catch (err: any) {
            alert(err.message || 'Failed to parse SQL');
        } finally {
            setCreating(false);
        }
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [projects, searchQuery]);

    const stats = useMemo(() => ({
        total: projects.length,
        tables: projects.reduce((acc, p) => acc + (p.tableCount || 0), 0),
        lastEdited: projects.length > 0 ? projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0].name : 'N/A'
    }), [projects]);

    return (
        <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden relative">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.03, 0.05, 0.03],
                        x: [0, 50, 0],
                        y: [0, -30, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500 rounded-full blur-[120px] -mr-64 -mt-64"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.02, 0.04, 0.02],
                        x: [0, -40, 0],
                        y: [0, 40, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-500 rounded-full blur-[120px] -ml-64 -mb-64"
                />
            </div>

            {/* Sidebar Shell */}
            <div className="w-72 border-r border-[var(--border)] glass flex flex-col z-10">
                <div className="p-6">
                    <Button
                        variant="primary"
                        className="w-full rounded-2xl py-6 shadow-glow gap-3 font-bold text-xs uppercase tracking-widest"
                        onClick={() => setShowNewModal(true)}
                    >
                        <Plus size={18} />
                        New Project
                    </Button>
                </div>

                <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
                    <SidebarItem
                        icon={Grid}
                        label="All Projects"
                        active={activeTab === 'all'}
                        onClick={() => setActiveTab('all')}
                        count={projects.length}
                    />
                    <SidebarItem
                        icon={History}
                        label="Recent"
                        active={activeTab === 'recent'}
                        onClick={() => setActiveTab('recent')}
                    />
                    <SidebarItem
                        icon={Star}
                        label="Favorites"
                    />
                    <div className="pt-8 pb-2 px-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Organization</span>
                    </div>
                    <SidebarItem icon={FolderOpen} label="Shared with me" />
                    <SidebarItem icon={Trash2} label="Trash" active={activeTab === 'trash'} onClick={() => setActiveTab('trash')} />

                    <div className="pt-8 pb-2 px-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Insights</span>
                    </div>
                    <div className="px-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-[var(--text-muted)] font-bold">Total Assets</span>
                            <span className="text-[10px] text-white font-black">{stats.tables} Tables</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '65%' }}
                                className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[var(--border)]">
                    <SidebarItem icon={Settings} label="Settings" />
                </div>
            </div>

            {/* Main Content Shell */}
            <div className="flex-1 flex flex-col z-10 overflow-hidden">
                {/* Modern Header */}
                <div className="h-20 px-8 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-primary)]/50 backdrop-blur-md">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <div className="relative flex-1 group">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search your architectures..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[var(--surface)] border border-[var(--border)] focus:border-indigo-500/50 rounded-2xl pl-12 pr-12 py-3 text-sm text-[var(--text-primary)] transition-all outline-none"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10">
                                <span className="text-[9px] font-bold text-[var(--text-muted)]">⌘</span>
                                <span className="text-[9px] font-bold text-[var(--text-muted)]">K</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-500 text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-white'}`}
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-12">
                            <UploadZone variant="hero" onFileContent={handleQuickUpload} />
                        </div>

                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-white mb-1">
                                    {activeTab === 'all' ? 'All Architectures' :
                                        activeTab === 'recent' ? 'Recently Opened' : 'Trash'}
                                </h2>
                                <p className="text-sm text-[var(--text-muted)] font-medium">
                                    Displaying {filteredProjects.length} projects in your workspace.
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <select className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2 text-xs font-bold text-[var(--text-muted)] outline-none focus:border-indigo-500/50">
                                    <option>Sort by: Last Updated</option>
                                    <option>Sort by: Name</option>
                                    <option>Sort by: Size</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="h-64 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
                                ))}
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-32 text-center"
                            >
                                <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/5 flex items-center justify-center mb-8 border border-indigo-500/10 shadow-2xl relative">
                                    <FolderOpen size={40} className="text-indigo-400 opacity-50" />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        className="absolute inset-0 rounded-[2rem] border-2 border-indigo-500/20"
                                    />
                                </div>
                                <h2 className="text-3xl font-black mb-4 tracking-tight text-white">
                                    {searchQuery ? "No matching data found" : "Ready to architect?"}
                                </h2>
                                <p className="text-[var(--text-secondary)] max-w-sm mb-10 font-medium leading-relaxed">
                                    {searchQuery
                                        ? `We scanned the database but couldn't find "${searchQuery}". Maybe try another query?`
                                        : "Your workspace is pristine. Start your next big database design or import an existing SQL schema."}
                                </p>
                                <Button
                                    variant="primary"
                                    onClick={() => searchQuery ? setSearchQuery('') : setShowNewModal(true)}
                                    className="rounded-2xl px-10 py-6 text-xs uppercase tracking-widest font-black shadow-glow"
                                >
                                    {searchQuery ? "Clear Filters" : "Create New Schema"}
                                    <Plus size={18} className="ml-2" />
                                </Button>
                            </motion.div>
                        ) : (
                            <div className={viewMode === 'grid'
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                                : "flex flex-col gap-4"
                            }>
                                <AnimatePresence mode="popLayout">
                                    {filteredProjects.map((project, i) => (
                                        <ProjectCard
                                            key={project.id}
                                            project={project}
                                            index={i}
                                            viewMode={viewMode}
                                            onDelete={() => handleDelete(project.id, project.name)}
                                            onClick={() => router.push(`/editor/${project.id}`)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* New Project Modal */}
            <Modal
                isOpen={showNewModal}
                onClose={() => setShowNewModal(false)}
                title="Create New Architecture"
            >
                <div className="space-y-6">
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">
                        Set a name for your workspace. Our AI-powered engine will initialize
                        a canvas where you can build, import, and collaborate.
                    </p>
                    <Input
                        id="project-name"
                        label="Project Title"
                        placeholder="e.g. Neo-Banking Ledger"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        autoFocus
                    />
                    <div className="flex flex-col gap-3 pt-4">
                        <Button
                            onClick={handleCreate}
                            isLoading={creating}
                            disabled={!newName.trim()}
                            className="w-full py-7 text-xs font-black uppercase tracking-[0.2em] shadow-glow"
                        >
                            Initialize Environment
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setShowNewModal(false)}
                            className="w-full font-bold text-[10px] uppercase tracking-wider text-[var(--text-muted)]"
                        >
                            Back to Workspace
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function SidebarItem({ icon: Icon, label, active, onClick, count }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${active
                ? 'bg-indigo-500/10 text-white border border-indigo-500/20'
                : 'text-[var(--text-muted)] hover:text-white hover:bg-white/[0.03]'
                }`}
        >
            <div className="flex items-center gap-3">
                <Icon size={18} className={active ? 'text-indigo-400' : 'group-hover:text-indigo-400 transition-colors'} />
                <span className="text-xs font-bold tracking-tight">{label}</span>
            </div>
            {count !== undefined && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${active ? 'bg-indigo-500 text-white' : 'bg-white/5 text-[var(--text-muted)]'
                    }`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function ProjectCard({ project, index, viewMode, onDelete, onClick }: any) {
    const Icon = PROJECT_ICONS[index % PROJECT_ICONS.length];

    if (viewMode === 'list') {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: index * 0.03 }}
                onClick={onClick}
                className="group p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:border-indigo-500/30 transition-all flex items-center gap-6 cursor-pointer"
            >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                    <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] truncate">{project.description || 'No description provided.'}</p>
                </div>
                <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase text-[var(--text-muted)] whitespace-nowrap">
                    <div className="flex items-center gap-2 w-24">
                        <Layout size={12} className="text-indigo-400/50" />
                        <span>{project.tableCount} Tables</span>
                    </div>
                    <div className="flex items-center gap-2 w-32">
                        <Clock size={12} className="text-indigo-400/50" />
                        <span>Edited {new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={14} />
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
        >
            <Card
                hover
                className="relative flex flex-col h-full overflow-hidden group border-[var(--border)] hover:border-indigo-500/30 transition-all duration-500 bg-[var(--surface)]/50 rounded-[2rem]"
            >
                {/* Visual "DNA" Placeholder */}
                <div className="h-24 w-full bg-indigo-500/[0.03] border-b border-[var(--border)] relative overflow-hidden flex items-center justify-center">
                    <Icon size={48} className="text-indigo-500/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] to-transparent opacity-60" />
                    {/* Decorative grid */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                </div>

                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2.5 rounded-xl bg-[var(--bg-primary)]/80 backdrop-blur-md border border-white/5 text-[var(--text-muted)] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                <div
                    className="p-8 cursor-pointer flex flex-col h-full relative"
                    onClick={onClick}
                >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] group-hover:text-white transition-all duration-500">
                        <Icon size={24} className="text-indigo-400 group-hover:text-white transition-colors" />
                    </div>

                    <h3 className="text-xl font-bold mb-3 tracking-tight text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {project.name}
                    </h3>

                    <p className="text-[var(--text-muted)] text-sm mb-10 line-clamp-2 min-h-10 font-medium leading-relaxed">
                        {project.description || 'Visualizing a unique database architecture.'}
                    </p>

                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-muted)]">
                        <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                            <span>{project.tableCount} Entities</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                            <Clock size={11} className="text-indigo-400" />
                            <span>{new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                {/* Hover Glow */}
                <div className="absolute inset-0 pointer-events-none border-2 border-transparent group-hover:border-indigo-500/20 transition-all duration-500 rounded-[2rem]" />
            </Card>
        </motion.div>
    );
}

