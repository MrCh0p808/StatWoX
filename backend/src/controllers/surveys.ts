import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Controller to get all surveys for the authenticated user
export const getUserSurveys = async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }

    try {
        const surveys = await prisma.survey.findMany({
            where: {
                authorId: userId,
            },
            include: {
                // Example of including related data, adjust as needed
                // _count: {
                //     select: { responses: true }
                // }
            }
        });

        // The frontend expects a 'responses' count, but our schema doesn't have it yet.
        // We'll map the data to include a mock count for now.
        const surveysWithResponseCount = surveys.map(s => ({
            ...s,
            responses: 0, // Replace with actual count later
        }));

        res.status(200).json(surveysWithResponseCount);

    } catch (error) {
        console.error('Error fetching surveys:', error);
        res.status(500).json({ message: 'Something went wrong on the server' });
    }
};
