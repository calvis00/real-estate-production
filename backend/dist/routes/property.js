import { Router } from 'express';
import { db } from '../db/index.js';
import { properties } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { attachOptionalAdmin, authMiddleware, requireRoles } from '../middleware/auth.js';
import { requireCsrfToken } from '../middleware/security.js';
import { upload } from '../middleware/upload.js';
import { CreatePropertySchema, UpdatePropertySchema } from '../schemas/property.js';
import { sanitizePropertyPayload, sanitizePlainText } from '../utils/sanitize.js';
const router = Router();
// GET /api/properties
router.get('/', attachOptionalAdmin, async (req, res) => {
    try {
        const data = req.user
            ? await db.select().from(properties)
            : await db.select().from(properties).where(eq(properties.status, 'ACTIVE'));
        res.json({ message: 'List of properties', data });
    }
    catch (error) {
        console.error('Failed to fetch properties:', error);
        res.status(500).json({ message: 'Failed to fetch properties' });
    }
});
// GET /api/properties/:id
router.get('/:id', attachOptionalAdmin, async (req, res) => {
    try {
        const propertyId = sanitizePlainText(req.params.id);
        if (!propertyId) {
            return res.status(400).json({ message: 'Invalid property id' });
        }
        const [property] = await db.select().from(properties).where(eq(properties.id, propertyId));
        if (!property)
            return res.status(404).json({ message: 'Property not found' });
        if (!req.user && property.status !== 'ACTIVE') {
            return res.status(404).json({ message: 'Property not found' });
        }
        res.json({ message: 'Property details', data: property });
    }
    catch (error) {
        console.error('Error fetching property detail:', error);
        res.status(500).json({ message: 'Error fetching property detail' });
    }
});
/**
 * POST /api/properties
 * Creates a new property with multiple images and videos.
 */
router.post('/', authMiddleware, requireRoles(['ADMIN', 'SALES']), requireCsrfToken, upload.array('assets', 15), async (req, res) => {
    try {
        const sanitizedBody = sanitizePropertyPayload(req.body ?? {});
        const validatedData = CreatePropertySchema.parse(sanitizedBody);
        // 2. Extract Assets from Cloudinary
        const files = req.files;
        const images = [];
        const videos = [];
        if (files && files.length > 0) {
            files.forEach((file) => {
                if (file.mimetype.startsWith('video/')) {
                    videos.push(file.path);
                }
                else {
                    images.push(file.path);
                }
            });
        }
        // 3. Save to Database
        const [newProperty] = await db.insert(properties).values({
            ...validatedData,
            images,
            videos,
        }).returning();
        res.status(201).json({
            message: 'Property created successfully',
            data: newProperty
        });
    }
    catch (error) {
        console.error('Property Creation Error:', error);
        if (error.name === 'ZodError') {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        res.status(500).json({ message: 'Failed to create property' });
    }
});
// PUT /api/properties/:id
router.put('/:id', authMiddleware, requireRoles(['ADMIN', 'SALES']), requireCsrfToken, upload.array('assets', 15), async (req, res) => {
    try {
        const id = sanitizePlainText(req.params.id);
        const [existing] = await db.select().from(properties).where(eq(properties.id, id));
        if (!existing)
            return res.status(404).json({ message: 'Property not found' });
        // 1. Validate and Coerce Data
        const sanitizedBody = sanitizePropertyPayload(req.body ?? {});
        const validatedData = UpdatePropertySchema.parse(sanitizedBody);
        // 2. Extract assets
        const files = req.files;
        const images = [...existing.images];
        const videos = [...existing.videos];
        if (files && files.length > 0) {
            files.forEach((file) => {
                if (file.mimetype.startsWith('video/')) {
                    videos.push(file.path);
                }
                else {
                    images.push(file.path);
                }
            });
        }
        // 3. Update with merged data
        const updateData = {
            ...validatedData,
            images,
            videos,
            updatedAt: new Date(),
        };
        const [updatedProperty] = await db.update(properties)
            .set(updateData)
            .where(eq(properties.id, id))
            .returning();
        res.json({ message: 'Property updated successfully', data: updatedProperty });
    }
    catch (error) {
        console.error('Update Error:', error);
        if (error.name === 'ZodError') {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        res.status(500).json({ message: 'Update failed' });
    }
});
// PATCH /api/properties/:id/status
router.patch('/:id/status', authMiddleware, requireRoles(['ADMIN', 'SALES']), requireCsrfToken, async (req, res) => {
    try {
        const id = sanitizePlainText(req.params.id);
        const status = sanitizePlainText(req.body?.status);
        if (typeof status !== 'string') {
            return res.status(400).json({ message: 'Invalid status' });
        }
        if (!['ACTIVE', 'HIDDEN', 'ARCHIVED', 'SOLD'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const [updated] = await db.update(properties)
            .set({ status: status, updatedAt: new Date() })
            .where(eq(properties.id, id))
            .returning();
        res.json({ message: `Property status updated to ${status}`, data: updated });
    }
    catch (error) {
        console.error('Status update failed:', error);
        res.status(500).json({ message: 'Status update failed' });
    }
});
// DELETE /api/properties/:id
router.delete('/:id', authMiddleware, requireRoles(['ADMIN', 'SALES']), requireCsrfToken, async (req, res) => {
    try {
        const id = sanitizePlainText(req.params.id);
        const [deleted] = await db.delete(properties).where(eq(properties.id, id)).returning();
        if (!deleted)
            return res.status(404).json({ message: 'Property not found' });
        res.json({ message: 'Property deleted permanently', data: deleted });
    }
    catch (error) {
        console.error('Deletion failed:', error);
        res.status(500).json({ message: 'Deletion failed' });
    }
});
export default router;
//# sourceMappingURL=property.js.map