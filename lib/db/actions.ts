'use server';

import { db } from './index';
import { projects, notes, projectMembers, userPlans, type UserPlan } from './schema';
import { eq, desc } from 'drizzle-orm';
import type { ERSchema, ProjectMeta } from '../types';
import type { PlanRole } from '../plans';
import { PLAN_LIMITS, canUseFeature } from '../plans';

export async function createProject(
    userId: string,
    name: string,
    description?: string,
    initialSchema?: ERSchema
) {
    const [project] = await db.insert(projects).values({
        name,
        description: description || '',
        schema: initialSchema || { tables: [], relationships: [] },
        userId,
    }).returning();
    return project.id;
}

export async function loadProject(projectId: string) {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    return project || null;
}

export async function saveProject(
    projectId: string,
    data: Partial<{ name: string; description: string; schema: ERSchema; flowchart: { nodes: any[]; edges: any[] }; dummyData: Record<string, Record<string, any>[]> }>
) {
    await db.update(projects).set({
        ...data,
        updatedAt: new Date(),
    }).where(eq(projects.id, projectId));
}

export async function deleteProject(projectId: string) {
    await db.delete(projects).where(eq(projects.id, projectId));
}

export async function updatePublicRole(projectId: string, role: 'view' | 'edit') {
    await db.update(projects).set({ publicRole: role }).where(eq(projects.id, projectId));
}

// ── Project Members / Invitations ──

export async function inviteUser(projectId: string, email: string, role: 'view' | 'edit' = 'view') {
    // Check if already a member
    const existing = await db.select().from(projectMembers)
        .where(eq(projectMembers.projectId, projectId))
        .execute();

    const isExisting = existing.find(m => m.email.toLowerCase() === email.toLowerCase());
    if (isExisting) {
        await db.update(projectMembers)
            .set({ role })
            .where(eq(projectMembers.id, isExisting.id));
        return isExisting.id;
    }

    const [member] = await db.insert(projectMembers).values({
        projectId,
        email: email.toLowerCase(),
        role,
    }).returning();
    return member.id;
}

export async function removeMember(memberId: string) {
    await db.delete(projectMembers).where(eq(projectMembers.id, memberId));
}

export async function listProjectMembers(projectId: string) {
    return db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
}

export async function getProjectAccess(projectId: string, userEmail?: string, ownerId?: string, currentUserId?: string): Promise<'view' | 'edit' | 'none'> {
    // 1. Check if user is owner
    if (currentUserId && ownerId && currentUserId === ownerId) return 'edit';

    // 2. Check if user is an invited member
    if (userEmail) {
        const [member] = await db.select()
            .from(projectMembers)
            .where(eq(projectMembers.projectId, projectId))
            .execute();

        // Need to filter manually if drizzle query doesn't handle where email correctly or if we want to be safe
        const members = await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
        const matchedMember = members.find(m => m.email.toLowerCase() === userEmail.toLowerCase());

        if (matchedMember) return matchedMember.role as 'view' | 'edit';
    }

    // 3. Fallback to public role
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return 'none';

    return project.publicRole as 'view' | 'edit';
}

export async function recordAccess(projectId: string, userId: string, email: string) {
    // 1. Check if already owner
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (project && project.userId === userId) return;

    // 2. Check if already a member
    const members = await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
    const isMember = members.some(m => m.email.toLowerCase() === email.toLowerCase());
    if (isMember) return;

    // 3. Check if project is public (at least 'view')
    if (project && project.publicRole !== 'none') {
        await db.insert(projectMembers).values({
            projectId,
            email: email.toLowerCase(),
            role: project.publicRole as 'view' | 'edit',
        });
    }
}

export async function listProjects(userId: string, userEmail?: string): Promise<ProjectMeta[]> {
    // List owned projects
    const owned = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.updatedAt));

    // List shared projects (where user is a member)
    let shared: any[] = [];
    if (userEmail) {
        const memberships = await db.select().from(projectMembers).where(eq(projectMembers.email, userEmail.toLowerCase()));
        if (memberships.length > 0) {
            const sharedProjectIds = new Set(memberships.map(m => m.projectId));
            const allProjects = await db.select().from(projects);
            shared = allProjects.filter(p => sharedProjectIds.has(p.id) && p.userId !== userId);
        }
    }

    const allResults = [...owned, ...shared].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return allResults.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || undefined,
        createdAt: p.createdAt.getTime(),
        updatedAt: p.updatedAt.getTime(),
        tableCount: (p.schema as any)?.tables?.length || 0,
    }));
}

// ── Notes ──

export async function createNote(
    projectId: string,
    userId: string,
    userName: string,
    content: string,
    status: string = 'todo',
    positionX?: number,
    positionY?: number
) {
    const [note] = await db.insert(notes).values({
        projectId,
        userId,
        userName,
        content,
        status,
        positionX,
        positionY,
    }).returning();
    return note;
}

export async function listNotes(projectId: string) {
    return db
        .select()
        .from(notes)
        .where(eq(notes.projectId, projectId))
        .orderBy(notes.createdAt);
}

export async function deleteNote(noteId: string) {
    await db.delete(notes).where(eq(notes.id, noteId));
}
export async function updateNote(
    noteId: string,
    data: Partial<{ content: string; status: string; positionX: number; positionY: number }>
) {
    await db.update(notes).set(data).where(eq(notes.id, noteId));
}

// ── User Plans / Usage ──

export async function getUserPlan(userId: string) {
    const [plan] = await db.select().from(userPlans).where(eq(userPlans.userId, userId));
    return plan || null;
}

export async function upsertUserPlan(userId: string, role: PlanRole = 'free'): Promise<UserPlan> {
    const [plan] = await db.insert(userPlans).values({
        userId,
        role,
    }).onConflictDoUpdate({
        target: userPlans.userId,
        set: { role },
    }).returning();
    return plan;
}

/**
 * Checks if a week has passed since weekStart and resets counters if so.
 */
function isNewWeek(weekStart: Date): boolean {
    const now = new Date();
    const msSinceStart = now.getTime() - weekStart.getTime();
    return msSinceStart >= 7 * 24 * 60 * 60 * 1000;
}

/**
 * Returns { allowed, plan } and automatically resets weekly counters if needed.
 */
export async function checkUsage(
    userId: string,
    feature: 'flowchart' | 'dummy'
): Promise<{ allowed: boolean; reason?: string; plan: any }> {
    // Ensure plan exists
    let plan = await getUserPlan(userId);
    if (!plan) {
        plan = await upsertUserPlan(userId, 'free');
    }

    // Reset counters if new week
    if (isNewWeek(plan.weekStart)) {
        await db.update(userPlans).set({
            flowchartCountWeek: 0,
            dummyCountWeek: 0,
            weekStart: new Date(),
        }).where(eq(userPlans.userId, userId));
        plan = { ...plan, flowchartCountWeek: 0, dummyCountWeek: 0 };
    }

    const limits = PLAN_LIMITS[plan.role as PlanRole] || PLAN_LIMITS.free;

    if (feature === 'flowchart') {
        const allowed = canUseFeature(plan.flowchartCountWeek, limits.flowchartsPerWeek);
        return {
            allowed,
            reason: allowed ? undefined : `Free plan allows ${limits.flowchartsPerWeek} flowchart generations per week. Upgrade to Pro for more.`,
            plan,
        };
    } else {
        const allowed = canUseFeature(plan.dummyCountWeek, limits.dummyPerWeek);
        return {
            allowed,
            reason: allowed ? undefined : `Free plan allows ${limits.dummyPerWeek} dummy data generation per week. Upgrade to Pro for more.`,
            plan,
        };
    }
}

export async function incrementUsage(userId: string, feature: 'flowchart' | 'dummy') {
    const plan = await getUserPlan(userId);
    if (!plan) return;
    // Don't increment for developer role
    if (plan.role === 'developer') return;

    if (feature === 'flowchart') {
        await db.update(userPlans).set({
            flowchartCountWeek: plan.flowchartCountWeek + 1,
        }).where(eq(userPlans.userId, userId));
    } else {
        await db.update(userPlans).set({
            dummyCountWeek: plan.dummyCountWeek + 1,
        }).where(eq(userPlans.userId, userId));
    }
}
