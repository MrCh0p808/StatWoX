import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
    createSurvey,
    listSurveys,
    getSurvey,
    updateSurvey,
    deleteSurvey,
    publishSurvey,
    submitResponse,
} from "../controllers/surveys.js";
import { getAnalytics } from "../controllers/analytics.js";

const router = Router();

// Public Routes
router.post("/:id/responses", submitResponse);
router.get("/:id", getSurvey); // Public for viewing

// Protected Routes
router.use(requireAuth);

router.post("/", createSurvey);
router.get("/", listSurveys);
router.put("/:id", updateSurvey);
router.delete("/:id", deleteSurvey);
router.patch("/:id/publish", publishSurvey);
router.get("/:id/analytics", getAnalytics);

export default router;
