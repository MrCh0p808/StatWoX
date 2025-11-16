import { Router } from 'express';
import { getUserSurveys } from '../controllers/surveys';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Route to get all surveys for the authenticated user
// GET /api/surveys
router.get('/', authMiddleware, getUserSurveys);

export default router;