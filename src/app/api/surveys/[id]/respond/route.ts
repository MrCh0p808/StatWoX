import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { fireWebhook } from '@/lib/webhook';
import { logAudit } from '@/lib/audit';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { answers, metadata: clientMetadata } = body;

        const survey = await db.survey.findUnique({
            where: { id },
            include: { questions: { orderBy: { order: 'asc' } } }
        });

        if (!survey) {
            return NextResponse.json(
                { success: false, message: 'Survey not found' },
                { status: 404 }
            );
        }

        if (survey.status !== 'published') {
            return NextResponse.json(
                { success: false, message: 'Survey is not accepting responses' },
                { status: 400 }
            );
        }

        if (survey.closesAt && new Date() > new Date(survey.closesAt)) {
            return NextResponse.json(
                { success: false, message: 'Survey has closed' },
                { status: 400 }
            );
        }

        if (survey.maxResponses && survey.responseCount >= survey.maxResponses) {
            return NextResponse.json(
                { success: false, message: 'Survey has reached maximum responses' },
                { status: 400 }
            );
        }

        if (survey.password) {
            const { password } = body;
            if (password !== survey.password) {
                return NextResponse.json(
                    { success: false, message: 'Incorrect password' },
                    { status: 401 }
                );
            }
        }

        // IP Allowlist check
        const ip = String(
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown'
        ).split(',')[0].trim();

        if (survey.ipAllowlist && Array.isArray(survey.ipAllowlist) && (survey.ipAllowlist as string[]).length > 0) {
            const allowed = (survey.ipAllowlist as string[]).some(cidr => ip.startsWith(cidr.replace(/\/\d+$/, '')));
            if (!allowed) {
                return NextResponse.json(
                    { success: false, message: 'Access denied: IP not allowed' },
                    { status: 403 }
                );
            }
        }

        let respondentId = null;
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);

        if (token) {
            const user = await getUserFromToken(token);
            if (user) {
                respondentId = user.id;
            }
        }

        if (!survey.allowAnon && !respondentId) {
            return NextResponse.json(
                { success: false, message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Prevent duplicate responses from authenticated users
        if (respondentId) {
            const existingResponse = await db.response.findFirst({
                where: { surveyId: id, respondentId, isComplete: true }
            });
            if (existingResponse) {
                return NextResponse.json(
                    { success: false, message: 'You have already responded to this survey' },
                    { status: 409 }
                );
            }
        }

        // Validate all questionIds belong to this survey
        const validQuestionIds = new Set(
            survey.questions.map((q: { id: string }) => q.id)
        );
        for (const answer of answers as { questionId: string; value: string }[]) {
            if (!validQuestionIds.has(answer.questionId)) {
                return NextResponse.json(
                    { success: false, message: `Invalid questionId: ${answer.questionId}` },
                    { status: 400 }
                );
            }
        }

        // Validate required questions are answered
        const requiredQuestionIds = survey.questions
            .filter((q: { required: boolean }) => q.required)
            .map((q: { id: string }) => q.id);
        const answeredQuestionIds = new Set(
            (answers as { questionId: string; value: string }[]).map(a => a.questionId)
        );
        for (const reqId of requiredQuestionIds) {
            if (!answeredQuestionIds.has(reqId)) {
                return NextResponse.json(
                    { success: false, message: 'Missing answer for required question' },
                    { status: 400 }
                );
            }
        }

        const userAgent = request.headers.get('user-agent') || 'unknown';
        const duration = clientMetadata?.duration || null;

        // Anomaly detection: flag suspicious submissions
        let flagged = false;
        let flagReason: string | null = null;

        // Check 1: Too fast (< 3 seconds per question)
        if (duration && survey.questions.length > 0 && duration < survey.questions.length * 3) {
            flagged = true;
            flagReason = 'Suspiciously fast completion';
        }

        // Build metadata object
        const responseMetadata = {
            geolocation: clientMetadata?.geolocation || null,
            deviceType: clientMetadata?.deviceType || null,
            locale: clientMetadata?.locale || null,
        };

        const response = await db.response.create({
            data: {
                surveyId: id,
                respondentId,
                isComplete: true,
                completedAt: new Date(),
                ipAddress: ip,
                userAgent,
                duration,
                flagged,
                flagReason,
                metadata: responseMetadata,
                answers: {
                    create: (answers as { questionId: string; value: string; fileUrl?: string; signatureUrl?: string }[]).map((answer) => ({
                        questionId: answer.questionId,
                        value: String(answer.value),
                        fileUrl: answer.fileUrl || null,
                        signatureUrl: answer.signatureUrl || null,
                    }))
                }
            }
        });

        await db.survey.update({
            where: { id },
            data: { responseCount: { increment: 1 } }
        });

        // Fire webhook if configured (non-blocking)
        if (survey.webhookUrl) {
            fireWebhook(survey.webhookUrl, survey.webhookSecret, {
                event: 'response.created',
                surveyId: id,
                data: {
                    responseId: response.id,
                    answers,
                    respondentId,
                    completedAt: response.completedAt,
                    duration
                },
                timestamp: new Date().toISOString()
            }).catch(err => console.error('Webhook fire error:', err));
        }

        // Audit log (non-blocking)
        if (respondentId) {
            logAudit('create', 'response', response.id, respondentId, { surveyId: id }).catch(() => { });
        }

        return NextResponse.json({
            success: true,
            message: 'Response submitted successfully',
            data: { responseId: response.id, flagged }
        });

    } catch (error) {
        console.error('Submit response error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
