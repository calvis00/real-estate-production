import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function reset() {
    const client = await pool.connect();
    try {
        console.log('Resetting properties...');
        await client.query('TRUNCATE TABLE properties CASCADE;');
        console.log('Successfully cleared properties table.');
    } catch (err) {
        console.error('Reset failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

reset();
