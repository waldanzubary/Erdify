'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Loader2, Sparkles, Download, X, Lock, Zap,
    AlertCircle, Check, Table2, Edit3, RefreshCw
} from 'lucide-react';
import type { ERSchema } from '@/lib/types';
import type { PlanRole } from '@/lib/plans';
import { PLAN_LIMITS } from '@/lib/plans';

interface DummyDataPanelProps {
    schema: ERSchema;
    dummyData: Record<string, Record<string, any>[]> | null;
    isGenerating: boolean;
    planRole: PlanRole;
    remainingDummy: number;
    maxRows: number;
    onGenerate: (rowCount: number) => void;
    onExportSQLWithData: () => void;
    onClose: () => void;
    onDataChange: (data: Record<string, Record<string, any>[]>) => void; // for edits
}

const ROW_COUNT_OPTIONS = [10, 25, 50, 100, 200, 500, 1000, 5000];

export default function DummyDataPanel({
    schema,
    dummyData,
    isGenerating,
    planRole,
    remainingDummy,
    maxRows,
    onGenerate,
    onExportSQLWithData,
    onClose,
    onDataChange,
}: DummyDataPanelProps) {
    const [rowCount, setRowCount] = useState(10);
    const [activeTable, setActiveTable] = useState<string | null>(null);

    // Inline editing state
    const [editingCell, setEditingCell] = useState<{ rowIdx: number; col: string } | null>(null);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const planLimits = PLAN_LIMITS[planRole] || PLAN_LIMITS.free;
    const isUnlimited = planLimits.maxDummyRows === -1;
    const canGenerate = remainingDummy > 0 || isUnlimited;

    const validOptions = ROW_COUNT_OPTIONS.filter(n => maxRows === -1 || n <= maxRows);

    const tableNames = dummyData ? Object.keys(dummyData) : [];
    const displayTable = activeTable && dummyData?.[activeTable]
        ? activeTable
        : tableNames[0] || null;

    const currentRows = displayTable && dummyData ? dummyData[displayTable] || [] : [];
    const currentColumns = schema.tables.find(t => t.name === displayTable)?.columns.map(c => c.name)
        || (currentRows[0] ? Object.keys(currentRows[0]) : []);

    // Start editing a cell
    const startEdit = useCallback((rowIdx: number, col: string, currentVal: any) => {
        setEditingCell({ rowIdx, col });
        setEditValue(currentVal === null || currentVal === undefined ? '' : String(currentVal));
        setTimeout(() => inputRef.current?.focus(), 20);
    }, []);

    // Commit the edit
    const commitEdit = useCallback(() => {
        if (!editingCell || !displayTable || !dummyData) {
            setEditingCell(null);
            return;
        }
        const { rowIdx, col } = editingCell;
        const updated = { ...dummyData };
        const rows = [...(updated[displayTable] || [])];
        const row = { ...rows[rowIdx] };

        // Try to preserve the original type
        const original = row[col];
        if (typeof original === 'number') {
            const num = parseFloat(editValue);
            row[col] = isNaN(num) ? editValue : num;
        } else if (typeof original === 'boolean') {
            row[col] = editValue.toLowerCase() === 'true' || editValue === '1';
        } else {
            row[col] = editValue;
        }
        rows[rowIdx] = row;
        updated[displayTable] = rows;
        onDataChange(updated);
        setEditingCell(null);
    }, [editingCell, displayTable, dummyData, editValue, onDataChange]);

    const cancelEdit = useCallback(() => setEditingCell(null), []);

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-[420px] glass border-l border-[var(--border)] flex flex-col z-40 shadow-2xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-primary)]/60 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <Database size={16} className="text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Dummy Data</h3>
                        <p className="text-[10px] text-[var(--text-muted)] font-medium">
                            Click any cell to edit • auto-saves
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${planRole === 'developer' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            planRole === 'pro' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                                'bg-white/5 border-white/10 text-[var(--text-muted)]'
                        }`}>{planRole}</span>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Generator config */}
            <div className="p-4 border-b border-[var(--border)] space-y-3 shrink-0">
                {/* Usage */}
                {!isUnlimited && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${canGenerate
                            ? 'bg-violet-500/5 border border-violet-500/10 text-violet-300'
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                        }`}>
                        {canGenerate ? (
                            <><Zap size={12} /><span>{remainingDummy} generation{remainingDummy !== 1 ? 's' : ''} left this week</span></>
                        ) : (
                            <><Lock size={12} /><span>Weekly limit reached. <a href="/pricing" className="underline">Upgrade to Pro</a></span></>
                        )}
                    </div>
                )}
                {isUnlimited && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500/5 border border-emerald-500/10 text-emerald-300">
                        <Sparkles size={12} /><span>Unlimited (Developer)</span>
                    </div>
                )}

                {/* Row count */}
                <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">
                        Rows per table
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                        {validOptions.map(n => (
                            <button
                                key={n}
                                onClick={() => setRowCount(n)}
                                className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${rowCount === n
                                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                                        : 'bg-white/[0.03] border border-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {n >= 1000 ? `${n / 1000}k` : n}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate button */}
                <button
                    onClick={() => canGenerate && !isGenerating && onGenerate(rowCount)}
                    disabled={isGenerating || !canGenerate || schema.tables.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/20 disabled:bg-white/5 disabled:text-[var(--text-muted)] disabled:shadow-none"
                >
                    {isGenerating
                        ? <><Loader2 size={13} className="animate-spin" /><span>Generating...</span></>
                        : <><RefreshCw size={13} /><span>{dummyData ? 'Regenerate' : 'Generate'} {rowCount} Rows</span></>
                    }
                </button>

                {schema.tables.length === 0 && (
                    <div className="flex items-center gap-2 text-[10px] text-amber-400/70">
                        <AlertCircle size={11} />
                        <span>Add tables to your ERD first</span>
                    </div>
                )}
            </div>

            {/* Data preview + editing */}
            {dummyData && tableNames.length > 0 ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Table selector tabs */}
                    <div className="flex gap-1 px-3 pt-3 pb-1 overflow-x-auto custom-scrollbar shrink-0">
                        {tableNames.map(tbl => (
                            <button
                                key={tbl}
                                onClick={() => { setActiveTable(tbl); setEditingCell(null); }}
                                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${displayTable === tbl
                                        ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300'
                                        : 'bg-white/[0.02] border border-white/5 text-[var(--text-muted)] hover:text-white'
                                    }`}
                            >
                                <Table2 size={10} />
                                {tbl}
                                <span className="opacity-50 font-normal">{dummyData[tbl]?.length}</span>
                            </button>
                        ))}
                    </div>

                    {/* Table grid with inline editing */}
                    <div className="flex-1 overflow-auto custom-scrollbar p-3">
                        {currentRows.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-[10px] border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="text-left px-2 py-1.5 bg-white/[0.03] border border-white/5 text-white/20 font-black w-8">#</th>
                                            {currentColumns.map(col => (
                                                <th
                                                    key={col}
                                                    className="text-left px-2 py-1.5 bg-white/[0.03] border border-white/5 text-[var(--text-muted)] font-black uppercase tracking-wider whitespace-nowrap"
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentRows.map((row, rowIdx) => (
                                            <tr key={rowIdx} className="group hover:bg-white/[0.015] transition-colors">
                                                <td className="px-2 py-1 border border-white/[0.04] text-white/15 select-none">{rowIdx + 1}</td>
                                                {currentColumns.map(col => {
                                                    const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.col === col;
                                                    const val = row[col];
                                                    const displayVal = val === null || val === undefined ? '' : String(val);

                                                    return (
                                                        <td
                                                            key={col}
                                                            className={`border border-white/[0.04] transition-colors relative ${isEditing
                                                                    ? 'bg-violet-500/10 border-violet-500/30'
                                                                    : 'hover:bg-white/[0.03] cursor-pointer'
                                                                }`}
                                                            onClick={() => !isEditing && startEdit(rowIdx, col, val)}
                                                        >
                                                            {isEditing ? (
                                                                <div className="flex items-center">
                                                                    <input
                                                                        ref={inputRef}
                                                                        value={editValue}
                                                                        onChange={e => setEditValue(e.target.value)}
                                                                        onKeyDown={e => {
                                                                            if (e.key === 'Enter') commitEdit();
                                                                            if (e.key === 'Escape') cancelEdit();
                                                                            if (e.key === 'Tab') {
                                                                                e.preventDefault();
                                                                                commitEdit();
                                                                                // Move to next column
                                                                                const colIdx = currentColumns.indexOf(col);
                                                                                const nextCol = currentColumns[colIdx + 1];
                                                                                if (nextCol) setTimeout(() => startEdit(rowIdx, nextCol, currentRows[rowIdx][nextCol]), 10);
                                                                            }
                                                                        }}
                                                                        onBlur={commitEdit}
                                                                        className="w-full px-2 py-1 bg-transparent text-white text-[10px] font-mono outline-none min-w-[80px]"
                                                                    />
                                                                    <button
                                                                        onMouseDown={e => { e.preventDefault(); commitEdit(); }}
                                                                        className="px-1 text-violet-400 hover:text-white shrink-0"
                                                                    >
                                                                        <Check size={10} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="px-2 py-1 flex items-center gap-1 group/cell">
                                                                    {val === null || val === undefined ? (
                                                                        <span className="text-white/15 italic">null</span>
                                                                    ) : (
                                                                        <span className="text-[var(--text-secondary)] font-mono truncate max-w-[100px]" title={displayVal}>
                                                                            {displayVal.length > 16 ? displayVal.slice(0, 16) + '…' : displayVal}
                                                                        </span>
                                                                    )}
                                                                    <Edit3 size={8} className="shrink-0 text-violet-400/0 group-hover/cell:text-violet-400/60 transition-all" />
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
                                <Table2 size={24} className="text-white/10" />
                                <p className="text-xs text-[var(--text-muted)]">No data for this table</p>
                            </div>
                        )}
                    </div>

                    {/* Export */}
                    <div className="p-3 border-t border-[var(--border)] shrink-0">
                        <button
                            onClick={onExportSQLWithData}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30 text-[var(--text-secondary)] hover:text-white transition-all"
                        >
                            <Download size={13} className="text-violet-400" />
                            Export SQL + Data
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center">
                        <Database size={28} className="text-violet-400/30" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white/50 mb-1">No data yet</p>
                        <p className="text-xs text-[var(--text-muted)] max-w-[220px] leading-relaxed">
                            Generate AI-powered test data based on your schema. Click any cell to edit after generating.
                        </p>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
