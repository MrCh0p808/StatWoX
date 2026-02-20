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

        const { searchParams } = new URL(request.url);
        const tag = searchParams.get('tag');

        const where: any = { userId: user.id };
        if (tag) where.tags = { has: tag };

        const questions = await db.questionBank.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, data: { questions } });
    } catch (error) {
        console.error('Question bank GET error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

        const body = await request.json();
        const { title, description, type, options, tags = [] } = body;

        if (!title?.trim()) {
            return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
        }

        const question = await db.questionBank.create({
            data: {
                title: title.trim(),
                description: description?.trim() || null,
                type: type || 'shortText',
                options: options || null,
                tags,
                userId: user.id
            }
        });

        return NextResponse.json({ success: true, data: { question } });
    } catch (error) {
        console.error('Question bank POST error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
