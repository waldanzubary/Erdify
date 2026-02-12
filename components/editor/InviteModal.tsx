import { useState, useEffect } from 'react';
import { Share2, Copy, Check, Users, Globe, Lock, Shield, Mail, Trash2, ChevronDown, UserPlus, Eye, Edit3 } from 'lucide-react';
import Modal from '../ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { inviteUser, listProjectMembers, removeMember, updatePublicRole } from '@/lib/db/actions';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    publicRole: string;
    onPublicRoleChange: (role: 'view' | 'edit') => void;
}

export default function InviteModal({ isOpen, onClose, projectId, publicRole, onPublicRoleChange }: InviteModalProps) {
    const [copied, setCopied] = useState(false);
    const [email, setEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'view' | 'edit'>('view');
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/editor/${projectId}` : '';

    const fetchMembers = async () => {
        const data = await listProjectMembers(projectId);
        setMembers(data);
    };

    useEffect(() => {
        if (isOpen) {
            fetchMembers();
        }
    }, [isOpen, projectId]);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleInvite = async () => {
        if (!email.trim() || !email.includes('@')) return;
        setLoading(true);
        try {
            await inviteUser(projectId, email.toLowerCase(), inviteRole);
            setEmail('');
            await fetchMembers();
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id: string) => {
        await removeMember(id);
        await fetchMembers();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Project Sharing">
            <div className="space-y-6 py-2">
                {/* Share Link Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                            <Globe size={12} className="text-indigo-400" />
                            Public Access
                        </label>
                        <select
                            value={publicRole}
                            onChange={(e) => onPublicRoleChange(e.target.value as 'view' | 'edit')}
                            className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/20 outline-none cursor-pointer hover:bg-indigo-500/20 transition-all"
                        >
                            <option value="view">View Only</option>
                            <option value="edit">Can Edit</option>
                        </select>
                    </div>

                    <div className="relative group p-1 bg-black/20 border border-white/5 rounded-xl flex items-center gap-2 focus-within:border-indigo-500/50 transition-all">
                        <input
                            readOnly
                            value={shareUrl}
                            className="flex-1 bg-transparent text-xs text-[var(--text-secondary)] px-3 py-2 outline-none select-all font-mono"
                        />
                        <button
                            onClick={handleCopy}
                            className={`p-2 rounded-lg transition-all flex items-center gap-2 px-3 ${copied
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white/5 hover:bg-white/10 text-[var(--text-primary)] border border-white/10'
                                }`}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            <span className="text-[10px] font-black uppercase tracking-tight">
                                {copied ? 'Copied' : 'Copy'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="h-px bg-white/5" />

                {/* Invite Section */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                        <Mail size={12} className="text-indigo-400" />
                        Invite Collaborators
                    </label>
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Input
                                placeholder="Enter email address..."
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="!py-2 !pl-10 !text-xs rounded-xl"
                            />
                            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        </div>
                        <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as 'view' | 'edit')}
                            className="bg-white/5 border border-white/10 rounded-xl px-3 text-[10px] font-bold uppercase tracking-tight text-[var(--text-primary)] outline-none focus:border-indigo-500/50"
                        >
                            <option className='text-black' value="view">View</option>
                            <option  className='text-black' value="edit">Edit</option>
                        </select>
                        <Button
                            size="sm"
                            variant="primary"
                            className="rounded-xl px-4"
                            onClick={handleInvite}
                            disabled={loading || !email.trim()}
                        >
                            <UserPlus size={14} />
                        </Button>
                    </div>
                </div>

                {/* Members List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                            <Users size={12} className="text-indigo-400" />
                            Project Members ({members.length})
                        </label>
                    </div>
                    <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
                        {members.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-[10px] text-[var(--text-muted)] font-medium italic">No members invited yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-[10px]">
                                                {member.email[0].toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold text-white truncate">{member.email}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {member.role === 'edit' ? (
                                                        <span className="flex items-center gap-1 text-[8px] font-black uppercase text-amber-400/80 bg-amber-400/10 px-1.5 py-0.25 rounded border border-amber-400/20">
                                                            <Edit3 size={8} /> Editor
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-[8px] font-black uppercase text-indigo-400/80 bg-indigo-500/10 px-1.5 py-0.25 rounded border border-indigo-500/20">
                                                            <Eye size={8} /> Viewer
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(member.id)}
                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Shield size={12} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">Access Control</p>
                        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                            Owners always have full editing rights. Collaborators must sign in with their invited email.
                        </p>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
