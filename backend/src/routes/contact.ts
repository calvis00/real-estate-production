import { Router } from 'express';
import { db } from '../db/index.js';
import { contacts, leads } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware, canEditField, requireRoles } from '../middleware/auth.js';
import { publicSubmissionGuard, requireCsrfToken } from '../middleware/security.js';
import { validateBody } from '../middleware/validate.js';
import { CreateContactSchema, UpdateContactSchema } from '../schemas/crm.js';
import { sanitizeCrmPayload } from '../utils/sanitize.js';

const router = Router();

// POST /api/contacts
router.post('/', publicSubmissionGuard, validateBody(CreateContactSchema), async (req, res) => {
  try {
    const sanitizedBody = sanitizeCrmPayload(req.body ?? {});
    const [newContact] = await db.insert(contacts).values(sanitizedBody as any).returning();
    res.status(201).json({ message: 'Contact submitted successfully', data: newContact });
  } catch (error) {
    console.error('Failed to submit contact:', error);
    res.status(500).json({ message: 'Failed to submit contact' });
  }
});

// GET /api/contacts (Admin only)
router.get('/', authMiddleware, requireRoles(['ADMIN', 'SALES', 'VIEWER']), async (req, res) => {
  try {
    const data = await db.select().from(contacts);
    res.json({ data });
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
});

// Update contact
router.put('/:id', authMiddleware, requireRoles(['ADMIN', 'SALES']), requireCsrfToken, validateBody(UpdateContactSchema), async (req: any, res) => {
  const { id } = req.params;
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'Invalid contact id' });
  }
  const sanitizedBody = sanitizeCrmPayload(req.body ?? {}) as any;
  const role = String(req.user?.role || '').toUpperCase();
  const filteredBody =
    role === 'ADMIN'
      ? sanitizedBody
      : Object.fromEntries(Object.entries(sanitizedBody).filter(([field]) => canEditField(role, field)));
  const updateData = { ...(filteredBody as any), updatedAt: new Date() };
  try {
    await db.update(contacts).set(updateData).where(eq(contacts.id, Number(id)));
    res.json({ message: 'Contact updated successfully' });
  } catch (error) {
    console.error('Failed to update contact:', error);
    res.status(500).json({ message: 'Failed to update contact' });
  }
});

// Delete contact
router.delete('/:id', authMiddleware, requireRoles(['ADMIN', 'SALES']), requireCsrfToken, async (req, res) => {
  const { id } = req.params;
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'Invalid contact id' });
  }
  try {
    await db.delete(contacts).where(eq(contacts.id, Number(id)));
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Failed to delete contact:', error);
    res.status(500).json({ message: 'Failed to delete contact' });
  }
});

// Convert contact to lead
router.post('/:id/convert', authMiddleware, requireRoles(['ADMIN', 'SALES']), requireCsrfToken, async (req, res) => {
  const { id } = req.params;
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'Invalid contact id' });
  }
  try {
    const contact = await db.select().from(contacts).where(eq(contacts.id, Number(id))).limit(1);
    
    if (!contact.length) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    const contactData = contact[0];
    if (!contactData) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    
    // Use transaction to ensure both happen
    await db.transaction(async (tx) => {
      // Insert into leads
      await tx.insert(leads).values({
        customerName: contactData.customerName,
        phone: contactData.phone,
        email: contactData.email,
        requirementText: contactData.requirementText,
        propertyType: contactData.propertyType,
        source: contactData.source || 'CONVERTED_CONTACT',
        notes: contactData.notes,
        status: 'NEW',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Delete from contacts
      await tx.delete(contacts).where(eq(contacts.id, Number(id)));
    });

    res.json({ message: 'Contact converted to lead successfully' });
  } catch (error) {
    console.error('Conversion failed:', error);
    res.status(500).json({ message: 'Failed to convert contact' });
  }
});

export default router;
