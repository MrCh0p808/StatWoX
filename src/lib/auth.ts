import bcrypt from 'bcryptjs';
import { db } from './db';
import { verifyToken, signToken, JWTPayload } from './jwt';

export { verifyToken, signToken };
export type { JWTPayload };

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function getUserFromToken(token: string) {
    const payload = await verifyToken(token);
    if (!payload) return null;

    const user = await db.user.findUnique({
        where: { id: payload.userId },
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

    return user;
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
}
