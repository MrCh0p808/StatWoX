import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

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

        const survey = await db.survey.findUnique({ where: { id } });
        if (!survey) return NextResponse.json({ success: false, message: 'Survey not found' }, { status: 404 });
        if (survey.authorId !== user.id) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

        const versions = await db.surveyVersion.findMany({
            where: { surveyId: id },
            orderBy: { version: 'desc' },
            take: 50
        });

        return NextResponse.json({ success: true, data: { versions } });
    } catch (error) {
        console.error('Version history error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
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
            include: { questions: { orderBy: { order: 'asc' } } }
        });

        if (!survey) return NextResponse.json({ success: false, message: 'Survey not found' }, { status: 404 });
        if (survey.authorId !== user.id) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { changeNote } = body;

        // Create version snapshot
        const snapshot = {
            title: survey.title,
            description: survey.description,
            category: survey.category,
            questions: survey.questions,
            settings: {
                isPublic: survey.isPublic,
                shareType: survey.shareType,
                allowAnon: survey.allowAnon,
                showProgress: survey.showProgress,
                showQuestionNumbers: survey.showQuestionNumbers,
                shuffleQuestions: survey.shuffleQuestions,
                conversational: survey.conversational,
                theme: survey.theme,
            }
        };

        const version = await db.surveyVersion.create({
            data: {
                surveyId: id,
                version: survey.version,
                snapshot,
                changeNote: changeNote?.trim() || null,
                authorId: user.id
            }
        });

        // Increment survey version counter
        await db.survey.update({
            where: { id },
            data: { version: { increment: 1 } }
        });

        await logAudit('update', 'survey', id, user.id, { action: 'version_created', version: survey.version });

        return NextResponse.json({ success: true, data: { version } });
    } catch (error) {
        console.error('Version create error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
