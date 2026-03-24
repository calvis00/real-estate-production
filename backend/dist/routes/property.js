import { Router } from 'express';
import { db } from '../db/index.js';
import { properties } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
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
// POST /api/properties (Admin only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const [newProperty] = await db.insert(properties).values(req.body).returning();
        res.status(201).json({ message: 'Property created', data: newProperty });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create property', error });
    }
});
export default router;
//# sourceMappingURL=property.js.map