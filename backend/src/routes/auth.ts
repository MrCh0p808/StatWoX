import { Router } from 'express';
import { register, login } from '../controllers/auth';

const router = Router();

// Route for user registration
// POST /api/auth/register
router.post('/register', register);

// Route for user login
// POST /api/auth/login
router.post('/login', login);

export default router;