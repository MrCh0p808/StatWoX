import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

        // Export ALL user data as JSON (GDPR Article 20 - data portability)
        const userData = await db.user.findUnique({
            where: { id: user.id },
            include: {
                surveys: {
                    include: { questions: true, responses: { include: { answers: true } } }
                },
                responses: { include: { answers: true } },
                comments: true,
                likes: true,
                notifications: true
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                exportedAt: new Date().toISOString(),
                user: userData
            }
        });
    } catch (error) {
        console.error('GDPR export error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

        const body = await request.json();
        const { confirmEmail } = body;

        if (confirmEmail !== user.email) {
            return NextResponse.json({ success: false, message: 'Email confirmation does not match' }, { status: 400 });
        }

        // GDPR Article 17 - Right to erasure
        // Cascade delete handles related records via Prisma schema
        await db.user.delete({ where: { id: user.id } });

        return NextResponse.json({
            success: true,
            message: 'All your data has been permanently deleted'
        });
    } catch (error) {
        console.error('GDPR delete error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
