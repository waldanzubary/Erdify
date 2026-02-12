'use client';

import { useState, useCallback } from 'react';
import type { ERSchema, ERTable, ERColumn, ERRelationship } from '@/lib/types';

function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

export function useERSchema(initialSchema?: ERSchema) {
    const [schema, setSchema] = useState<ERSchema>(
        initialSchema || { tables: [], relationships: [] }
    );

    const replaceSchema = useCallback((newSchema: ERSchema) => {
        setSchema(newSchema);
    }, []);

    const addTable = useCallback((name: string) => {
        setSchema((prev) => ({
            ...prev,
            tables: [
                ...prev.tables,
                {
                    id: `table_${generateId()}`,
                    name,
                    columns: [
                        {
                            name: 'id',
                            type: 'INT',
                            isPrimaryKey: true,
                            isForeignKey: false,
                            isNotNull: true,
                            isUnique: true,
                        },
                    ],
                },
            ],
        }));
    }, []);

    const removeTable = useCallback((tableId: string) => {
        setSchema((prev) => ({
            tables: prev.tables.filter((t) => t.id !== tableId),
            relationships: prev.relationships.filter(
                (r) =>
                    r.sourceTable !== prev.tables.find((t) => t.id === tableId)?.name &&
                    r.targetTable !== prev.tables.find((t) => t.id === tableId)?.name
            ),
        }));
    }, []);

    const renameTable = useCallback((tableId: string, newName: string) => {
        setSchema((prev) => {
            const oldTable = prev.tables.find((t) => t.id === tableId);
            if (!oldTable) return prev;
            const oldName = oldTable.name;
            return {
                tables: prev.tables.map((t) =>
                    t.id === tableId ? { ...t, name: newName } : t
                ),
                relationships: prev.relationships.map((r) => ({
                    ...r,
                    sourceTable: r.sourceTable === oldName ? newName : r.sourceTable,
                    targetTable: r.targetTable === oldName ? newName : r.targetTable,
                })),
            };
        });
    }, []);

    const addColumn = useCallback((tableId: string, column?: Partial<ERColumn>) => {
        setSchema((prev) => ({
            ...prev,
            tables: prev.tables.map((t) =>
                t.id === tableId
                    ? {
                        ...t,
                        columns: [
                            ...t.columns,
                            {
                                name: column?.name || `column_${generateId()}`,
                                type: column?.type || 'VARCHAR',
                                isPrimaryKey: column?.isPrimaryKey || false,
                                isForeignKey: column?.isForeignKey || false,
                                isNotNull: column?.isNotNull || false,
                                isUnique: column?.isUnique || false,
                            },
                        ],
                    }
                    : t
            ),
        }));
    }, []);

    const removeColumn = useCallback((tableId: string, columnName: string) => {
        setSchema((prev) => ({
            ...prev,
            tables: prev.tables.map((t) =>
                t.id === tableId
                    ? { ...t, columns: t.columns.filter((c) => c.name !== columnName) }
                    : t
            ),
        }));
    }, []);

    const updateColumn = useCallback(
        (tableId: string, columnName: string, updates: Partial<ERColumn>) => {
            setSchema((prev) => {
                const table = prev.tables.find((t) => t.id === tableId);
                if (!table) return prev;

                const isRename = updates.name && updates.name !== columnName;
                const oldName = columnName;
                const newName = updates.name || columnName;

                return {
                    ...prev,
                    tables: prev.tables.map((t) =>
                        t.id === tableId
                            ? {
                                ...t,
                                columns: t.columns.map((c) =>
                                    c.name === oldName ? { ...c, ...updates } : c
                                ),
                            }
                            : t
                    ),
                    relationships: isRename
                        ? prev.relationships.map((r) => {
                            const isSourceMatch = r.sourceTable === table.name && r.sourceColumn === oldName;
                            const isTargetMatch = r.targetTable === table.name && r.targetColumn === oldName;

                            if (isSourceMatch || isTargetMatch) {
                                return {
                                    ...r,
                                    sourceColumn: isSourceMatch ? newName : r.sourceColumn,
                                    targetColumn: isTargetMatch ? newName : r.targetColumn,
                                };
                            }
                            return r;
                        })
                        : prev.relationships,
                };
            });
        },
        []
    );

    const addRelationship = useCallback(
        (rel: Omit<ERRelationship, 'id'>) => {
            setSchema((prev) => ({
                ...prev,
                relationships: [
                    ...prev.relationships,
                    { ...rel, id: `rel_${generateId()}` },
                ],
            }));
        },
        []
    );

    const removeRelationship = useCallback((relId: string) => {
        setSchema((prev) => ({
            ...prev,
            relationships: prev.relationships.filter((r) => r.id !== relId),
        }));
    }, []);

    const updateTablePosition = useCallback((tableId: string, x: number, y: number) => {
        setSchema((prev) => ({
            ...prev,
            tables: prev.tables.map((t) =>
                t.id === tableId ? { ...t, position: { x, y } } : t
            ),
        }));
    }, []);

    return {
        schema,
        replaceSchema,
        addTable,
        removeTable,
        renameTable,
        addColumn,
        removeColumn,
        updateColumn,
        addRelationship,
        removeRelationship,
        updateTablePosition,
    };
}
