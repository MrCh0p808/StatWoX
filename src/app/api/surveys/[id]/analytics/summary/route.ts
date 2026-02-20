import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateSummary } from '@/lib/ai';

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
                    where: { isComplete: true },
                    include: { answers: true }
                }
            }
        });

        if (!survey) return NextResponse.json({ success: false, message: 'Survey not found' }, { status: 404 });
        if (survey.authorId !== user.id) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

        // Build question breakdowns for AI
        const breakdowns = survey.questions.map(q => {
            const answers = survey.responses.flatMap(r => r.answers.filter(a => a.questionId === q.id));
            const distribution: Record<string, number> = {};
            for (const a of answers) {
                distribution[a.value] = (distribution[a.value] || 0) + 1;
            }
            return { title: q.title, type: q.type, distribution };
        });

        const summary = await generateSummary(survey.title, breakdowns);
        return NextResponse.json({ success: true, data: summary });
    } catch (error: any) {
        console.error('AI summary error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Summary generation failed' }, { status: 500 });
    }
}
