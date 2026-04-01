import { Router } from 'express';
import { db } from '../db/index.js';
import { listingRequests, leads } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/listing-requests
router.post('/', async (req, res) => {
  try {
    const [newRequest] = await db.insert(listingRequests).values(req.body).returning();
    console.log('New listing request received:', newRequest);
    res.status(201).json({ message: 'Request submitted successfully', data: newRequest });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit request', error });
  }
});

// GET /api/listing-requests (Admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const data = await db.select().from(listingRequests);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch listing requests', error });
  }
});

// Update listing request
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body, updatedAt: new Date() };
  try {
    await db.update(listingRequests).set(updateData).where(eq(listingRequests.id, Number(id)));
    res.json({ message: 'Request updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update request', error });
  }
});

// Delete listing request
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await db.delete(listingRequests).where(eq(listingRequests.id, Number(id)));
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete request', error });
  }
});

// Convert listing request to lead
router.post('/:id/convert', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const request = await db.select().from(listingRequests).where(eq(listingRequests.id, Number(id))).limit(1);
    
    if (!request.length) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const requestData = request[0];
    if (!requestData) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Use transaction to ensure both happen
    await db.transaction(async (tx) => {
      // Insert into leads
      await tx.insert(leads).values({
        customerName: requestData.customerName,
        phone: requestData.phone,
        email: requestData.email,
        requirementText: requestData.requirementText,
        propertyType: requestData.propertyType,
        source: requestData.source || 'CONVERTED_LISTING_REQUEST',
        notes: requestData.notes,
        status: 'NEW',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Delete from listing_requests
      await tx.delete(listingRequests).where(eq(listingRequests.id, Number(id)));
    });

    res.json({ message: 'Listing request converted to lead successfully' });
  } catch (error) {
    console.error('Conversion failed:', error);
    res.status(500).json({ message: 'Failed to convert request', error });
  }
});

export default router;
