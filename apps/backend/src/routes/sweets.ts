import { Router } from 'express';

import {
  getAllSweets,
  createSweet,
  searchSweets,
  updateSweet,
  deleteSweet,
  purchaseSweet,
  restockSweet,
} from '../controllers/sweetsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  validateCreateSweet,
  validateUpdateSweet,
  validatePurchase,
  validateRestock,
} from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/sweets - Get all sweets
router.get('/', getAllSweets);

// GET /api/sweets/search - Search sweets
router.get('/search', searchSweets);

// POST /api/sweets - Create new sweet (Admin only)
router.post('/', requireAdmin, validateCreateSweet, createSweet);

// PUT /api/sweets/:id - Update sweet (Admin only)
router.put('/:id', requireAdmin, validateUpdateSweet, updateSweet);

// DELETE /api/sweets/:id - Delete sweet (Admin only)
router.delete('/:id', requireAdmin, deleteSweet);

// POST /api/sweets/:id/purchase - Purchase sweet
router.post('/:id/purchase', validatePurchase, purchaseSweet);

// POST /api/sweets/:id/restock - Restock sweet (Admin only)
router.post('/:id/restock', requireAdmin, validateRestock, restockSweet);

export default router;
