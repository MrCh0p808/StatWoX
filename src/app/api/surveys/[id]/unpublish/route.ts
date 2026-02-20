import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: surveyId } = await params;
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);

        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

        const survey = await db.survey.findUnique({ where: { id: surveyId } });

        if (!survey) return NextResponse.json({ success: false, message: 'Survey not found' }, { status: 404 });

        if (survey.authorId !== user.id) {
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
        }

        if (survey.status !== 'published') {
            return NextResponse.json({ success: false, message: 'Survey is not published' }, { status: 400 });
        }

        const updated = await db.survey.update({
            where: { id: surveyId },
            data: {
                status: 'draft',
                publishedAt: null
            }
        });

        return NextResponse.json({ success: true, message: 'Survey unpublished successfully', data: updated });
    } catch (error) {
        console.error('Unpublish survey error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
