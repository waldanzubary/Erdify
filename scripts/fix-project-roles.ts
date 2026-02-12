
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL!;

async function migrate() {
    console.log('Connecting to database...');
    const sql = postgres(connectionString);

    try {
        console.log('Adding "public_role" column to "projects" table...');
        await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS public_role TEXT DEFAULT 'view' NOT NULL`;

        console.log('Creating "project_members" table...');
        await sql`
            CREATE TABLE IF NOT EXISTS project_members (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                email TEXT NOT NULL,
                role TEXT DEFAULT 'view' NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        `;

        console.log('Success! Schema updated for project roles.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sql.end();
    }
}

migrate();
