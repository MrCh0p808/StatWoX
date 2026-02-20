import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';

function sanitize(input: string) {
    if (!input) return input;
    return input.replace(/<\/?[^>]+(>|$)/g, "");
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: commentId } = await params;
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);

        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

        const body = await request.json();
        const { content } = body;

        if (!content || typeof content !== 'string' || content.trim() === '') {
            return NextResponse.json({ success: false, message: 'Comment content is required' }, { status: 400 });
        }

        const sanitizedContent = sanitize(content);

        const comment = await db.comment.findUnique({ where: { id: commentId } });
        if (!comment) return NextResponse.json({ success: false, message: 'Comment not found' }, { status: 404 });

        if (comment.authorId !== user.id) {
            return NextResponse.json({ success: false, message: 'Not authorized to edit this comment' }, { status: 403 });
        }

        const updatedComment = await db.comment.update({
            where: { id: commentId },
            data: { content: sanitizedContent },
            include: {
                author: { select: { id: true, name: true, image: true, username: true } }
            }
        });

        return NextResponse.json({ success: true, data: updatedComment });
    } catch (error) {
        console.error('Update comment error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: commentId } = await params;
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);

        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

        const comment = await db.comment.findUnique({
            where: { id: commentId },
            include: { survey: { select: { authorId: true } }, replies: { select: { id: true } } }
        });

        if (!comment) return NextResponse.json({ success: false, message: 'Comment not found' }, { status: 404 });

        // User must be the author of the comment or the author of the survey
        if (comment.authorId !== user.id && comment.survey.authorId !== user.id) {
            return NextResponse.json({ success: false, message: 'Not authorized to delete this comment' }, { status: 403 });
        }

        // Count to decrement = 1 (the comment itself) + number of replies
        const decrementCount = 1 + comment.replies.length;

        await db.$transaction([
            // Delete replies (if any, because no onDelete Cascade on parentId)
            db.comment.deleteMany({ where: { parentId: commentId } }),
            // Delete the comment itself
            db.comment.delete({ where: { id: commentId } }),
            // Decrement survey commentCount
            db.survey.update({
                where: { id: comment.surveyId },
                data: { commentCount: { decrement: decrementCount } }
            })
        ]);

        return NextResponse.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
