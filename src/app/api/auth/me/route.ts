import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
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
                { success: false, message: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        await db.user.update({
            where: { id: user.id },
            data: {
                isOnline: true,
                lastSeenAt: new Date()
            }
        });

        const { passwordHash, ...safeUser } = user as any;

        return NextResponse.json({
            success: true,
            data: safeUser
        });

    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
