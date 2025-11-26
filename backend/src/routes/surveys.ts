// backend/src/routes/surveys.ts
import { Router } from "express";
import { createSurvey, listSurveys, getSurveyById, submitResponse } from "../controllers/surveys.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { getAnalytics } from "../controllers/analytics.js";

const router = Router();

// GET /api/surveys
// Lists all surveys for the logged-in user.
// I use requireAuth here because you need to be logged in to see your own surveys.
router.get("/", requireAuth, listSurveys);

// POST /api/surveys
// Creates a new survey. Also requires login.
router.post("/", requireAuth, createSurvey);

// GET /api/surveys/:id
// This is public! Anyone with the link can view the survey to take it.
router.get("/:id", getSurveyById);

// POST /api/surveys/:id/responses
// This is also public. Anyone can submit a response.
router.post("/:id/responses", submitResponse);

// GET /api/surveys/:id/analytics
// This shows the results. Definitely needs to be protected so random people can't see your data.
router.get("/:id/analytics", getAnalytics);

export default router;
