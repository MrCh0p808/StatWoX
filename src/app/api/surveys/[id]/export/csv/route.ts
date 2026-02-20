import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';

function escapeCsv(field: any): string {
    if (field === null || field === undefined) return '""';
    const str = String(field);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: surveyId } = await params;
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);

        if (!token) return new NextResponse('Unauthorized', { status: 401 });

        const user = await getUserFromToken(token);
        if (!user) return new NextResponse('Invalid token', { status: 401 });

        const survey = await db.survey.findUnique({
            where: { id: surveyId },
            include: {
                questions: { orderBy: { order: 'asc' } },
                responses: {
                    include: { answers: true },
                    orderBy: { startedAt: 'desc' }
                }
            }
        });

        if (!survey) return new NextResponse('Survey not found', { status: 404 });

        if (survey.authorId !== user.id) {
            return new NextResponse('Not authorized', { status: 403 });
        }

        // Generate headers
        const coreHeaders = ['Response ID', 'Status', 'Started At', 'Completed At', 'Respondent ID', 'IP Address', 'User Agent'];
        const questionHeaders = survey.questions.map(q => q.title || 'Untitled');
        const headers = [...coreHeaders, ...questionHeaders];

        const csvRows = [headers.map(escapeCsv).join(',')];

        for (const response of survey.responses) {
            const status = response.isComplete ? 'Complete' : 'Partial';

            const coreData = [
                response.id,
                status,
                response.startedAt.toISOString(),
                response.completedAt ? response.completedAt.toISOString() : '',
                response.respondentId || 'Anonymous',
                response.ipAddress || '',
                response.userAgent || ''
            ];

            const answerData = survey.questions.map(q => {
                const answer = response.answers.find(a => a.questionId === q.id);
                return answer ? answer.value : '';
            });

            const row = [...coreData, ...answerData];
            csvRows.push(row.map(escapeCsv).join(','));
        }

        const csvContent = csvRows.join('\n');

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="survey_${surveyId}_export.csv"`
            }
        });

    } catch (error) {
        console.error('Export CSV error:', error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}
