import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const where: any = { isPublic: true };
        if (category) where.category = category;

        const [templates, totalItems] = await db.$transaction([
            db.template.findMany({
                where,
                orderBy: { usageCount: 'desc' },
                skip,
                take: limit
            }),
            db.template.count({ where })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                templates,
                pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) }
            }
        });
    } catch (error) {
        console.error('Templates GET error:', error);
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
        const { name, description, category, snapshot, tags = [], isPublic = true } = body;

        if (!name?.trim() || !category || !snapshot) {
            return NextResponse.json({ success: false, message: 'Name, category, and snapshot are required' }, { status: 400 });
        }

        const template = await db.template.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                category,
                snapshot,
                tags,
                isPublic,
                authorId: user.id
            }
        });

        return NextResponse.json({ success: true, data: { template } });
    } catch (error) {
        console.error('Templates POST error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
