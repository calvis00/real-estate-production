import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    const client = await pool.connect();
    try {
        console.log('Resetting leads table IDs...');
        // TRUNCATE TABLE will remove all data and RESTART IDENTITY resets the serial counter
        await client.query('TRUNCATE TABLE "leads" RESTART IDENTITY CASCADE;');
        console.log('Leads table reset successfully. New entries will start from ID 1.');
    } catch (err) {
        console.error('Failed to reset leads table:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
