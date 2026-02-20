import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tab = searchParams.get('tab') || 'featured';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {
            status: 'published',
            isPublic: true
        };

        let orderBy: Record<string, string> | Record<string, string>[] = { publishedAt: 'desc' };

        switch (tab) {
            case 'trending':
                orderBy = [
                    { responseCount: 'desc' },
                    { viewCount: 'desc' },
                    { publishedAt: 'desc' }
                ];
                break;
            case 'quickPolls':
                where.category = 'poll';
                break;
            case 'featured':
            default:
                where.responseCount = { gte: 5 };
                orderBy = { responseCount: 'desc' };
        }

        where.OR = [
            { closesAt: null },
            { closesAt: { gt: new Date() } }
        ];

        const surveys = await db.survey.findMany({
            where,
            include: {
                author: {
                    select: { id: true, name: true, username: true, image: true }
                },
                _count: {
                    select: { questions: true, responses: true, comments: true }
                }
            },
            orderBy,
            skip,
            take: limit
        });

        const formattedSurveys = surveys.map(survey => ({
            ...survey,
            questionCount: survey._count.questions,
            responseCount: survey._count.responses,
            commentCount: survey._count.comments
        }));

        const total = await db.survey.count({ where });

        return NextResponse.json({
            success: true,
            data: {
                surveys: formattedSurveys,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Feed error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
