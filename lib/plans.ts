// Plan tier limits for ERDify

export type PlanRole = 'free' | 'pro' | 'developer';

export interface PlanLimits {
    flowchartsPerWeek: number; // -1 = unlimited
    dummyPerWeek: number;      // -1 = unlimited
    maxDummyRows: number;      // -1 = unlimited
    label: string;
    color: string;
}

export const PLAN_LIMITS: Record<PlanRole, PlanLimits> = {
    free: {
        flowchartsPerWeek: 3,
        dummyPerWeek: 1,
        maxDummyRows: 200,
        label: 'Free',
        color: 'text-slate-400',
    },
    pro: {
        flowchartsPerWeek: 50,
        dummyPerWeek: 30,
        maxDummyRows: 5000,
        label: 'Pro',
        color: 'text-indigo-400',
    },
    developer: {
        flowchartsPerWeek: -1,
        dummyPerWeek: -1,
        maxDummyRows: -1,
        label: 'Developer',
        color: 'text-emerald-400',
    },
};

export function isUnlimited(value: number): boolean {
    return value === -1;
}

export function getRemainingUses(used: number, limit: number): number {
    if (limit === -1) return 999999;
    return Math.max(0, limit - used);
}

export function canUseFeature(used: number, limit: number): boolean {
    if (limit === -1) return true;
    return used < limit;
}
