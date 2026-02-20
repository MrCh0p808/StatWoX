import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        const survey = await db.survey.findUnique({
            where: { id },
            include: {
                questions: { orderBy: { order: 'asc' } },
                responses: {
                    include: { answers: true },
                    orderBy: { startedAt: 'desc' },
                    take: 1000
                }
            }
        });

        if (!survey) {
            return NextResponse.json(
                { success: false, message: 'Survey not found' },
                { status: 404 }
            );
        }

        if (survey.authorId !== user.id) {
            return NextResponse.json(
                { success: false, message: 'Not authorized' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const responsesTimeline: Record<string, number> = {};
        survey.responses
            .filter(r => new Date(r.startedAt) >= startDate)
            .forEach(r => {
                const date = new Date(r.startedAt).toISOString().split('T')[0];
                responsesTimeline[date] = (responsesTimeline[date] || 0) + 1;
            });

        const questionAnalytics = survey.questions.map(question => {
            const questionAnswers = survey.responses
                .flatMap(r => r.answers)
                .filter(a => a.questionId === question.id);

            const analytics: Record<string, unknown> = {
                questionId: question.id,
                questionTitle: question.title,
                questionType: question.type,
                totalResponses: questionAnswers.length
            };

            if (question.type === 'multipleChoice' && question.options) {
                const options = (typeof question.options === 'string' ? JSON.parse(question.options) : question.options) as string[];
                const optionCounts: Record<string, number> = {};
                options.forEach(opt => optionCounts[opt] = 0);
                questionAnswers.forEach(a => {
                    const value = a.value;
                    if (optionCounts[value] !== undefined) {
                        optionCounts[value]++;
                    }
                });
                analytics.optionCounts = optionCounts;
                analytics.options = options;
            }

            if (question.type === 'rating') {
                const ratings = questionAnswers.map(a => parseFloat(a.value)).filter(r => !isNaN(r));
                if (ratings.length > 0) {
                    analytics.average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
                    analytics.min = Math.min(...ratings);
                    analytics.max = Math.max(...ratings);
                    const distribution: Record<string, number> = {};
                    ratings.forEach(r => {
                        const key = Math.round(r).toString();
                        distribution[key] = (distribution[key] || 0) + 1;
                    });
                    analytics.distribution = distribution;
                }
            }

            if (question.type === 'yesNo') {
                const yesCount = questionAnswers.filter(a => a.value.toLowerCase() === 'true' || a.value.toLowerCase() === 'yes').length;
                analytics.yesCount = yesCount;
                analytics.noCount = questionAnswers.length - yesCount;
                analytics.yesPercentage = questionAnswers.length > 0 ? (yesCount / questionAnswers.length) * 100 : 0;
            }

            if (['shortText', 'longText', 'email', 'phoneNumber'].includes(question.type)) {
                analytics.responses = questionAnswers.slice(0, 10).map(a => a.value);
                analytics.uniqueResponses = new Set(questionAnswers.map(a => a.value)).size;
            }

            if (question.type === 'date') {
                const dates = questionAnswers.map(a => a.value).filter(d => d);
                if (dates.length > 0) {
                    dates.sort();
                    analytics.dateRange = {
                        earliest: dates[0],
                        latest: dates[dates.length - 1]
                    };
                }
            }

            return analytics;
        });

        const completedResponses = survey.responses.filter(r => r.isComplete).length;
        const partialResponses = survey.responses.length - completedResponses;

        const analyticsData = {
            surveyInfo: {
                title: survey.title,
                status: survey.status,
                createdAt: survey.createdAt,
                publishedAt: survey.publishedAt,
                totalResponses: survey.responseCount,
                totalViews: survey.viewCount,
                conversionRate: survey.viewCount > 0 ? (survey.responseCount / survey.viewCount) * 100 : 0
            },
            questionAnalytics,
            responsesTimeline,
            responseStats: {
                completed: completedResponses,
                partial: partialResponses
            }
        };

        return NextResponse.json({
            success: true,
            data: analyticsData
        });

    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
