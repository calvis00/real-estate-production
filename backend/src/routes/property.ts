import { Router } from 'express';
import { db } from '../db/index.js';
import { properties } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { CreatePropertySchema, UpdatePropertySchema } from '../schemas/property.js';

const router = Router();

// GET /api/properties
router.get('/', async (req, res) => {
  try {
    const data = await db.select().from(properties);
    res.json({ message: 'List of properties', data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch properties', error });
  }
});

// GET /api/properties/:id
router.get('/:id', async (req, res) => {
  try {
    const [property] = await db.select().from(properties).where(eq(properties.id, req.params.id));
    if (!property) return res.status(404).json({ message: 'Property not found' });
    res.json({ message: 'Property details', data: property });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching property detail', error });
  }
});

/**
 * POST /api/properties
 * Creates a new property with multiple images and videos.
 */
router.post('/', authMiddleware, upload.array('assets', 15), async (req: any, res) => {
  try {
    // 1. Validate Text Data
    console.log('--- Property Creation Debug ---');
    console.log('Body:', req.body);
    const validatedData = CreatePropertySchema.parse(req.body);

    // 2. Extract Assets from Cloudinary
    const files = req.files as any[];
    const images: string[] = [];
    const videos: string[] = [];

    if (files && files.length > 0) {
        files.forEach((file) => {
            if (file.mimetype.startsWith('video/')) {
                videos.push(file.path);
            } else {
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
  } catch (error: any) {
    console.error('Property Creation Error:', error);
    if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Validation failed', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to create property', error: error.message });
  }
});

// PUT /api/properties/:id
router.put('/:id', authMiddleware, upload.array('assets', 15), async (req: any, res) => {
    try {
        const { id } = req.params;
        const [existing] = await db.select().from(properties).where(eq(properties.id, id));
        if (!existing) return res.status(404).json({ message: 'Property not found' });

        // 1. Validate and Coerce Data
        const validatedData = UpdatePropertySchema.parse(req.body);

        // 2. Extract assets
        const files = req.files as any[];
        const images: string[] = [...existing.images];
        const videos: string[] = [...existing.videos];

        if (files && files.length > 0) {
            files.forEach((file) => {
                if (file.mimetype.startsWith('video/')) {
                    videos.push(file.path);
                } else {
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
    } catch (error: any) {
        console.error('Update Error:', error);
        if (error.name === 'ZodError') {
            return res.status(400).json({ message: 'Validation failed', errors: error.errors });
        }
        res.status(500).json({ message: 'Update failed', error: error.message });
    }
});

// PATCH /api/properties/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['ACTIVE', 'HIDDEN', 'ARCHIVED', 'SOLD'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const [updated] = await db.update(properties)
            .set({ status, updatedAt: new Date() })
            .where(eq(properties.id, id))
            .returning();

        res.json({ message: `Property status updated to ${status}`, data: updated });
    } catch (error: any) {
        res.status(500).json({ message: 'Status update failed', error: error.message });
    }
});

// DELETE /api/properties/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const [deleted] = await db.delete(properties).where(eq(properties.id, id)).returning();
        if (!deleted) return res.status(404).json({ message: 'Property not found' });
        res.json({ message: 'Property deleted permanently', data: deleted });
    } catch (error: any) {
        res.status(500).json({ message: 'Deletion failed', error: error.message });
    }
});

export default router;
