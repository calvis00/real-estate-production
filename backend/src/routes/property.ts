import { Router } from 'express';
import { mockProperties } from '../models/mockData.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/properties
router.get('/', (req, res) => {
  res.json({ message: 'List of properties', data: mockProperties });
});

// GET /api/properties/:id
router.get('/:id', (req, res) => {
  const property = mockProperties.find(p => p.id === req.params.id);
  if (!property) return res.status(404).json({ message: 'Property not found' });
  res.json({ message: 'Property details', data: property });
});

// POST /api/properties (Admin only)
router.post('/', authMiddleware, (req, res) => {
  const newProperty = { 
    id: String(mockProperties.length + 1), 
    ...req.body,
    created_at: new Date().toISOString()
  };
  mockProperties.push(newProperty);
  res.status(201).json({ message: 'Property created', data: newProperty });
});

export default router;
