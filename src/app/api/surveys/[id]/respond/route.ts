import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractTokenFromHeader, getUserFromToken, comparePassword } from '@/lib/auth';
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
            if (!password || !(await comparePassword(password, survey.password))) {
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
            const allowed = (survey.ipAllowlist as string[]).some(cidr => {
                // Proper CIDR matching: extract network and prefix length
                const [network, prefixStr] = cidr.split('/');
                if (!prefixStr) return ip === network; // Exact match if no CIDR notation
                const prefix = parseInt(prefixStr, 10);
                const ipParts = ip.split('.').map(Number);
                const netParts = network.split('.').map(Number);
                if (ipParts.length !== 4 || netParts.length !== 4) return false;
                const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
                const netNum = (netParts[0] << 24) | (netParts[1] << 16) | (netParts[2] << 8) | netParts[3];
                const mask = prefix === 0 ? 0 : (~0 << (32 - prefix));
                return (ipNum & mask) === (netNum & mask);
            });
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

        // Validate answers payload
        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Answers array is required and must not be empty' },
                { status: 400 }
            );
        }

        // Validate all questionIds belong to this survey
        const validQuestionIds = new Set(
            survey.questions.map((q: { id: string }) => q.id)
        );
        for (const answer of answers as { questionId: string; value: string }[]) {
            if (!answer.questionId || !validQuestionIds.has(answer.questionId)) {
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

        // Bug #17 fix: Wrap response creation + counter increment in a transaction
        const response = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
            const newResponse = await tx.response.create({
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

            await tx.survey.update({
                where: { id },
                data: { responseCount: { increment: 1 } }
            });

            return newResponse;
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
