import { Router } from 'express';

const router = Router();

// POST /api/leads
router.post('/', (req, res) => {
  console.log('New lead received:', req.body);
  res.status(201).json({ message: 'Lead submitted successfully', status: 'new' });
});

// GET /api/leads (Admin only)
router.get('/', (req, res) => {
  res.json({ message: 'List of leads', data: [] });
});

export default router;
