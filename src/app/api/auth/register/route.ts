import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { stripHtml } from '@/lib/sanitize';
import { z } from 'zod';
import { ratelimit } from '@/lib/ratelimit';

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .optional(),
    name: z.string().max(100).optional(),
});

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

        const result = registerSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { success: false, message: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const { email, password, username, name } = result.data;

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
