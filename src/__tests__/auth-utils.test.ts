import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signToken, verifyToken, hashPassword, comparePassword, extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { db } from '@/lib/db';

process.env.JWT_SECRET = 'super-secret-test-key-needs-to-be-thirty-two-chars-long';

vi.mock('@/lib/db', () => ({
    db: {
        user: {
            findUnique: vi.fn(),
        },
    },
}));

describe('Auth Utilities Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('signToken and verifyToken', () => {
        it('1. signToken should generate a valid string token', async () => {
            const token = await signToken('user-1', 'test@example.com');
            expect(typeof token).toBe('string');
            expect(token.split('.').length).toBe(3); // JWT has 3 parts
        });

        it('2. verifyToken should decode a valid token correctly', async () => {
            const token = await signToken('user-2', 'hello@example.com');
            const payload = await verifyToken(token);
            expect(payload).not.toBeNull();
            expect(payload?.userId).toBe('user-2');
            expect(payload?.email).toBe('hello@example.com');
        });

        it('3. verifyToken should return null for tampered token', async () => {
            const token = await signToken('user-3', 'test@example.com');
            const tampered = token.slice(0, -5) + 'abcde';
            const payload = await verifyToken(tampered);
            expect(payload).toBeNull();
        });

        it('4. verifyToken should return null for invalid format', async () => {
            const payload = await verifyToken('invalid-token-string');
            expect(payload).toBeNull();
        });
    });

    describe('hashPassword and comparePassword', () => {
        it('5. hashPassword should generate a string different from input', async () => {
            const hash = await hashPassword('password123');
            expect(hash).not.toBe('password123');
            expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
        });

        it('6. comparePassword should return true for correct password', async () => {
            const password = 'secure-password';
            const hash = await hashPassword(password);
            const result = await comparePassword(password, hash);
            expect(result).toBe(true);
        });

        it('7. comparePassword should return false for incorrect password', async () => {
            const hash = await hashPassword('secure-password');
            const result = await comparePassword('wrong-password', hash);
            expect(result).toBe(false);
        });
    });

    describe('getUserFromToken', () => {
        it('8. should return user if token is valid and user exists', async () => {
            const token = await signToken('existing-user-id', 'test@example.com');
            (db.user.findUnique as any).mockResolvedValue({ id: 'existing-user-id', email: 'test@example.com' });

            const user = await getUserFromToken(token);
            expect(user).not.toBeNull();
            expect(user?.id).toBe('existing-user-id');
            expect(db.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'existing-user-id' }
            }));
        });

        it('9. should return null if token is invalid', async () => {
            const user = await getUserFromToken('invalid-token');
            expect(user).toBeNull();
            expect(db.user.findUnique).not.toHaveBeenCalled();
        });

        it('10. should return null if user does not exist in DB', async () => {
            const token = await signToken('deleted-user-id', 'test@example.com');
            (db.user.findUnique as any).mockResolvedValue(null);

            const user = await getUserFromToken(token);
            expect(user).toBeNull();
        });
    });

    describe('extractTokenFromHeader', () => {
        it('11. should return token from Bearer header', () => {
            const result = extractTokenFromHeader('Bearer my-valid-token');
            expect(result).toBe('my-valid-token');
        });

        it('12. should return null if header is missing', () => {
            const result = extractTokenFromHeader(null);
            expect(result).toBeNull();
        });

        it('13. should return null if missing Bearer prefix', () => {
            const result = extractTokenFromHeader('my-valid-token');
            expect(result).toBeNull();
        });

        it('14. should return null if empty string', () => {
            const result = extractTokenFromHeader('');
            expect(result).toBeNull();
        });

        it('15. should return empty string if only Bearer (edge case)', () => {
            const result = extractTokenFromHeader('Bearer ');
            expect(result).toBe('');
        });
    });
});
