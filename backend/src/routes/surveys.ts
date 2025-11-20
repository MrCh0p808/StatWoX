// backend/src/routes/surveys.ts
import { Router } from "express";
import { createSurvey, listSurveys, getSurveyById, submitResponse } from "../controllers/surveys.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { getAnalytics } from "../controllers/analytics.js";

const router = Router();

router.get("/", requireAuth, listSurveys);            // GET /api/surveys
router.post("/", requireAuth, createSurvey);          // POST /api/surveys
router.get("/:id", getSurveyById);                    // GET /api/surveys/:id (public)
router.post("/:id/responses", submitResponse);        // POST /api/surveys/:id/responses
router.get("/:id/analytics", getAnalytics);           // GET /api/surveys/:id/analytics

export default router;
