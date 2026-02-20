import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, getUserFromToken, hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripHtml } from '@/lib/sanitize';
import type { SurveyFilter, QuestionInput, SurveyStatus } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = await getUserFromToken(token);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50'))); // Cap at 100
        const skip = (page - 1) * limit;

        const where: SurveyFilter & { authorId?: string; isPublic?: boolean; status?: SurveyStatus } = {};

        if (filter === 'mine') {
            where.authorId = user.id;
        } else if (filter === 'public') {
            where.isPublic = true;
            where.status = 'published';
        } else {
            where.authorId = user.id;
        }

        const [surveys, totalItems] = await db.$transaction([
            db.survey.findMany({
                where,
                include: {
                    author: {
                        select: { id: true, name: true, username: true, image: true }
                    },
                    _count: {
                        select: { questions: true, responses: true, comments: true }
                    }
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit
            }),
            db.survey.count({ where })
        ]);

        const formattedSurveys = surveys.map((survey) => ({
            ...survey,
            questionCount: survey._count.questions,
            responseCount: survey._count.responses,
            commentCount: survey._count.comments
        }));

        return NextResponse.json({
            success: true,
            data: {
                surveys: formattedSurveys,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages: Math.ceil(totalItems / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get surveys error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const user = await getUserFromToken(token);
        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            title,
            description,
            category = 'survey',
            questions = [],
            isPublic = true,
            shareType = 'public',
            allowAnon = true,
            mediaType,
            mediaUrl,
            caption,
            maxResponses,
            closesAt,
            thankYouMessage,
            redirectUrl,
            showProgress = true,
            showQuestionNumbers = true,
            shuffleQuestions = false,
            password
        } = body;

        if (!title || title.trim().length === 0) {
            return NextResponse.json(
                { success: false, message: 'Title is required' },
                { status: 400 }
            );
        }

        // A3: Sanitize user inputs (SEC-004)
        const cleanTitle = stripHtml(title.trim());
        const cleanDescription = description ? stripHtml(description.trim()) : null;

        // A4: Options payload size validation (PERF-001)
        for (const q of questions) {
            if (q.options && JSON.stringify(q.options).length > 10240) {
                return NextResponse.json(
                    { success: false, message: 'Question options exceed 10KB limit' },
                    { status: 400 }
                );
            }
        }

        const survey = await db.survey.create({
            data: {
                title: cleanTitle,
                description: cleanDescription,
                category,
                status: 'draft',
                isPublic,
                shareType,
                allowAnon,
                mediaType: mediaType || null,
                mediaUrl: mediaUrl || null,
                caption: caption?.trim() || null,
                maxResponses: maxResponses || null,
                closesAt: closesAt ? new Date(closesAt) : null,
                thankYouMessage: thankYouMessage?.trim() || null,
                redirectUrl: redirectUrl?.trim() || null,
                showProgress,
                shuffleQuestions,
                password: password ? await hashPassword(password) : null,
                authorId: user.id,
                questions: {
                    create: questions.map((q: QuestionInput, index: number) => ({
                        title: q.title?.trim() || 'Untitled Question',
                        description: q.description?.trim() || null,
                        type: q.type || 'shortText',
                        options: q.options ? q.options : null,
                        required: q.required ?? false,
                        order: index,
                        page: q.page || 1,
                        placeholder: q.placeholder?.trim() || null,
                        validation: q.validation || null,
                        min: q.min || null,
                        max: q.max || null
                    }))
                }
            },
            include: {
                questions: { orderBy: { order: 'asc' } },
                author: { select: { id: true, name: true, username: true, image: true } }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Survey created successfully',
            data: { survey }
        });

    } catch (error) {
        console.error('Create survey error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
