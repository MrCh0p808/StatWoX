import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { analyzeSentiment } from '@/lib/ai';

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
                questions: { where: { type: { in: ['shortText', 'longText'] } } },
                responses: { where: { isComplete: true }, include: { answers: true } }
            }
        });

        if (!survey) return NextResponse.json({ success: false, message: 'Survey not found' }, { status: 404 });
        if (survey.authorId !== user.id) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

        const results: Record<string, any> = {};

        for (const q of survey.questions) {
            const texts = survey.responses
                .flatMap(r => r.answers.filter(a => a.questionId === q.id))
                .map(a => a.value)
                .filter(v => v.trim().length > 0);

            if (texts.length > 0) {
                results[q.id] = {
                    questionTitle: q.title,
                    responseCount: texts.length,
                    sentiment: await analyzeSentiment(texts)
                };
            }
        }

        return NextResponse.json({ success: true, data: { sentimentAnalysis: results } });
    } catch (error: any) {
        console.error('Sentiment analysis error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Analysis failed' }, { status: 500 });
    }
}
