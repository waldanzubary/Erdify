'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { PlanRole } from '@/lib/plans';
import { PLAN_LIMITS, getRemainingUses } from '@/lib/plans';

interface PlanInfo {
    role: PlanRole;
    flowchartCountWeek: number;
    dummyCountWeek: number;
}

interface PlanState {
    loading: boolean;
    plan: PlanInfo | null;
    remaining: { flowcharts: number; dummy: number };
    limits: { flowchartsPerWeek: number; dummyPerWeek: number; maxDummyRows: number };
    canGenerateFlowchart: boolean;
    canGenerateDummy: boolean;
}

async function getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = await getAuthToken();
    if (!token) throw new Error('Not authenticated');
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });
}

export function usePlan() {
    const [state, setState] = useState<PlanState>({
        loading: true,
        plan: null,
        remaining: { flowcharts: 3, dummy: 1 },
        limits: PLAN_LIMITS.free,
        canGenerateFlowchart: true,
        canGenerateDummy: true,
    });

    const fetchPlan = useCallback(async () => {
        try {
            const token = await getAuthToken();
            if (!token) {
                setState(prev => ({ ...prev, loading: false }));
                return;
            }

            const res = await fetch('/api/usage/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ feature: 'flowchart' }),
            });

            if (!res.ok) {
                setState(prev => ({ ...prev, loading: false }));
                return;
            }

            const data = await res.json();
            const plan = data.plan as PlanInfo;
            const limits = data.limits;

            setState({
                loading: false,
                plan,
                remaining: data.remaining,
                limits,
                canGenerateFlowchart: data.allowed,
                canGenerateDummy: getRemainingUses(plan.dummyCountWeek, limits.dummyPerWeek) > 0,
            });
        } catch {
            setState(prev => ({ ...prev, loading: false }));
        }
    }, []);

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    const refresh = useCallback(() => {
        fetchPlan();
    }, [fetchPlan]);

    return { ...state, refresh };
}
