import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getNotifications = async (req: any, res: Response) => {
    try {
        const userId = req.userId;

        // 1. find my surveys
        const surveys = await prisma.survey.findMany({
            where: { authorId: userId },
            select: { id: true, title: true }
        });

        const surveyIds = surveys.map(s => s.id);

        if (surveyIds.length === 0) {
            return res.json([]);
        }

        // 2. find recent responses
        // basically "new response" alerts
        const recentResponses = await prisma.surveyResponse.findMany({
            where: { surveyId: { in: surveyIds } },
            orderBy: { submittedAt: 'desc' },
            take: 10,
            include: { survey: { select: { title: true } } }
        });

        // 3. map to notification format
        const notifications = recentResponses.map(r => ({
            id: r.id,
            title: 'New Response',
            message: `New response received for "${r.survey.title}"`,
            time: new Date(r.submittedAt).toLocaleString(), // simple format
            read: false, // todo: track read status in db
            type: 'success'
        }));

        res.json(notifications);
    } catch (error) {
        console.error("getNotifications error:", error);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
};
