import { Parser } from 'node-sql-parser';
import type { ERTable, ERColumn, ERRelationship, ERSchema } from '@/lib/types';

const parser = new Parser();

function cleanIdentifier(id: string): string {
    if (!id) return '';
    return id.replace(/[`"']/g, '').trim();
}

/**
 * Try multiple SQL dialects to parse the input.
 * node-sql-parser can be strict about syntax, so we try MySQL first,
 * then PostgreSQL, then a permissive fallback.
 */
function tryParse(sql: string): any[] {
    const dialects = ['MySQL', 'PostgreSQL', 'TransactSQL'] as const;
    for (const db of dialects) {
        try {
            const ast = parser.astify(sql, { database: db });
            return Array.isArray(ast) ? ast : [ast];
        } catch {
            // try next dialect
        }
    }
    throw new Error('Failed to parse SQL. Please check your syntax.');
}

export function parseSQL(sql: string): ERSchema {
    const tables: ERTable[] = [];
    const relationships: ERRelationship[] = [];

    try {
        const statements = tryParse(sql);

        // ── Pass 1: Extract all CREATE TABLE statements ──
        for (const stmt of statements) {
            const s = stmt as any;
            if (s.type !== 'create' || s.keyword !== 'table') continue;

            const tableName = cleanIdentifier(
                typeof s.table === 'string'
                    ? s.table
                    : Array.isArray(s.table)
                        ? s.table[0]?.table || 'unknown'
                        : s.table?.table || 'unknown'
            );

            const columns: ERColumn[] = [];
            const primaryKeys: string[] = [];

            if (s.create_definitions) {
                // First pass: extract constraint-level PKs and FKs
                for (const def of s.create_definitions as any[]) {
                    if (def.resource === 'constraint') {
                        if (def.constraint_type === 'primary key' && def.definition) {
                            for (const col of def.definition) {
                                primaryKeys.push(cleanIdentifier(col.column?.expr?.value || col.column || ''));
                            }
                        }
                        if (
                            (def.constraint_type === 'REFERENCES' || def.constraint_type === 'foreign key') &&
                            def.definition
                        ) {
                            const fkCols = def.definition || [];
                            const refTable = cleanIdentifier(def.reference_definition?.table?.[0]?.table || '');
                            const refCols = def.reference_definition?.definition || [];

                            for (let i = 0; i < fkCols.length; i++) {
                                const sourceCol = cleanIdentifier(fkCols[i]?.column?.expr?.value || fkCols[i]?.column || '');
                                const targetCol = cleanIdentifier(refCols[i]?.column?.expr?.value || refCols[i]?.column || '');

                                if (sourceCol && refTable && targetCol) {
                                    relationships.push({
                                        id: `${tableName}.${sourceCol}->${refTable}.${targetCol}`,
                                        sourceTable: tableName,
                                        sourceColumn: sourceCol,
                                        targetTable: refTable,
                                        targetColumn: targetCol,
                                        type: 'one-to-many',
                                    });
                                }
                            }
                        }
                    }
                }

                // Second pass: extract columns
                for (const def of s.create_definitions as any[]) {
                    if (def.resource !== 'column') continue;

                    const colName = cleanIdentifier(def.column?.column?.expr?.value || def.column?.column || '');
                    const dataType = def.definition?.dataType || 'VARCHAR';
                    const length = def.definition?.length || '';
                    const typeStr = length ? `${dataType}(${length})` : dataType;

                    const isPK =
                        primaryKeys.includes(colName) ||
                        def.auto_increment === 'auto_increment' ||
                        def.primary_key === 'primary key';

                    const isNotNull = def.nullable?.type === 'not null' || isPK;
                    const isUnique = def.unique_or_primary === 'unique' || false;

                    // Inline REFERENCES on column definition
                    let references: ERColumn['references'] = undefined;
                    if (def.reference_definition) {
                        const refTable = cleanIdentifier(def.reference_definition?.table?.[0]?.table || '');
                        const refCol = cleanIdentifier(
                            def.reference_definition?.definition?.[0]?.column?.expr?.value ||
                            def.reference_definition?.definition?.[0]?.column ||
                            ''
                        );
                        if (refTable && refCol) {
                            references = { table: refTable, column: refCol };
                            relationships.push({
                                id: `${tableName}.${colName}->${refTable}.${refCol}`,
                                sourceTable: tableName,
                                sourceColumn: colName,
                                targetTable: refTable,
                                targetColumn: refCol,
                                type: 'one-to-many',
                            });
                        }
                    }

                    const isForeignKey =
                        !!references ||
                        relationships.some(
                            (r) => r.sourceTable === tableName && r.sourceColumn === colName
                        );

                    const col: ERColumn = {
                        name: colName,
                        type: typeStr,
                        isPrimaryKey: isPK,
                        isForeignKey,
                        isNotNull,
                        isUnique,
                    };

                    if (references) {
                        col.references = references;
                    }

                    columns.push(col);
                }
            }

            tables.push({
                id: tableName,
                name: tableName,
                columns,
            });
        }

        // ── Pass 2: Extract ALTER TABLE ... ADD FOREIGN KEY statements ──
        for (const stmt of statements) {
            const s = stmt as any;
            if (s.type !== 'alter') continue;

            const tableName = cleanIdentifier(
                typeof s.table === 'string'
                    ? s.table
                    : Array.isArray(s.table)
                        ? s.table[0]?.table || 'unknown'
                        : s.table?.table || 'unknown'
            );

            const alterExpr = s.expr || [];
            const alterItems = Array.isArray(alterExpr) ? alterExpr : [alterExpr];

            for (const item of alterItems) {
                if (!item) continue;

                // Handle "ADD CONSTRAINT ... FOREIGN KEY ..."
                const action = item.action || item.keyword || '';
                if (typeof action === 'string' && action.toLowerCase() === 'add') {
                    const resDef = item.resource || item.create_definitions || item;

                    // If it has create_definitions (constraint block)
                    const defs = item.create_definitions
                        ? (Array.isArray(item.create_definitions) ? item.create_definitions : [item.create_definitions])
                        : [resDef];

                    for (const def of defs) {
                        if (!def) continue;
                        const cType = (def.constraint_type || '').toLowerCase();
                        if (
                            (cType === 'foreign key' || cType === 'references') &&
                            def.definition
                        ) {
                            const fkCols = Array.isArray(def.definition) ? def.definition : [def.definition];
                            const refTable = cleanIdentifier(def.reference_definition?.table?.[0]?.table || '');
                            const refCols = def.reference_definition?.definition || [];

                            for (let i = 0; i < fkCols.length; i++) {
                                const sourceCol = cleanIdentifier(fkCols[i]?.column?.expr?.value || fkCols[i]?.column || '');
                                const targetCol = cleanIdentifier(
                                    refCols[i]?.column?.expr?.value || refCols[i]?.column || ''
                                );

                                if (sourceCol && refTable && targetCol) {
                                    const relId = `${tableName}.${sourceCol}->${refTable}.${targetCol}`;
                                    // Avoid duplicates
                                    if (!relationships.some((r) => r.id === relId)) {
                                        relationships.push({
                                            id: relId,
                                            sourceTable: tableName,
                                            sourceColumn: sourceCol,
                                            targetTable: refTable,
                                            targetColumn: targetCol,
                                            type: 'one-to-many',
                                        });
                                    }

                                    // Mark the column as FK in the table
                                    const table = tables.find((t) => t.name === tableName);
                                    if (table) {
                                        const col = table.columns.find((c) => c.name === sourceCol);
                                        if (col) {
                                            col.isForeignKey = true;
                                            if (!col.references) {
                                                col.references = { table: refTable, column: targetCol };
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // ── Pass 3: Naming-convention heuristic ──
        // If no relationships were found, infer them from column names like
        // `user_id` → table `users` column `id` (or `user` → `id`).
        if (relationships.length === 0 && tables.length > 1) {
            const tableNames = tables.map((t) => t.name.toLowerCase());

            for (const table of tables) {
                for (const col of table.columns) {
                    if (col.isPrimaryKey) continue;
                    const colLower = col.name.toLowerCase();

                    // Match patterns like xxx_id
                    const match = colLower.match(/^(.+)_id$/);
                    if (!match) continue;

                    const baseName = match[1]; // e.g. "user" from "user_id"

                    // Try to match against table names (plural, singular, exact)
                    const candidates = [
                        baseName,           // user
                        baseName + 's',     // users
                        baseName + 'es',    // classes → class
                        baseName.replace(/ies$/, 'y'), // categories → category
                    ];

                    let targetTable: ERTable | undefined;
                    for (const candidate of candidates) {
                        targetTable = tables.find(
                            (t) => t.name.toLowerCase() === candidate && t.name !== table.name
                        );
                        if (targetTable) break;
                    }

                    // Also try reverse: if table is "users", check if baseName is "user"
                    if (!targetTable) {
                        targetTable = tables.find((t) => {
                            const tLower = t.name.toLowerCase();
                            return (
                                t.name !== table.name &&
                                (tLower === baseName ||
                                    tLower.replace(/s$/, '') === baseName ||
                                    tLower.replace(/es$/, '') === baseName ||
                                    tLower.replace(/ies$/, 'y') === baseName)
                            );
                        });
                    }

                    if (targetTable) {
                        // Find the PK column in the target table (usually 'id')
                        const pkCol = targetTable.columns.find((c) => c.isPrimaryKey);
                        const targetColName = pkCol?.name || 'id';

                        const relId = `${table.name}.${col.name}->${targetTable.name}.${targetColName}`;
                        if (!relationships.some((r) => r.id === relId)) {
                            relationships.push({
                                id: relId,
                                sourceTable: table.name,
                                sourceColumn: col.name,
                                targetTable: targetTable.name,
                                targetColumn: targetColName,
                                type: 'one-to-many',
                            });

                            col.isForeignKey = true;
                            col.references = { table: targetTable.name, column: targetColName };
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('SQL Parse Error:', error);
        throw new Error('Failed to parse SQL. Please check your syntax.');
    }

    return { tables, relationships };
}
