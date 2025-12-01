import { Router } from "express";
import { getNotifications } from "../controllers/notifications.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/", getNotifications);

export default router;
