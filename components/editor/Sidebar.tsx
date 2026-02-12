'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Table2,
    Plus,
    Trash2,
    ChevronDown,
    ChevronRight,
    Pencil,
    X,
    Link2,
    Activity,
    Layers,
    Database,
    ArrowRight,
} from 'lucide-react';
import type { ERSchema, ERTable, ERColumn } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const DATA_TYPES = [
    'INT', 'BIGINT', 'SMALLINT', 'TINYINT',
    'VARCHAR', 'TEXT', 'CHAR',
    'BOOLEAN', 'BIT',
    'DECIMAL', 'FLOAT', 'DOUBLE',
    'DATE', 'DATETIME', 'TIMESTAMP', 'TIME',
    'BLOB', 'JSON', 'UUID',
];

interface SidebarProps {
    schema: ERSchema;
    selectedTableId: string | null;
    onSelectTable: (id: string | null) => void;
    onAddTable: (name: string) => void;
    onRemoveTable: (id: string) => void;
    onRenameTable: (id: string, name: string) => void;
    onAddColumn: (tableId: string, column?: Partial<ERColumn>) => void;
    onRemoveColumn: (tableId: string, columnName: string) => void;
    onUpdateColumn: (tableId: string, columnName: string, updates: Partial<ERColumn>) => void;
    onAddRelationship: (rel: any) => void;
    onRemoveRelationship: (id: string) => void;
    canEdit?: boolean;
}

export default function Sidebar({
    schema,
    selectedTableId,
    onSelectTable,
    onAddTable,
    onRemoveTable,
    onRenameTable,
    onAddColumn,
    onRemoveColumn,
    onUpdateColumn,
    onAddRelationship,
    onRemoveRelationship,
    canEdit = false,
}: SidebarProps) {
    const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
    const [newTableName, setNewTableName] = useState('');
    const [showAddTable, setShowAddTable] = useState(false);
    const [editingTable, setEditingTable] = useState<string | null>(null);
    const [editTableName, setEditTableName] = useState('');
    const [editingColumn, setEditingColumn] = useState<{ tableId: string; colName: string } | null>(null);
    const [editColName, setEditColName] = useState('');

    const toggleExpand = (id: string) => {
        const next = new Set(expandedTables);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedTables(next);
    };

    const handleAddTable = () => {
        if (!newTableName.trim()) return;
        onAddTable(newTableName.trim());
        setNewTableName('');
        setShowAddTable(false);
    };

    const handleStartRename = (table: ERTable) => {
        setEditingTable(table.id);
        setEditTableName(table.name);
    };

    const handleFinishRename = () => {
        if (editingTable && editTableName.trim()) {
            onRenameTable(editingTable, editTableName.trim());
        }
        setEditingTable(null);
    };

    const handleStartColRename = (tableId: string, col: ERColumn) => {
        setEditingColumn({ tableId, colName: col.name });
        setEditColName(col.name);
    };

    const handleFinishColRename = () => {
        if (editingColumn && editColName.trim()) {
            onUpdateColumn(editingColumn.tableId, editingColumn.colName, { name: editColName.trim() });
        }
        setEditingColumn(null);
    };

    const cycleColumnType = (tableId: string, col: ERColumn) => {
        const currentType = col.type.toUpperCase().split('(')[0];
        const currentIndex = DATA_TYPES.indexOf(currentType);
        const nextType = DATA_TYPES[(currentIndex + 1) % DATA_TYPES.length];
        onUpdateColumn(tableId, col.name, { type: nextType });
    };

    return (
        <div className="w-[340px] h-full glass border-r border-[var(--border)] flex flex-col overflow-hidden">
            {/* Header Area */}
            <div className="p-5 border-b border-[var(--border)] bg-white/[0.02]">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <Layers size={14} className="text-indigo-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Schema Explorer</span>
                        </div>
                        <h2 className="text-lg font-black tracking-tight text-[var(--text-primary)]">
                            Tables <span className="text-indigo-400/50 ml-1">{schema.tables.length}</span>
                        </h2>
                    </div>
                    {canEdit && (
                        <Button
                            variant="subtle"
                            size="sm"
                            className="rounded-xl w-10 h-10 p-0"
                            onClick={() => setShowAddTable(!showAddTable)}
                        >
                            <Plus size={18} />
                        </Button>
                    )}
                </div>

                <AnimatePresence>
                    {canEdit && showAddTable && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-[var(--surface)] p-3 rounded-2xl border border-indigo-500/20 shadow-xl mb-4"
                        >
                            <div className="flex flex-col gap-3">
                                <Input
                                    placeholder="Entity name..."
                                    value={newTableName}
                                    onChange={(e) => setNewTableName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
                                    className="!py-2 !text-xs"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="flex-1 text-[10px] uppercase font-bold tracking-widest h-8" onClick={() => setShowAddTable(false)}>
                                        Cancel
                                    </Button>
                                    <Button size="sm" variant="primary" onClick={handleAddTable} disabled={!newTableName.trim()} className="flex-1 text-[10px] uppercase font-bold tracking-widest h-8">
                                        Create Entity
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {schema.tables.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-[var(--text-muted)] border border-white/5">
                            <Database size={24} />
                        </div>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
                            No entities detected in this workspace. {canEdit ? 'Add a table or import SQL to begin.' : 'Owner has not added any tables yet.'}
                        </p>
                    </div>
                ) : (
                    schema.tables.map((table) => (
                        <div
                            key={table.id}
                            className={`group rounded-2xl border transition-all duration-300 ${selectedTableId === table.id
                                ? 'bg-indigo-500/5 border-indigo-500/30'
                                : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5'
                                }`}
                        >
                            <div
                                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                                onClick={() => {
                                    onSelectTable(selectedTableId === table.id ? null : table.id);
                                    toggleExpand(table.id);
                                }}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedTableId === table.id ? 'bg-indigo-500 text-white' : 'bg-white/5 text-[var(--text-muted)] group-hover:bg-white/10'
                                    }`}>
                                    <Table2 size={16} />
                                </div>

                                {canEdit && editingTable === table.id ? (
                                    <input
                                        className="flex-1 bg-transparent border-b border-indigo-400 outline-none text-sm font-bold text-white py-0.5"
                                        value={editTableName}
                                        onChange={(e) => setEditTableName(e.target.value)}
                                        onBlur={handleFinishRename}
                                        onKeyDown={(e) => e.key === 'Enter' && handleFinishRename()}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span className={`flex-1 text-sm font-bold tracking-tight transition-colors ${selectedTableId === table.id ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                                        }`}>
                                        {table.name}
                                    </span>
                                )}

                                {canEdit && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStartRename(table);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-white transition-colors"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveTable(table.id);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <AnimatePresence>
                                {expandedTables.has(table.id) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="px-4 pb-4 space-y-1.5"
                                    >
                                        <div className="h-px bg-white/5 mb-3 mx-2" />
                                        {table.columns.map((col) => (
                                            <div
                                                key={col.name}
                                                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.03] transition-colors group/col"
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${col.isPrimaryKey ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]' :
                                                    col.isForeignKey ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.4)]' :
                                                        'bg-zinc-600'
                                                    }`} />

                                                {canEdit && editingColumn?.tableId === table.id && editingColumn?.colName === col.name ? (
                                                    <input
                                                        className="flex-1 bg-transparent border-b border-indigo-400 outline-none text-[11px] font-bold text-white py-0.5"
                                                        value={editColName}
                                                        onChange={(e) => setEditColName(e.target.value)}
                                                        onBlur={handleFinishColRename}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleFinishColRename()}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span
                                                        className={`flex-1 text-[11px] font-bold tracking-tight text-[var(--text-secondary)] truncate ${canEdit ? 'cursor-text hover:text-white' : ''} transition-colors`}
                                                        onClick={() => canEdit && handleStartColRename(table.id, col)}
                                                    >
                                                        {col.name}
                                                    </span>
                                                )}

                                                <span
                                                    className={`text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] px-1.5 py-0.5 rounded transition-all ${canEdit ? 'cursor-pointer hover:text-indigo-400 hover:bg-white/5' : ''}`}
                                                    onClick={() => canEdit && cycleColumnType(table.id, col)}
                                                >
                                                    {col.type.replace(/\(.*\)/, '')}
                                                </span>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => onRemoveColumn(table.id, col.name)}
                                                        className="p-1 rounded-lg opacity-0 group-hover/col:opacity-100 hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {canEdit && (
                                            <button
                                                onClick={() => onAddColumn(table.id)}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)] hover:text-indigo-400 hover:bg-indigo-500/5 transition-all border border-dashed border-white/5 hover:border-indigo-500/20"
                                            >
                                                <Plus size={12} />
                                                Append Field
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>

            {/* Relationships Area */}
            <div className="mt-auto border-t border-[var(--border)] bg-black/20 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link2 size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Connections</span>
                    </div>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {schema.relationships.length === 0 ? (
                        <p className="text-[10px] text-[var(--text-muted)] italic font-medium">No relations declared.</p>
                    ) : (
                        schema.relationships.map((rel) => (
                            <div
                                key={rel.id}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 transition-all group"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-white mb-0.5">
                                        <span className="truncate">{rel.sourceTable}</span>
                                        <ArrowRight size={8} className="text-indigo-400 shrink-0" />
                                        <span className="truncate">{rel.targetTable}</span>
                                    </div>
                                    <p className="text-[9px] text-[var(--text-muted)] font-medium truncate">
                                        {rel.sourceColumn} → {rel.targetColumn}
                                    </p>
                                </div>
                                {canEdit && (
                                    <button
                                        onClick={() => onRemoveRelationship(rel.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-all"
                                    >
                                        <X size={10} />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
