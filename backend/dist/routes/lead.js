import { Router } from 'express';
import { db } from '../db/index.js';
import { leads } from '../db/schema.js';
const router = Router();
// POST /api/leads
router.post('/', async (req, res) => {
    try {
        const [newLead] = await db.insert(leads).values(req.body).returning();
        console.log('New lead received:', newLead);
        res.status(201).json({ message: 'Lead submitted successfully', data: newLead });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to submit lead', error });
    }
});
// GET /api/leads (Admin only)
router.get('/', async (req, res) => {
    try {
        const data = await db.select().from(leads);
        res.json({ message: 'List of leads', data });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch leads', error });
    }
});
export default router;
//# sourceMappingURL=lead.js.map