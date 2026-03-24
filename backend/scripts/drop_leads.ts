import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    const client = await pool.connect();
    try {
        console.log('Dropping leads table...');
        await client.query('DROP TABLE IF EXISTS "leads" CASCADE;');
        console.log('Leads table dropped successfully.');
    } catch (err) {
        console.error('Failed to drop table:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
