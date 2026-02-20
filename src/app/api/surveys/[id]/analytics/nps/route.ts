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

        // Find rating-type questions (NPS uses 0-10 scale)
        const survey = await db.survey.findUnique({
            where: { id },
            include: {
                questions: { where: { type: 'rating' } },
                responses: { where: { isComplete: true }, include: { answers: true } }
            }
        });

        if (!survey) return NextResponse.json({ success: false, message: 'Survey not found' }, { status: 404 });
        if (survey.authorId !== user.id) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

        const npsResults: Record<string, any> = {};

        for (const q of survey.questions) {
            const scores = survey.responses
                .flatMap(r => r.answers.filter(a => a.questionId === q.id))
                .map(a => parseInt(a.value))
                .filter(v => !isNaN(v));

            if (scores.length === 0) continue;

            let promoters = 0, passives = 0, detractors = 0;
            for (const score of scores) {
                if (score >= 9) promoters++;
                else if (score >= 7) passives++;
                else detractors++;
            }

            const total = scores.length;
            npsResults[q.id] = {
                questionTitle: q.title,
                score: Math.round(((promoters - detractors) / total) * 100),
                promoters,
                passives,
                detractors,
                totalResponses: total,
                promoterPct: Math.round((promoters / total) * 100),
                passivePct: Math.round((passives / total) * 100),
                detractorPct: Math.round((detractors / total) * 100)
            };
        }

        return NextResponse.json({ success: true, data: { nps: npsResults } });
    } catch (error) {
        console.error('NPS calculation error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
