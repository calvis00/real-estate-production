import { Router } from 'express';
import { db } from '../db/index.js';
import { leads } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/leads
router.post('/', async (req, res) => {
  try {
    const [newLead] = await db.insert(leads).values(req.body).returning();
    console.log('New lead received:', newLead);
    res.status(201).json({ message: 'Lead submitted successfully', data: newLead });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit lead', error });
  }
});

// GET /api/leads (Admin only)
router.get('/', authMiddleware, async (req, res) => {
    console.log('GET /api/leads - Auth Passed');
    try {
        const allLeads = await db.select().from(leads);
        console.log(`Returning ${allLeads.length} leads`);
        res.json({ data: allLeads });
    } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leads', error });
  }
});

// Update lead status
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const {
        customerName, phone, email, requirementText, propertyType,
        preferredLocation, budgetMin, budgetMax, status, priority,
        source, assignedTo, nextFollowUpDate, lastContactedAt,
        notes, tags, isConverted, convertedAt
    } = req.body;

    try {
        await db.update(leads)
            .set({
                ...(customerName && { customerName }),
                ...(phone && { phone }),
                ...(email !== undefined && { email }),
                ...(requirementText && { requirementText }),
                ...(propertyType !== undefined && { propertyType }),
                ...(preferredLocation !== undefined && { preferredLocation }),
                ...(budgetMin !== undefined && { budgetMin }),
                ...(budgetMax !== undefined && { budgetMax }),
                ...(status && { status }),
                ...(priority && { priority }),
                ...(source && { source }),
                ...(assignedTo !== undefined && { assignedTo }),
                ...(nextFollowUpDate !== undefined && { nextFollowUpDate }),
                ...(lastContactedAt !== undefined && { lastContactedAt }),
                ...(notes !== undefined && { notes }),
                ...(tags !== undefined && { tags }),
                ...(isConverted !== undefined && { isConverted }),
                ...(convertedAt !== undefined && { convertedAt }),
                updatedAt: new Date()
            })
            .where(eq(leads.id, id));
        res.json({ message: 'Lead updated successfully' });
    } catch (error) {
        console.error('Update failed:', error);
        res.status(500).json({ message: 'Failed to update lead', error });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        await db.delete(leads).where(eq(leads.id, id));
        res.json({ message: 'Lead deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete lead', error });
    }
});

export default router;
