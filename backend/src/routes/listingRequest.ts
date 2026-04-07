import { Router } from 'express';
import { db } from '../db/index.js';
import { listingRequests, leads } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware, canEditField, requireRoles } from '../middleware/auth.js';
import { publicSubmissionGuard, requireCsrfToken } from '../middleware/security.js';
import { validateBody } from '../middleware/validate.js';
import { CreateListingRequestSchema, UpdateListingRequestSchema } from '../schemas/crm.js';
import { sanitizeCrmPayload } from '../utils/sanitize.js';

const router = Router();

// POST /api/listing-requests
router.post('/', publicSubmissionGuard, validateBody(CreateListingRequestSchema), async (req, res) => {
  try {
    const sanitizedBody = sanitizeCrmPayload(req.body ?? {});
    const [newRequest] = await db.insert(listingRequests).values(sanitizedBody as any).returning();
    res.status(201).json({ message: 'Request submitted successfully', data: newRequest });
  } catch (error) {
    console.error('Failed to submit listing request:', error);
    res.status(500).json({ message: 'Failed to submit request' });
  }
});

// GET /api/listing-requests (Admin only)
router.get('/', authMiddleware, requireRoles(['ADMIN', 'SALES', 'VIEWER']), async (req, res) => {
  try {
    const data = await db.select().from(listingRequests);
    res.json({ data });
  } catch (error) {
    console.error('Failed to fetch listing requests:', error);
    res.status(500).json({ message: 'Failed to fetch listing requests' });
  }
});

// Update listing request
router.put('/:id', authMiddleware, requireRoles(['ADMIN', 'SALES']), requireCsrfToken, validateBody(UpdateListingRequestSchema), async (req: any, res) => {
  const { id } = req.params;
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'Invalid request id' });
  }
  const sanitizedBody = sanitizeCrmPayload(req.body ?? {}) as any;
  const role = String(req.user?.role || '').toUpperCase();
  const filteredBody =
    role === 'ADMIN'
      ? sanitizedBody
      : Object.fromEntries(Object.entries(sanitizedBody).filter(([field]) => canEditField(role, field)));
  const updateData = { ...(filteredBody as any), updatedAt: new Date() };
  try {
    await db.update(listingRequests).set(updateData).where(eq(listingRequests.id, Number(id)));
    res.json({ message: 'Request updated successfully' });
  } catch (error) {
    console.error('Failed to update listing request:', error);
    res.status(500).json({ message: 'Failed to update request' });
  }
});

// Delete listing request
router.delete('/:id', authMiddleware, requireRoles(['ADMIN', 'SALES']), requireCsrfToken, async (req, res) => {
  const { id } = req.params;
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'Invalid request id' });
  }
  try {
    await db.delete(listingRequests).where(eq(listingRequests.id, Number(id)));
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Failed to delete listing request:', error);
    res.status(500).json({ message: 'Failed to delete request' });
  }
});

// Convert listing request to lead
router.post('/:id/convert', authMiddleware, requireRoles(['ADMIN', 'SALES']), requireCsrfToken, async (req, res) => {
  const { id } = req.params;
  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'Invalid request id' });
  }
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
    res.status(500).json({ message: 'Failed to convert request' });
  }
});

export default router;
