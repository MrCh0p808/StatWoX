import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { stripHtml } from '@/lib/sanitize';

import { ratelimit } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
    try {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const { success } = await ratelimit.limit(ip);

        if (!success) {
            return NextResponse.json(
                { success: false, message: 'Too many registration attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { email, password, username, name } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: 'Email and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, message: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        const existingUser = await db.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, message: 'Email already registered' },
                { status: 400 }
            );
        }

        if (username) {
            const existingUsername = await db.user.findUnique({
                where: { username }
            });
            if (existingUsername) {
                return NextResponse.json(
                    { success: false, message: 'Username already taken' },
                    { status: 400 }
                );
            }
        }

        const passwordHash = await hashPassword(password);

        const user = await db.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                username: username ? stripHtml(username) : null,
                name: name ? stripHtml(name) : (username ? stripHtml(username) : null),
            },
            select: {
                id: true,
                email: true,
                username: true,
                name: true,
                image: true,
                bio: true,
                createdAt: true,
            }
        });

        const token = await signToken(user.id, user.email);

        const response = NextResponse.json({
            success: true,
            message: 'Account created successfully',
            data: { user, token }
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60
        });

        return response;

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
