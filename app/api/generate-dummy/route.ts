import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkUsage, incrementUsage } from '@/lib/db/actions';
import { PLAN_LIMITS } from '@/lib/plans';
import type { PlanRole } from '@/lib/plans';
import type { ERSchema } from '@/lib/types';

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        const supabase = getSupabaseAdmin();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

        // Check usage limit
        const usageCheck = await checkUsage(userId, 'dummy');
        if (!usageCheck.allowed) {
            return NextResponse.json({ error: usageCheck.reason, limitReached: true }, { status: 429 });
        }

        const { schema, rowCount, lastIds, existingData } = await req.json() as {
            schema: ERSchema;
            rowCount: number;
            lastIds?: Record<string, any>;
            existingData?: Record<string, any[]>;
        };

        if (!schema || !schema.tables || schema.tables.length === 0) {
            return NextResponse.json({ error: 'Schema with at least one table is required' }, { status: 400 });
        }

        const userPlan = usageCheck.plan;
        const limits = PLAN_LIMITS[userPlan.role as PlanRole] || PLAN_LIMITS.free;

        // RELAXED: Total Row Clamping
        // Goal: Total rows across all tables should not exceed ~150 to balance density and stability
        const TOTAL_SAFE_ROWS = 150;
        const tableCount = schema.tables.length;
        const rowsPerTableLimit = Math.max(2, Math.floor(TOTAL_SAFE_ROWS / tableCount));
        const clampedRowCount = Math.min(rowCount || 10, rowsPerTableLimit, 50);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
        }

        // Build schema summary
        const schemaSummary = schema.tables.map(table => {
            const cols = table.columns.map(col => {
                const refInfo = col.references ? ` REFERENCES ${col.references.table}(${col.references.column})` : '';
                const flags = [
                    col.isPrimaryKey ? 'PK' : '',
                    col.isForeignKey ? 'FK' : '',
                    col.isNotNull ? 'NOT NULL' : '',
                ].filter(Boolean).join(', ');
                return `  - ${col.name} (${col.type}${flags ? ', ' + flags : ''}${refInfo})`;
            }).join('\n');
            return `TABLE: ${table.name}\n${cols}`;
        }).join('\n\n');

        let appendContext = '';
        if (lastIds && Object.keys(lastIds).length > 0) {
            appendContext = `
IMPORTANT (APPEND MODE):
1. START PRIMARY KEYS (INT) FROM:
${Object.entries(lastIds).map(([tbl, val]) => `   - ${tbl}: Start from ${val}`).join('\n')}

2. DATA UNIQUENESS:
   - Ensure new data is DIFFERENT from existing data I already have.
   - Avoid repeating names, emails, or titles that appear in the sample below.
`;
        }

        if (existingData && Object.keys(existingData).length > 0) {
            appendContext += `
SAMPLE OF EXISTING DATA (Reference only, do NOT repeat these):
${JSON.stringify(existingData, null, 2)}
`;
        }

        const prompt = `
You are a database expert. Generate ${clampedRowCount} rows of realistic dummy data for the following database schema.
${appendContext}

Return ONLY a valid JSON object (no markdown, no explanation, no code blocks):
{ "tableName": [{ "col1": val1, ... }], ... }

RULES:
- GENERATE EXACTLY ${clampedRowCount} rows per table.
- DATA MUST BE EXTREMELY SUCCINCT: Use very short strings (max 20 chars).
- Realistic data: names, emails, dates, phone numbers.
- Foreign key values MUST reference values in parent table.
- Integer PKs start from 1 and increment (unless specified otherwise above).
- Booleans: true/false. Numbers: no quotes.
- Ensure the JSON is valid and COMPLETE.

DATABASE SCHEMA:
${schemaSummary}

Return ONLY the raw JSON object.
`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelsToTry = [
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-flash-latest',
            'gemini-pro-latest',
        ];

        let text = '';
        let lastError = '';

        for (const modelName of modelsToTry) {
            try {
                console.log(`[DUMMY] Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        maxOutputTokens: 8192, // Increased to prevent truncation
                        temperature: 0.8,
                        topP: 0.95,
                    }
                });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                text = response.text();
                if (text) {
                    console.log(`[DUMMY] Success with ${modelName}, length: ${text.length}`);
                    break;
                }
            } catch (err: any) {
                console.warn(`[DUMMY] Model ${modelName} failed:`, err.message);
                lastError = `${modelName}: ${err.message}`;
            }
        }

        if (!text) {
            return NextResponse.json({
                error: `Failed to generate dummy data. Last error: ${lastError}`
            }, { status: 500 });
        }

        // Parse JSON — robust extraction like the flowchart route
        let jsonString = text.trim();
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonString = jsonMatch[0];
            jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        let data: Record<string, any[]>;
        try {
            data = JSON.parse(jsonString);
        } catch (e: any) {
            console.warn('[DUMMY] JSON parse failed, attempting repair. Preview:', text.substring(text.length - 100));

            // Basic JSON Repair for Truncation
            // 1. Try to close the last string if open
            if ((jsonString.match(/"/g) || []).length % 2 !== 0) jsonString += '"';
            // 2. Try to close the last object/array/root
            let braceCount = (jsonString.match(/\{/g) || []).length - (jsonString.match(/\}/g) || []).length;
            let bracketCount = (jsonString.match(/\[/g) || []).length - (jsonString.match(/\]/g) || []).length;

            while (bracketCount > 0) { jsonString += ']'; bracketCount--; }
            while (braceCount > 0) { jsonString += '}'; braceCount--; }

            try {
                data = JSON.parse(jsonString);
                console.log('[DUMMY] JSON repair successful.');
            } catch (repairError) {
                console.error('[DUMMY] JSON repair failed.');
                return NextResponse.json({
                    error: `AI generated invalid JSON. Try with fewer rows or a simpler schema. Raw preview: ${text.substring(0, 100)}`
                }, { status: 500 });
            }
        }

        // Increment usage after successful generation
        await incrementUsage(userId, 'dummy');

        return NextResponse.json({
            data,
            rowCount: clampedRowCount,
            plan: userPlan.role,
        });

    } catch (error: any) {
        console.error('[DUMMY] Fatal error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
