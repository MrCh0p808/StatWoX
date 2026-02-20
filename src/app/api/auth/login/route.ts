import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { z } from 'zod';
import { ratelimit } from '@/lib/ratelimit';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});

export async function POST(request: NextRequest) {
    try {
        // 1. Rate Limiting
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const { success } = await ratelimit.limit(ip);

        if (!success) {
            return NextResponse.json(
                { success: false, message: 'Too many login attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const body = await request.json();

        // 2. Input Validation
        const result = loginSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { success: false, message: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const { email, password } = result.data;

        // 3. Auth Logic
        const user = await db.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user || !user.passwordHash) {
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        const isValidPassword = await comparePassword(password, user.passwordHash);

        if (!isValidPassword) {
            return NextResponse.json(
                { success: false, message: 'Invalid email or password' },
                { status: 401 }
            );
        }

        await db.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                isOnline: true,
                lastSeenAt: new Date()
            }
        });

        const token = await signToken(user.id, user.email);
        const { passwordHash, ...userWithoutPassword } = user;

        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            data: { user: userWithoutPassword, token }
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
