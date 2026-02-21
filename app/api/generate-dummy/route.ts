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

        const { schema, rowCount } = await req.json() as { schema: ERSchema; rowCount: number };

        if (!schema || !schema.tables || schema.tables.length === 0) {
            return NextResponse.json({ error: 'Schema with at least one table is required' }, { status: 400 });
        }

        // Enforce rowCount limit based on plan
        const userPlan = usageCheck.plan;
        const limits = PLAN_LIMITS[userPlan.role as PlanRole] || PLAN_LIMITS.free;
        const maxRows = limits.maxDummyRows === -1 ? 5000 : limits.maxDummyRows;
        const clampedRowCount = Math.min(rowCount || 10, maxRows);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
        }

        // Build schema summary for the prompt
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

        const prompt = `
You are an expert database engineer and data generator.

Given the following database schema, generate realistic dummy data for ALL tables with exactly ${clampedRowCount} rows per table (or fewer if it's a lookup/enum-style table).

IMPORTANT RULES:
1. Generate data that looks REAL and contextually appropriate based on table and column NAMES.
   - If a table is called "users", generate realistic names, emails, dates.
   - If a column is called "email", generate actual email addresses like john@gmail.com.
   - If a column is "phone", generate formatted phone numbers.
   - If a column is "status", use values like 'active', 'inactive', 'pending'.
   - If a column is "price" or "amount", generate realistic numbers with decimals.
   - timestamps should look like real ISO dates (e.g. "2024-03-15 10:23:45").
2. Respect relationships: if table B has a FK to table A's primary key, the FK values in B must exist in A's generated data.
3. Primary keys (INT/BIGINT) start from 1 and increment. UUID PKs should be valid UUID v4 strings.
4. VARCHAR/TEXT should have values appropriate in length (not just "Lorem ipsum").
5. BOOLEAN: use true/false (no quotes).
6. Numeric values: no quotes. String values: no quotes needed in JSON.
7. Use a mix of Indonesian and international names/values where appropriate.

DATABASE SCHEMA:
${schemaSummary}

Return ONLY a valid JSON object with this structure:
{
  "tableName1": [
    { "column1": value1, "column2": value2 },
    ...
  ],
  "tableName2": [...]
}

Generate exactly ${clampedRowCount} rows per table unless the table is a reference/lookup table.
Return ONLY the raw JSON object, no markdown code blocks, no explanation.
`;

        const genAI = new GoogleGenerativeAI(apiKey);
        // Same model list as generate-flowchart which is already working
        const modelsToTry = [
            'gemini-2.0-flash',
            'gemini-2.5-flash',
            'gemini-flash-latest',
            'gemini-1.5-flash',
            'gemini-1.5-pro',
        ];

        let text = '';
        const modelErrors: string[] = [];
        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                text = result.response.text();
                if (text) {
                    console.log(`Success with model: ${modelName}, response length: ${text.length}`);
                    break;
                }
            } catch (err: any) {
                const msg = err.message || String(err);
                console.warn(`Failed with model ${modelName}:`, msg);
                modelErrors.push(`${modelName}: ${msg}`);
            }
        }

        if (!text) {
            console.error('All models failed:', modelErrors);
            return NextResponse.json({
                error: 'Failed to generate dummy data from AI',
                details: modelErrors,
            }, { status: 500 });
        }

        if (!text) {
            return NextResponse.json({ error: 'Failed to generate dummy data from AI' }, { status: 500 });
        }

        // Parse JSON — strip markdown if present
        let jsonString = text.trim();
        if (jsonString.startsWith('```')) {
            jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        }
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonString = jsonMatch[0];

        let data: Record<string, any[]>;
        try {
            data = JSON.parse(jsonString);
        } catch (e: any) {
            console.error('Failed to parse dummy data JSON:', e.message, '\nRaw:', text.substring(0, 500));
            return NextResponse.json({ error: 'AI returned invalid JSON', raw: text.substring(0, 500) }, { status: 500 });
        }

        // Increment usage after successful generation
        await incrementUsage(userId, 'dummy');

        return NextResponse.json({
            data,
            rowCount: clampedRowCount,
            plan: userPlan.role,
        });

    } catch (error: any) {
        console.error('Dummy data generation error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
