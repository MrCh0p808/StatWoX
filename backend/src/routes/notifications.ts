import { Router } from "express";
const router = Router();

// Mock notifications for MVP
router.get("/", (req, res) => {
    const notifications = [
        { id: '1', title: 'New Response', message: 'You got a new response on "Customer Satisfaction"', time: '2m ago', read: false, type: 'success' },
        { id: '2', title: 'Weekly Report', message: 'Your weekly summary is ready to view.', time: '1h ago', read: false, type: 'info' },
    ];
    res.json(notifications);
});

export default router;
