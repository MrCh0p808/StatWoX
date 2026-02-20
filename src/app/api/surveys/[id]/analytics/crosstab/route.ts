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

        const { searchParams } = new URL(request.url);
        const questionAId = searchParams.get('questionA');
        const questionBId = searchParams.get('questionB');

        if (!questionAId || !questionBId) {
            return NextResponse.json({ success: false, message: 'questionA and questionB params required' }, { status: 400 });
        }

        const survey = await db.survey.findUnique({
            where: { id },
            include: {
                responses: {
                    where: { isComplete: true },
                    include: { answers: { where: { questionId: { in: [questionAId, questionBId] } } } }
                }
            }
        });

        if (!survey) return NextResponse.json({ success: false, message: 'Survey not found' }, { status: 404 });
        if (survey.authorId !== user.id) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

        // Build cross-tabulation matrix
        const matrix: Record<string, Record<string, number>> = {};

        for (const response of survey.responses) {
            const answerA = response.answers.find(a => a.questionId === questionAId)?.value;
            const answerB = response.answers.find(a => a.questionId === questionBId)?.value;
            if (!answerA || !answerB) continue;

            if (!matrix[answerA]) matrix[answerA] = {};
            matrix[answerA][answerB] = (matrix[answerA][answerB] || 0) + 1;
        }

        return NextResponse.json({
            success: true,
            data: { questionA: questionAId, questionB: questionBId, matrix }
        });
    } catch (error) {
        console.error('Cross-tab error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
