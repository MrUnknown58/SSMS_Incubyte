import { Router, Request, Response } from 'express';

import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Test route for authentication - no database needed
router.get('/auth-test', authenticateToken, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Authentication successful',
    user: req.user,
  });
});

// Test route for admin authorization - no database needed
router.post('/admin-test', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Admin access granted',
    user: req.user,
  });
});

// Test route for user access (both user and admin can access)
router.get('/user-test', authenticateToken, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'User access granted',
    user: req.user,
  });
});

export default router;
