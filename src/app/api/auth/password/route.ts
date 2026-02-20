import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractTokenFromHeader, getUserFromToken, comparePassword, hashPassword } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);

        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!newPassword || newPassword.length < 8) {
            return NextResponse.json({ success: false, message: 'New password must be at least 8 characters long' }, { status: 400 });
        }

        // Fetch full user record to check current password
        const fullUser = await db.user.findUnique({ where: { id: user.id } });

        if (!fullUser) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        if (fullUser.passwordHash) {
            if (!currentPassword) {
                return NextResponse.json({ success: false, message: 'Current password is required' }, { status: 400 });
            }

            const isMatch = await comparePassword(currentPassword, fullUser.passwordHash);
            if (!isMatch) {
                return NextResponse.json({ success: false, message: 'Incorrect current password' }, { status: 401 });
            }
        }

        const hashedNewPassword = await hashPassword(newPassword);

        await db.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedNewPassword }
        });

        return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
