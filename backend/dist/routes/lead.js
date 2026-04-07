import { Router } from 'express';
import { db } from '../db/index.js';
import { leads } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware, canEditField, requireRoles } from '../middleware/auth.js';
import { publicSubmissionGuard, requireCsrfToken } from '../middleware/security.js';
import { validateBody } from '../middleware/validate.js';
import { CreateLeadSchema, UpdateLeadSchema } from '../schemas/crm.js';
import { sanitizeCrmPayload } from '../utils/sanitize.js';
const router = Router();
// POST /api/leads
router.post('/', publicSubmissionGuard, validateBody(CreateLeadSchema), async (req, res) => {
    try {
        const sanitizedBody = sanitizeCrmPayload(req.body ?? {});
        const [newLead] = await db.insert(leads).values(sanitizedBody).returning();
        res.status(201).json({ message: 'Lead submitted successfully', data: newLead });
    }
    catch (error) {
        console.error('Failed to submit lead:', error);
        res.status(500).json({ message: 'Failed to submit lead' });
    }
});
// GET /api/leads (Admin only)
router.get('/', authMiddleware, requireRoles(['ADMIN', 'SALES', 'VIEWER']), async (req, res) => {
    try {
        const allLeads = await db.select().from(leads);
        res.json({ data: allLeads });
    }
    catch (error) {
        console.error('Failed to fetch leads:', error);
        res.status(500).json({ message: 'Failed to fetch leads' });
    }
});
// Update lead status
router.put('/:id', authMiddleware, requireRoles(['ADMIN', 'SALES']), requireCsrfToken, validateBody(UpdateLeadSchema), async (req, res) => {
    const { id } = req.params;
    const leadId = Number(id);
    if (!Number.isInteger(leadId)) {
        return res.status(400).json({ message: 'Invalid lead id' });
    }
    const sanitizedBody = sanitizeCrmPayload(req.body ?? {});
    const role = String(req.user?.role || '').toUpperCase();
    const filteredBody = role === 'ADMIN'
        ? sanitizedBody
        : Object.fromEntries(Object.entries(sanitizedBody).filter(([field]) => canEditField(role, field)));
    const { customerName, phone, email, requirementText, propertyType, preferredLocation, budgetMin, budgetMax, status, priority, source, assignedTo, nextFollowUpDate, lastContactedAt, notes, tags, isConverted, convertedAt } = filteredBody;
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
        res.status(500).json({ message: 'Failed to update lead' });
    }
});
router.delete('/:id', authMiddleware, requireRoles(['ADMIN', 'SALES']), requireCsrfToken, async (req, res) => {
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
        console.error('Failed to delete lead:', error);
        res.status(500).json({ message: 'Failed to delete lead' });
    }
});
export default router;
//# sourceMappingURL=lead.js.map