import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function verify() {
    const client = await pool.connect();
    try {
        const seqRes = await client.query("SELECT last_value, is_called FROM leads_id_seq");
        console.log('Sequence Status:', seqRes.rows[0]);
        
        const insertRes = await client.query(
            "INSERT INTO leads (customer_name, phone, requirement_text) VALUES ($1, $2, $3) RETURNING id",
            ['Verification Lead', '0000000000', 'Verifying ID sequence']
        );
        console.log('Inserted Lead ID:', insertRes.rows[0].id);
        
        if (insertRes.rows[0].id === 1) {
            console.log('SUCCESS: ID is 1 as expected.');
        } else {
            console.log('FAILURE: ID is', insertRes.rows[0].id);
        }
    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}
verify();
