import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function verify() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'properties'
            ORDER BY ordinal_position;
        `);
        console.log('--- DATABASE COLUMNS for "properties" ---');
        res.rows.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type}`);
        });
        console.log('-----------------------------------------');
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await pool.end();
    }
}

verify();
