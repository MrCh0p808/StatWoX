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
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

        const survey = await db.survey.findUnique({
            where: { id },
            include: {
                questions: { orderBy: { order: 'asc' } },
                responses: {
                    include: { answers: true },
                    orderBy: { startedAt: 'asc' }
                }
            }
        });

        if (!survey) return NextResponse.json({ success: false, message: 'Survey not found' }, { status: 404 });
        if (survey.authorId !== user.id) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

        // Get unique pages
        const pages = Array.from(new Set(survey.questions.map(q => q.page))).sort((a, b) => a - b);

        // Build funnel steps
        const totalStarted = survey.responses.length;
        const funnel = pages.map(pageNum => {
            const pageQuestionIds = survey.questions
                .filter(q => q.page === pageNum)
                .map(q => q.id);

            // Count responses that have at least one answer for this page's questions
            const respondedToPage = survey.responses.filter(r =>
                r.answers.some(a => pageQuestionIds.includes(a.questionId))
            ).length;

            return {
                page: pageNum,
                started: respondedToPage,
                completed: respondedToPage, // Completed if answers exist
                dropOffRate: totalStarted > 0
                    ? Math.round(((totalStarted - respondedToPage) / totalStarted) * 100)
                    : 0
            };
        });

        // Add submission step
        const completedCount = survey.responses.filter(r => r.isComplete).length;
        funnel.push({
            page: pages.length + 1,
            started: completedCount,
            completed: completedCount,
            dropOffRate: totalStarted > 0
                ? Math.round(((totalStarted - completedCount) / totalStarted) * 100)
                : 0
        });

        return NextResponse.json({
            success: true,
            data: {
                funnel,
                totalStarted,
                totalCompleted: completedCount,
                overallCompletionRate: totalStarted > 0
                    ? Math.round((completedCount / totalStarted) * 100)
                    : 0
            }
        });
    } catch (error) {
        console.error('Funnel analysis error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
