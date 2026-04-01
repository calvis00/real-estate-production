import { Router } from 'express';
import { db } from '../db/index.js';
import { contacts, leads } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/contacts
router.post('/', async (req, res) => {
  try {
    const [newContact] = await db.insert(contacts).values(req.body).returning();
    console.log('New contact received:', newContact);
    res.status(201).json({ message: 'Contact submitted successfully', data: newContact });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit contact', error });
  }
});

// GET /api/contacts (Admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const data = await db.select().from(contacts);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contacts', error });
  }
});

// Update contact
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body, updatedAt: new Date() };
  try {
    await db.update(contacts).set(updateData).where(eq(contacts.id, Number(id)));
    res.json({ message: 'Contact updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update contact', error });
  }
});

// Delete contact
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete(contacts).where(eq(contacts.id, Number(id)));
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete contact', error });
  }
});

// Convert contact to lead
router.post('/:id/convert', authMiddleware, async (req, res) => {
  const { id } = req.params;
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
    res.status(500).json({ message: 'Failed to convert contact', error });
  }
});

export default router;
