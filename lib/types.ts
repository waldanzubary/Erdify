/* ── Types for ER Schema ── */

export interface ERColumn {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isNotNull: boolean;
    isUnique: boolean;
    defaultValue?: string;
    references?: {
        table: string;
        column: string;
    };
}

export interface ERTable {
    id: string;
    name: string;
    columns: ERColumn[];
    position?: { x: number; y: number };
}

export interface ERRelationship {
    id: string;
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface ERSchema {
    tables: ERTable[];
    relationships: ERRelationship[];
}

/* ── Types for Project ── */

export interface Project {
    id: string;
    name: string;
    description?: string;
    schema: ERSchema;
    userId: string;
    createdAt: number;
    updatedAt: number;
}

export interface ProjectMeta {
    id: string;
    name: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
    tableCount: number;
}
