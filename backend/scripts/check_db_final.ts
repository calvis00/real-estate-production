import { db } from '../src/db/index.js';
import { properties } from '../src/db/schema.js';

async function checkProperties() {
    try {
        const all = await db.select().from(properties);
        console.log('✅ Found', all.length, 'properties in the database.');
        if (all.length > 0) {
            console.log('Latest Property:', JSON.stringify(all[all.length - 1], null, 2));
        } else {
            console.log('📭 No properties found yet.');
        }
    } catch (error) {
        console.error('❌ Error checking database:', error);
    }
}

checkProperties();
