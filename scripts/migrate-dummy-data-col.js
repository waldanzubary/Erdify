const { config } = require('dotenv');
config({ path: '.env.local' });
const postgres = require('postgres');

const sql = `
ALTER TABLE projects ADD COLUMN IF NOT EXISTS dummy_data jsonb;
`;

async function run() {
    const client = postgres(process.env.DATABASE_URL, { prepare: false });
    try {
        await client.unsafe(sql);
        console.log('✅ dummy_data column added to projects table!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await client.end();
    }
}

run();
