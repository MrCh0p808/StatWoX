import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

        const workspaces = await db.workspace.findMany({
            where: {
                OR: [
                    { ownerId: user.id },
                    { members: { some: { userId: user.id } } }
                ]
            },
            include: {
                owner: { select: { id: true, name: true, image: true } },
                members: {
                    include: { user: { select: { id: true, name: true, email: true, image: true } } }
                },
                _count: { select: { surveys: true } }
            }
        });

        return NextResponse.json({ success: true, data: { workspaces } });
    } catch (error) {
        console.error('Workspaces GET error:', error);
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
        const { name } = body;

        if (!name?.trim()) {
            return NextResponse.json({ success: false, message: 'Workspace name is required' }, { status: 400 });
        }

        const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const existing = await db.workspace.findUnique({ where: { slug } });
        if (existing) {
            return NextResponse.json({ success: false, message: 'Workspace slug already taken' }, { status: 409 });
        }

        const workspace = await db.workspace.create({
            data: {
                name: name.trim(),
                slug,
                ownerId: user.id,
                members: {
                    create: { userId: user.id, role: 'owner' }
                }
            },
            include: {
                owner: { select: { id: true, name: true, image: true } },
                members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } }
            }
        });

        await logAudit('create', 'workspace', workspace.id, user.id);

        return NextResponse.json({ success: true, data: { workspace } });
    } catch (error) {
        console.error('Workspace create error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
