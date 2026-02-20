import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: surveyId } = await params;
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);

        if (!token) return NextResponse.json({ success: true, liked: false });

        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: true, liked: false });

        const like = await db.like.findUnique({
            where: { userId_surveyId: { userId: user.id, surveyId } }
        });

        return NextResponse.json({ success: true, liked: !!like });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
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

        // Check if like already exists
        const existingLike = await db.like.findUnique({
            where: {
                userId_surveyId: {
                    userId: user.id,
                    surveyId
                }
            }
        });

        if (existingLike) {
            return NextResponse.json({ success: false, message: 'Survey already liked' }, { status: 400 });
        }

        await db.$transaction([
            db.like.create({
                data: {
                    userId: user.id,
                    surveyId
                }
            }),
            db.survey.update({
                where: { id: surveyId },
                data: { likeCount: { increment: 1 } }
            })
        ]);

        return NextResponse.json({ success: true, message: 'Survey liked successfully' }, { status: 201 });
    } catch (error) {
        console.error('Like survey error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
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

        // Check if like exists
        const existingLike = await db.like.findUnique({
            where: {
                userId_surveyId: {
                    userId: user.id,
                    surveyId
                }
            }
        });

        if (!existingLike) {
            return NextResponse.json({ success: false, message: 'Survey not liked yet' }, { status: 400 });
        }

        await db.$transaction([
            db.like.delete({
                where: { id: existingLike.id }
            }),
            db.survey.update({
                where: { id: surveyId },
                data: { likeCount: { decrement: 1 } }
            })
        ]);

        return NextResponse.json({ success: true, message: 'Survey unliked successfully' });
    } catch (error) {
        console.error('Unlike survey error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
