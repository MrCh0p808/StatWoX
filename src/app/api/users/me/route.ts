import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripHtml } from '@/lib/sanitize';
import type { UserUpdateData } from '@/types';

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
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
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
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const updateData: UserUpdateData = {};

        if (body.name !== undefined) updateData.name = stripHtml(body.name?.trim() || '');
        if (body.username !== undefined) {
            const existingUsername = await db.user.findUnique({
                where: { username: body.username }
            });
            if (existingUsername && existingUsername.id !== user.id) {
                return NextResponse.json(
                    { success: false, message: 'Username already taken' },
                    { status: 409 }
                );
            }
            updateData.username = stripHtml(body.username?.trim() || '');
        }
        if (body.bio !== undefined) updateData.bio = stripHtml(body.bio?.trim() || '');
        if (body.website !== undefined) updateData.website = body.website?.trim() || null;
        if (body.company !== undefined) updateData.company = body.company?.trim() || null;
        if (body.image !== undefined) updateData.image = body.image || null;
        if (body.coverImage !== undefined) updateData.coverImage = body.coverImage || null;

        const updatedUser = await db.user.update({
            where: { id: user.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                image: true,
                bio: true,
                website: true,
                company: true,
                coverImage: true,
                isOnline: true,
                lastSeenAt: true,
                createdAt: true,
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });

    } catch (error) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
