import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { incrementUsage, getUserPlan } from '@/lib/db/actions';
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
        await incrementUsage(userId, feature);

        const plan = await getUserPlan(userId);
        if (!plan) return NextResponse.json({ success: true });

        const limits = PLAN_LIMITS[plan.role as PlanRole] || PLAN_LIMITS.free;

        return NextResponse.json({
            success: true,
            remaining: {
                flowcharts: getRemainingUses(plan.flowchartCountWeek, limits.flowchartsPerWeek),
                dummy: getRemainingUses(plan.dummyCountWeek, limits.dummyPerWeek),
            }
        });
    } catch (error: any) {
        console.error('Usage increment error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
