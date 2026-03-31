import { Router } from 'express';
import { db } from '../db/index.js';
import { properties } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { CreatePropertySchema } from '../schemas/property.js';
const router = Router();
// GET /api/properties
router.get('/', async (req, res) => {
    try {
        const data = await db.select().from(properties);
        res.json({ message: 'List of properties', data });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch properties', error });
    }
});
// GET /api/properties/:id
router.get('/:id', async (req, res) => {
    try {
        const [property] = await db.select().from(properties).where(eq(properties.id, req.params.id));
        if (!property)
            return res.status(404).json({ message: 'Property not found' });
        res.json({ message: 'Property details', data: property });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching property detail', error });
    }
});
/**
 * POST /api/properties
 * Creates a new property with multiple images and videos.
 */
router.post('/', authMiddleware, upload.array('assets', 15), async (req, res) => {
    try {
        // 1. Validate Text Data
        const validatedData = CreatePropertySchema.parse(req.body);
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
        res.status(500).json({ message: 'Failed to create property', error: error.message });
    }
});
export default router;
//# sourceMappingURL=property.js.map