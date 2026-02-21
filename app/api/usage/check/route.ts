import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkUsage, getUserPlan, upsertUserPlan } from '@/lib/db/actions';
import { PLAN_LIMITS, getRemainingUses } from '@/lib/plans';
import type { PlanRole } from '@/lib/plans';

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
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { feature } = await req.json();
        if (!feature || !['flowchart', 'dummy'].includes(feature)) {
            return NextResponse.json({ error: 'Invalid feature' }, { status: 400 });
        }

        const userId = user.id;
        const result = await checkUsage(userId, feature);
        const plan = result.plan;
        const limits = PLAN_LIMITS[plan.role as PlanRole] || PLAN_LIMITS.free;

        return NextResponse.json({
            allowed: result.allowed,
            reason: result.reason,
            plan: {
                role: plan.role,
                flowchartCountWeek: plan.flowchartCountWeek,
                dummyCountWeek: plan.dummyCountWeek,
            },
            limits: {
                flowchartsPerWeek: limits.flowchartsPerWeek,
                dummyPerWeek: limits.dummyPerWeek,
                maxDummyRows: limits.maxDummyRows,
            },
            remaining: {
                flowcharts: getRemainingUses(plan.flowchartCountWeek, limits.flowchartsPerWeek),
                dummy: getRemainingUses(plan.dummyCountWeek, limits.dummyPerWeek),
            }
        });
    } catch (error: any) {
        console.error('Usage check error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
