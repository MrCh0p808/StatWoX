import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(
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

        const existingSurvey = await db.survey.findUnique({
            where: { id },
            include: { questions: true }
        });

        if (!existingSurvey) {
            return NextResponse.json(
                { success: false, message: 'Survey not found' },
                { status: 404 }
            );
        }

        if (existingSurvey.authorId !== user.id) {
            return NextResponse.json(
                { success: false, message: 'Not authorized' },
                { status: 403 }
            );
        }

        if (existingSurvey.questions.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Cannot publish survey without questions' },
                { status: 400 }
            );
        }

        const updatedSurvey = await db.survey.update({
            where: { id },
            data: {
                status: 'published',
                publishedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Survey published successfully',
            data: { survey: updatedSurvey }
        });

    } catch (error) {
        console.error('Publish survey error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
