import { db } from '../src/db/index.js';
import { leads, contacts, listingRequests } from '../src/db/schema.js';

async function countAll() {
    try {
        const l = await db.select().from(leads);
        const c = await db.select().from(contacts);
        const r = await db.select().from(listingRequests);
        
        console.log('--- Database Counts ---');
        console.log('Leads:', l.length);
        console.log('Contacts:', c.length);
        console.log('Listing Requests:', r.length);
        console.log('Total Aggregate:', l.length + c.length + r.length);
    } catch (error) {
        console.error('❌ Error counting records:', error);
    }
}

countAll();
