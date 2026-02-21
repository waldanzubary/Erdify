const { config } = require('dotenv');
config({ path: '.env.local' });
const postgres = require('postgres');

const sql = `
CREATE TABLE IF NOT EXISTS "user_plans" (
    "user_id" text PRIMARY KEY NOT NULL,
    "role" text DEFAULT 'free' NOT NULL,
    "flowchart_count_week" integer DEFAULT 0 NOT NULL,
    "dummy_count_week" integer DEFAULT 0 NOT NULL,
    "week_start" timestamp DEFAULT now() NOT NULL,
    "stripe_customer_id" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);
`;

async function run() {
    const client = postgres(process.env.DATABASE_URL, { prepare: false });
    try {
        await client.unsafe(sql);
        console.log('✅ user_plans table created successfully!');
    } catch (err) {
        if (err.message && err.message.includes('already exists')) {
            console.log('✅ user_plans table already exists, skipping.');
        } else {
            console.error('❌ Migration failed:', err.message);
        }
    } finally {
        await client.end();
    }
}

run();
