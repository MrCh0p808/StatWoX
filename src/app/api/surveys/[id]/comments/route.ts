import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';

// Helper for simple HTML sanitization since we don't have the explicit module handy
// but usually it's in @/lib/sanitize if it exists. We'll use a basic regex if not found.
function sanitize(input: string) {
    if (!input) return input;
    return input.replace(/<\/?[^>]+(>|$)/g, "");
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: surveyId } = await params;

        // Fetch survey to ensure it exists and we can see it
        const survey = await db.survey.findUnique({
            where: { id: surveyId },
            select: { isPublic: true, authorId: true }
        });

        if (!survey) {
            return NextResponse.json({ success: false, message: 'Survey not found' }, { status: 404 });
        }

        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);
        let user = null;
        if (token) {
            user = await getUserFromToken(token);
        }

        // Check if private
        if (!survey.isPublic && (!user || user.id !== survey.authorId)) {
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        // Fetch top-level comments and their replies
        const [comments, totalItems] = await db.$transaction([
            db.comment.findMany({
                where: {
                    surveyId,
                    parentId: null
                },
                include: {
                    author: {
                        select: { id: true, name: true, image: true, username: true }
                    },
                    replies: {
                        include: {
                            author: {
                                select: { id: true, name: true, image: true, username: true }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            db.comment.count({ where: { surveyId, parentId: null } })
        ]);

        return NextResponse.json({
            success: true,
            data: comments,
            pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) }
        });
    } catch (error) {
        console.error('Fetch comments error:', error);
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

        const body = await request.json();
        const { content, parentId } = body;

        if (!content || typeof content !== 'string' || content.trim() === '') {
            return NextResponse.json({ success: false, message: 'Comment content is required' }, { status: 400 });
        }

        const sanitizedContent = sanitize(content);

        // Verify survey exists
        const survey = await db.survey.findUnique({ where: { id: surveyId } });
        if (!survey) return NextResponse.json({ success: false, message: 'Survey not found' }, { status: 404 });

        // Verify parent comment if parentId provided
        if (parentId) {
            const parent = await db.comment.findUnique({ where: { id: parentId } });
            if (!parent || parent.surveyId !== surveyId) {
                return NextResponse.json({ success: false, message: 'Invalid parent comment' }, { status: 400 });
            }
            if (parent.parentId) {
                // Prevent deep nesting (only 1 level of replies)
                return NextResponse.json({ success: false, message: 'Cannot reply to a reply' }, { status: 400 });
            }
        }

        // Create comment and update survey comment count in a transaction
        const [comment] = await db.$transaction([
            db.comment.create({
                data: {
                    content: sanitizedContent,
                    surveyId,
                    authorId: user.id,
                    parentId: parentId || null
                },
                include: {
                    author: { select: { id: true, name: true, image: true, username: true } },
                    replies: { include: { author: { select: { id: true, name: true, image: true, username: true } } } }
                }
            }),
            db.survey.update({
                where: { id: surveyId },
                data: { commentCount: { increment: 1 } }
            })
        ]);

        return NextResponse.json({ success: true, data: comment }, { status: 201 });
    } catch (error) {
        console.error('Create comment error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
