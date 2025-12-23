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

// these routes are open to everyone so they can submit answers
router.post("/:id/responses", submitResponse);
router.get("/:id", getSurvey); // letting anyone view the survey without logging in

// locking down these routes so only logged-in users can manage surveys
router.use(requireAuth);

router.post("/", createSurvey);
router.get("/", listSurveys);
router.put("/:id", updateSurvey);
router.delete("/:id", deleteSurvey);
router.patch("/:id/publish", publishSurvey);
router.get("/:id/analytics", getAnalytics);

export default router;
