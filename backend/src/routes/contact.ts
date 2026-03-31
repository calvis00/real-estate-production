import { Router } from 'express';
import { db } from '../db/index.js';
import { contacts } from '../db/schema.js';
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

export default router;
