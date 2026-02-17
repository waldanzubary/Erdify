const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    const sql = postgres(process.env.DATABASE_URL);

    try {
        console.log('Adding flowchart column to projects table...');
        await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS flowchart JSONB;`;
        console.log('✅ Successfully added flowchart column.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await sql.end();
    }
}

migrate();
