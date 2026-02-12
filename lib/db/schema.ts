import { pgTable, text, timestamp, jsonb, uuid, real } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    schema: jsonb('schema').notNull(),
    userId: text('user_id').notNull(),
    publicRole: text('public_role').default('view').notNull(), // 'view' or 'edit'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectMembers = pgTable('project_members', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role').default('view').notNull(), // 'view' or 'edit'
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notes = pgTable('notes', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    userName: text('user_name').notNull(),
    content: text('content').notNull(),
    status: text('status').default('todo').notNull(),
    positionX: real('position_x'),
    positionY: real('position_y'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
