import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);

        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

        const searchParams = request.nextUrl.searchParams;
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const where = {
            userId: user.id,
            ...(unreadOnly ? { read: false } : {})
        };

        const [notifications, totalItems, unreadCount] = await db.$transaction([
            db.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            db.notification.count({ where }),
            db.notification.count({ where: { userId: user.id, read: false } })
        ]);

        return NextResponse.json({
            success: true,
            data: notifications,
            unreadCount,
            pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) }
        });
    } catch (error) {
        console.error('Fetch notifications error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);

        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

        const body = await request.json();
        const { id, markAll } = body;

        if (markAll) {
            await db.notification.updateMany({
                where: { userId: user.id, read: false },
                data: { read: true, readAt: new Date() }
            });
            return NextResponse.json({ success: true, message: 'All notifications marked as read' });
        }

        if (!id) {
            return NextResponse.json({ success: false, message: 'Must provide id or markAll' }, { status: 400 });
        }

        const notification = await db.notification.findUnique({ where: { id } });

        if (!notification) {
            return NextResponse.json({ success: false, message: 'Notification not found' }, { status: 404 });
        }

        if (notification.userId !== user.id) {
            return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
        }

        const updated = await db.notification.update({
            where: { id },
            data: { read: true, readAt: new Date() }
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error('Update notification error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
