import { Router } from 'express';

import { register, login } from '../controllers/authController';
import { validateRegister, validateLogin } from '../middleware/validation';

const router = Router();

// POST /api/auth/register - Register new user
router.post('/register', validateRegister, register);

// POST /api/auth/login - Login user
router.post('/login', validateLogin, login);

export default router;
