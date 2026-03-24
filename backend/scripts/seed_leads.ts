import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const mockLeads = [
    {
        customerName: 'Anand Kumar',
        phone: '98401 23456',
        email: 'anand.k@example.com',
        requirementText: 'Looking for a 3BHK Apartment in OMR, near IT Park. Budget flexible for premium amenities.',
        budgetMin: 8500000,
        budgetMax: 12500000,
        status: 'NEW',
        priority: 'HIGH',
        notes: 'Prefers higher floors. Needs to visit this weekend.'
    },
    {
        customerName: 'Meera Reddy',
        phone: '99887 76655',
        email: 'meera.r@webmail.com',
        requirementText: 'Interested in a residential plot near ECR for investment. 2000-2400 sq.ft preferred.',
        budgetMin: 4000000,
        budgetMax: 6500000,
        status: 'CONTACTED',
        priority: 'MEDIUM',
        notes: 'Follow up on Thursday about legal documentation.'
    },
    {
        customerName: 'Rohan Sharma',
        phone: '91234 56789',
        email: 'rohan.sharma@corp.com',
        requirementText: '2BHK affordable housing near Tambaram. Needs bank loan assistance.',
        budgetMin: 3500000,
        budgetMax: 5500000,
        status: 'IN_PROGRESS',
        priority: 'LOW',
        notes: 'Waiting for salary slips to process loan eligibility.'
    },
    {
        customerName: 'Suresh Raina',
        phone: '88776 65544',
        email: 'suresh.r@ipl.com',
        requirementText: 'Luxury Villa in Perungudi. Minimum 4 bedrooms and private garden.',
        budgetMin: 25000000,
        budgetMax: 45000000,
        status: 'NEW',
        priority: 'HIGH',
        notes: 'Premium client. Wants site visit via video call first.'
    },
    {
        customerName: 'Priya Mani',
        phone: '77665 54433',
        email: 'priya.m@provider.net',
        requirementText: 'Penthouse with sea view in Besant Nagar. Under-construction properties okay.',
        budgetMin: 15000000,
        budgetMax: 30000000,
        status: 'CONTACTED',
        priority: 'MEDIUM',
        notes: 'Interested in project "Oceania Heights".'
    },
    {
        customerName: 'Karthik Raja',
        phone: '66554 43322',
        email: 'karthik.r@techies.in',
        requirementText: 'Compact 1BHK/Studio near DLF Cybercity for rental income.',
        budgetMin: 2500000,
        budgetMax: 4000000,
        status: 'CLOSED',
        priority: 'LOW',
        notes: 'Deal closed. Documents handed over to legal team.'
    },
    {
        customerName: 'Vikram Singh',
        phone: '90001 10009',
        email: 'vikram.s@royal.com',
        requirementText: 'Independent House in Anna Nagar. Must be Vastu compliant and east-facing.',
        budgetMin: 30000000,
        budgetMax: 60000000,
        status: 'NEED_TO_RECALL',
        priority: 'HIGH',
        notes: 'Call disconnected twice. Busy with meetings. Call after 6 PM.'
    },
    {
        customerName: 'Deepa G.',
        phone: '95554 44332',
        email: 'deepa.g@edu.in',
        requirementText: '2BHK Gated Community in Medavakkam. School nearby is a priority.',
        budgetMin: 5000000,
        budgetMax: 7500000,
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        notes: 'Shortlisted "Green Meadows" and "Sun Valley".'
    },
    {
        customerName: 'Rahul Dravid',
        phone: '81112 22333',
        email: 'rahul.d@cricket.org',
        requirementText: 'Farmland near Kanchipuram for weekend getaway. 1-2 acres.',
        budgetMin: 8000000,
        budgetMax: 15000000,
        status: 'CONTACTED',
        priority: 'LOW',
        notes: 'Looking for organic farming potential.'
    },
    {
        customerName: 'Lakshmi Narayan',
        phone: '94441 12233',
        email: 'lakshmi.n@dev.com',
        requirementText: 'Duplex in Adyar with good ventilation. Ready to occupy if possible.',
        budgetMin: 20000000,
        budgetMax: 35000000,
        status: 'NEW',
        priority: 'HIGH',
        notes: 'Urgent requirement. Relocating next month.'
    }
];

async function seed() {
    const client = await pool.connect();
    try {
        console.log('Seeding leads...');
        for (const lead of mockLeads) {
            await client.query(
                `INSERT INTO leads (
                    customer_name, phone, email, requirement_text, 
                    budget_min, budget_max, status, priority, 
                    source, notes, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
                [
                    lead.customerName, lead.phone, lead.email, lead.requirementText,
                    lead.budgetMin, lead.budgetMax, lead.status, lead.priority,
                    'Mock System', lead.notes
                ]
            );
        }
        console.log(`Successfully seeded ${mockLeads.length} leads.`);
    } catch (err) {
        console.error('Seed failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
