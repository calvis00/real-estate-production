import { Router } from 'express';
import { db } from '../db/index.js';
import { leads } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { requireCsrfToken } from '../middleware/security.js';
import { validateBody } from '../middleware/validate.js';
import { CreateLeadSchema, UpdateLeadSchema } from '../schemas/crm.js';
import { sanitizeCrmPayload } from '../utils/sanitize.js';
const router = Router();
// POST /api/leads
router.post('/', validateBody(CreateLeadSchema), async (req, res) => {
    try {
        const sanitizedBody = sanitizeCrmPayload(req.body ?? {});
        const [newLead] = await db.insert(leads).values(sanitizedBody).returning();
        console.log('New lead received:', newLead);
        res.status(201).json({ message: 'Lead submitted successfully', data: newLead });
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch leads', error });
    }
});
// Update lead status
router.put('/:id', authMiddleware, requireCsrfToken, validateBody(UpdateLeadSchema), async (req, res) => {
    const { id } = req.params;
    const leadId = Number(id);
    if (!Number.isInteger(leadId)) {
        return res.status(400).json({ message: 'Invalid lead id' });
    }
    const sanitizedBody = sanitizeCrmPayload(req.body ?? {});
    const { customerName, phone, email, requirementText, propertyType, preferredLocation, budgetMin, budgetMax, status, priority, source, assignedTo, nextFollowUpDate, lastContactedAt, notes, tags, isConverted, convertedAt } = sanitizedBody;
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
            .where(eq(leads.id, leadId));
        res.json({ message: 'Lead updated successfully' });
    }
    catch (error) {
        console.error('Update failed:', error);
        res.status(500).json({ message: 'Failed to update lead', error });
    }
});
router.delete('/:id', authMiddleware, requireCsrfToken, async (req, res) => {
    const { id } = req.params;
    const leadId = Number(id);
    if (!Number.isInteger(leadId)) {
        return res.status(400).json({ message: 'Invalid lead id' });
    }
    try {
        await db.delete(leads).where(eq(leads.id, leadId));
        res.json({ message: 'Lead deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete lead', error });
    }
});
export default router;
//# sourceMappingURL=lead.js.map