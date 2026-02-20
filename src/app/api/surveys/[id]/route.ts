import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, getUserFromToken, hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripHtml } from '@/lib/sanitize';
import type { SurveyUpdateData } from '@/types';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const survey = await db.survey.findUnique({
            where: { id },
            include: {
                author: {
                    select: { id: true, name: true, username: true, image: true, bio: true }
                },
                questions: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!survey) {
            return NextResponse.json(
                { success: false, message: 'Survey not found' },
                { status: 404 }
            );
        }

        await db.survey.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
        });

        return NextResponse.json({
            success: true,
            data: { survey }
        });

    } catch (error) {
        console.error('Get survey error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

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
            where: { id }
        });

        if (!existingSurvey) {
            return NextResponse.json(
                { success: false, message: 'Survey not found' },
                { status: 404 }
            );
        }

        if (existingSurvey.authorId !== user.id) {
            return NextResponse.json(
                { success: false, message: 'Not authorized to edit this survey' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const updateData: SurveyUpdateData = {};

        if (body.title !== undefined) updateData.title = stripHtml(body.title.trim());
        if (body.description !== undefined) updateData.description = body.description ? stripHtml(body.description.trim()) : null;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
        if (body.shareType !== undefined) updateData.shareType = body.shareType;
        if (body.allowAnon !== undefined) updateData.allowAnon = body.allowAnon;
        if (body.mediaType !== undefined) updateData.mediaType = body.mediaType;
        if (body.mediaUrl !== undefined) updateData.mediaUrl = body.mediaUrl;
        if (body.caption !== undefined) updateData.caption = body.caption?.trim() || null;
        if (body.maxResponses !== undefined) updateData.maxResponses = body.maxResponses;
        if (body.closesAt !== undefined) updateData.closesAt = body.closesAt ? new Date(body.closesAt) : null;
        if (body.thankYouMessage !== undefined) updateData.thankYouMessage = body.thankYouMessage?.trim() || null;
        if (body.redirectUrl !== undefined) updateData.redirectUrl = body.redirectUrl?.trim() || null;
        if (body.showProgress !== undefined) updateData.showProgress = body.showProgress;
        if (body.showQuestionNumbers !== undefined) updateData.showQuestionNumbers = body.showQuestionNumbers;
        if (body.shuffleQuestions !== undefined) updateData.shuffleQuestions = body.shuffleQuestions;
        if (body.password !== undefined) updateData.password = body.password ? await hashPassword(body.password) : null;
        // P2 fields
        if (body.conversational !== undefined) (updateData as any).conversational = body.conversational;
        if (body.theme !== undefined) (updateData as any).theme = body.theme;
        if (body.locale !== undefined) (updateData as any).locale = body.locale;
        if (body.translations !== undefined) (updateData as any).translations = body.translations;
        if (body.webhookUrl !== undefined) (updateData as any).webhookUrl = body.webhookUrl?.trim() || null;
        if (body.webhookSecret !== undefined) (updateData as any).webhookSecret = body.webhookSecret?.trim() || null;
        if (body.ipAllowlist !== undefined) (updateData as any).ipAllowlist = body.ipAllowlist;
        if (body.paymentRequired !== undefined) (updateData as any).paymentRequired = body.paymentRequired;
        if (body.thankYouLogic !== undefined) (updateData as any).thankYouLogic = body.thankYouLogic;

        // Sync questions if provided 
        if (body.questions && Array.isArray(body.questions)) {
            await db.question.deleteMany({
                where: { surveyId: id }
            });

            await db.question.createMany({
                data: body.questions.map((q: any, index: number) => ({
                    surveyId: id,
                    title: q.title?.trim() || 'Untitled Question',
                    description: q.description?.trim() || null,
                    type: q.type || 'shortText',
                    options: q.options ? q.options : null,
                    required: q.required ?? false,
                    order: index,
                    page: q.page || 1,
                    placeholder: q.placeholder?.trim() || null,
                    validation: q.validation || null,
                    min: q.min || null,
                    max: q.max || null,
                    logic: q.logic || null,
                    fileUpload: q.fileUpload ?? false,
                    fileTypes: q.fileTypes || null,
                    maxFileSize: q.maxFileSize || null,
                }))
            });
        }

        const updatedSurvey = await db.survey.update({
            where: { id },
            data: updateData as any,
            include: {
                questions: { orderBy: { order: 'asc' } },
                author: { select: { id: true, name: true, username: true, image: true } }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Survey updated successfully',
            data: { survey: updatedSurvey }
        });

    } catch (error) {
        console.error('Update survey error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
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
            where: { id }
        });

        if (!existingSurvey) {
            return NextResponse.json(
                { success: false, message: 'Survey not found' },
                { status: 404 }
            );
        }

        if (existingSurvey.authorId !== user.id) {
            return NextResponse.json(
                { success: false, message: 'Not authorized to delete this survey' },
                { status: 403 }
            );
        }

        await db.survey.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'Survey deleted successfully'
        });

    } catch (error) {
        console.error('Delete survey error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
