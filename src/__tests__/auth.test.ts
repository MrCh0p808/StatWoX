import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as registerHandler } from '@/app/api/auth/register/route';
import { GET as meHandler } from '@/app/api/auth/me/route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, hashPassword, extractTokenFromHeader, getUserFromToken, signToken } from '@/lib/auth';
import { ratelimit } from '@/lib/ratelimit';

// Mock DB, Auth utils, and Ratelimit
vi.mock('@/lib/db', () => ({
    db: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock('@/lib/auth', () => ({
    comparePassword: vi.fn(),
    hashPassword: vi.fn(),
    signToken: vi.fn(async () => 'mock-token'),
    extractTokenFromHeader: vi.fn(),
    getUserFromToken: vi.fn(),
}));

vi.mock('@/lib/ratelimit', () => ({
    ratelimit: {
        limit: vi.fn(() => Promise.resolve({ success: true })),
    },
}));

function mockReq(url: string, method: string, body?: any, headers: Record<string, string> = {}) {
    const reqHeaders = new Headers(headers);
    if (!reqHeaders.has('x-forwarded-for')) {
        reqHeaders.set('x-forwarded-for', '127.0.0.1');
    }
    return new NextRequest(url, {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
    });
}

describe('Auth API Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (ratelimit.limit as any).mockResolvedValue({ success: true });
    });

    describe('POST /api/auth/register', () => {
        it('1. should register a new user successfully with all fields', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', {
                email: 'test@example.com',
                password: 'password123',
                username: 'testuser',
                name: 'Test User'
            });

            (db.user.findUnique as any).mockResolvedValue(null);
            (hashPassword as any).mockResolvedValue('hashed-password');
            (db.user.create as any).mockResolvedValue({
                id: '1', email: 'test@example.com', username: 'testuser', name: 'Test User'
            });

            const res = await registerHandler(req);
            const data = await res.json();
            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.token).toBe('mock-token');
            expect(db.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ name: 'Test User' })
            }));
        });

        it('2. should register a new user with only required fields', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', {
                email: 'test@example.com',
                password: 'password123'
            });
            (db.user.findUnique as any).mockResolvedValue(null);
            (hashPassword as any).mockResolvedValue('hashed-password');
            (db.user.create as any).mockResolvedValue({ id: '1', email: 'test@example.com' });

            const res = await registerHandler(req);
            const data = await res.json();
            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(db.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ email: 'test@example.com', username: null, name: null })
            }));
        });

        it('3. should map username to name when name is missing', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', {
                email: 'test@example.com', password: 'password123', username: 'testuser'
            });
            (db.user.findUnique as any).mockResolvedValue(null);
            (hashPassword as any).mockResolvedValue('hashed-password');
            (db.user.create as any).mockResolvedValue({ id: '1' });

            await registerHandler(req);
            expect(db.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ name: 'testuser' })
            }));
        });

        it('4. should return 400 if email is missing', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', { password: 'pass' });
            const res = await registerHandler(req);
            expect(res.status).toBe(400);
        });

        it('5. should return 400 if password is missing', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', { email: 'a@a.com' });
            const res = await registerHandler(req);
            expect(res.status).toBe(400);
        });

        it('6. should return 400 if password is less than 6 characters', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', { email: 'a@a.com', password: '12345' });
            const res = await registerHandler(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.message).toContain('at least 6 characters');
        });

        it('7. should enforce exactly 6 characters password as valid', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', { email: 'a@a.com', password: '123456' });
            (db.user.findUnique as any).mockResolvedValue(null);
            (db.user.create as any).mockResolvedValue({ id: '1' });
            const res = await registerHandler(req);
            expect(res.status).toBe(200);
        });

        it('8. should block duplicate emails', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', { email: 'a@a.com', password: 'password123' });
            (db.user.findUnique as any).mockResolvedValue({ id: 'existing' });
            const res = await registerHandler(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.message).toContain('Email already registered');
        });

        it('9. should enforce lowercase email checks for existing users', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', { email: 'A@A.COM', password: 'password123' });
            (db.user.findUnique as any).mockResolvedValue({ id: 'existing' });
            await registerHandler(req);
            expect(db.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@a.com' } });
        });

        it('10. should block duplicate usernames', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', { email: 'a@a.com', password: 'password123', username: 'taken' });
            (db.user.findUnique as any)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ id: 'existing' });

            const res = await registerHandler(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.message).toContain('Username already taken');
        });

        it('11. should handle missings username gracefully when finding unique', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', { email: 'a@a.com', password: 'password123' });
            (db.user.findUnique as any).mockResolvedValue(null);
            (db.user.create as any).mockResolvedValue({ id: '1' });
            await registerHandler(req);
            expect(db.user.findUnique).toHaveBeenCalledTimes(1);
        });

        it('12. should sanitize HTML from username', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', { email: 'a@a.com', password: 'password123', username: '<script>alert()</script>bad' });
            (db.user.findUnique as any).mockResolvedValue(null);
            (db.user.create as any).mockResolvedValue({ id: '1' });
            await registerHandler(req);
            expect(db.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ username: 'alert()bad' })
            }));
        });

        it('13. should sanitize HTML from name', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', { email: 'a@a.com', password: 'password123', name: '<b>bold</b>name' });
            (db.user.findUnique as any).mockResolvedValue(null);
            (db.user.create as any).mockResolvedValue({ id: '1' });
            await registerHandler(req);
            expect(db.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ name: 'boldname' })
            }));
        });

        it('14. should apply rate limiting (429)', async () => {
            (ratelimit.limit as any).mockResolvedValue({ success: false });
            const req = mockReq('http://localhost/api/auth/register', 'POST', {});
            const res = await registerHandler(req);
            expect(res.status).toBe(429);
        });

        it('15. should handle database findUnique errors gracefully', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', { email: 'a@a.com', password: 'password123' });
            (db.user.findUnique as any).mockRejectedValue(new Error('DB Error'));
            const res = await registerHandler(req);
            expect(res.status).toBe(500);
        });

        it('16. should handle database create errors gracefully', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', { email: 'a@a.com', password: 'password123' });
            (db.user.findUnique as any).mockResolvedValue(null);
            (db.user.create as any).mockRejectedValue(new Error('DB Error'));
            const res = await registerHandler(req);
            expect(res.status).toBe(500);
        });

        it('17. should lowercase email before saving to DB', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', { email: 'MIXED@CaSe.CoM', password: 'password123' });
            (db.user.findUnique as any).mockResolvedValue(null);
            (db.user.create as any).mockResolvedValue({ id: '1' });
            await registerHandler(req);
            expect(db.user.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ email: 'mixed@case.com' })
            }));
        });

        it('18. should return correct payload containing user and token', async () => {
            const req = mockReq('http://localhost/api/auth/register', 'POST', { email: 'a@a.com', password: 'password123' });
            (db.user.findUnique as any).mockResolvedValue(null);
            (db.user.create as any).mockResolvedValue({ id: 'u1', email: 'a@a.com' });
            const res = await registerHandler(req);
            const data = await res.json();
            expect(data.data.token).toBe('mock-token');
            expect(data.data.user.id).toBe('u1');
        });

        it('19. should return 429 using actual x-forwarded-for header', async () => {
            (ratelimit.limit as any).mockResolvedValue({ success: false });
            const req = mockReq('http://localhost/api/auth/register', 'POST', {}, { 'x-forwarded-for': '192.168.1.1' });
            await registerHandler(req);
            expect(ratelimit.limit).toHaveBeenCalledWith('192.168.1.1');
        });

        it('20. should fallback to 127.0.0.1 if x-forwarded-for is missing', async () => {
            (ratelimit.limit as any).mockResolvedValue({ success: false });
            const req = new NextRequest('http://localhost/api/auth/register', { method: 'POST' });
            await registerHandler(req);
            expect(ratelimit.limit).toHaveBeenCalledWith('127.0.0.1');
        });
    });

    describe('POST /api/auth/login', () => {
        it('1. should login with valid credentials', async () => {
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'a@a.com', password: 'password123' });
            (db.user.findUnique as any).mockResolvedValue({ id: '1', email: 'a@a.com', passwordHash: 'hash' });
            (comparePassword as any).mockResolvedValue(true);
            const res = await loginHandler(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.data.token).toBe('mock-token');
        });

        it('2. should reject missing email', async () => {
            const req = mockReq('http://localhost/api/auth/login', 'POST', { password: 'password123' });
            const res = await loginHandler(req);
            expect(res.status).toBe(400);
        });

        it('3. should reject invalid email format', async () => {
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'invalid', password: 'password123' });
            const res = await loginHandler(req);
            expect(res.status).toBe(400);
        });

        it('4. should reject missing password', async () => {
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'a@a.com' });
            const res = await loginHandler(req);
            expect(res.status).toBe(400);
        });

        it('5. should reject empty string password', async () => {
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'a@a.com', password: '' });
            const res = await loginHandler(req);
            expect(res.status).toBe(400);
        });

        it('6. should reject invalid password', async () => {
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'a@a.com', password: 'wrong' });
            (db.user.findUnique as any).mockResolvedValue({ id: '1', passwordHash: 'hash' });
            (comparePassword as any).mockResolvedValue(false);
            const res = await loginHandler(req);
            expect(res.status).toBe(401);
        });

        it('7. should handle non-existent user', async () => {
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'unknown@a.com', password: 'password123' });
            (db.user.findUnique as any).mockResolvedValue(null);
            const res = await loginHandler(req);
            expect(res.status).toBe(401);
        });

        it('8. should reject if user exists but has no passwordHash', async () => {
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'a@a.com', password: 'password123' });
            (db.user.findUnique as any).mockResolvedValue({ id: '1', passwordHash: null });
            const res = await loginHandler(req);
            expect(res.status).toBe(401);
        });

        it('9. should update lastLoginAt, isOnline, and lastSeenAt upon successful login', async () => {
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'a@a.com', password: 'password123' });
            (db.user.findUnique as any).mockResolvedValue({ id: '1', email: 'a@a.com', passwordHash: 'hash' });
            (comparePassword as any).mockResolvedValue(true);
            await loginHandler(req);
            expect(db.user.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: '1' },
                data: expect.objectContaining({
                    isOnline: true,
                })
            }));
        });

        it('10. should return user data without passwordHash', async () => {
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'a@a.com', password: 'password123' });
            (db.user.findUnique as any).mockResolvedValue({ id: '1', email: 'a@a.com', passwordHash: 'hash', name: 'Test' });
            (comparePassword as any).mockResolvedValue(true);
            const res = await loginHandler(req);
            const data = await res.json();
            expect(data.data.user.passwordHash).toBeUndefined();
            expect(data.data.user.name).toBe('Test');
        });

        it('11. should successfully login with uppercase email', async () => {
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'A@A.COM', password: 'password123' });
            (db.user.findUnique as any).mockResolvedValue({ id: '1', email: 'a@a.com', passwordHash: 'hash' });
            (comparePassword as any).mockResolvedValue(true);
            await loginHandler(req);
            expect(db.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@a.com' } });
        });

        it('12. should handle database findUnique errors gracefully', async () => {
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'a@a.com', password: 'password123' });
            (db.user.findUnique as any).mockRejectedValue(new Error('DB Error'));
            const res = await loginHandler(req);
            expect(res.status).toBe(500);
        });

        it('13. should handle password compare errors gracefully', async () => {
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'a@a.com', password: 'password123' });
            (db.user.findUnique as any).mockResolvedValue({ id: '1', passwordHash: 'hash' });
            (comparePassword as any).mockRejectedValue(new Error('Compare Error'));
            const res = await loginHandler(req);
            expect(res.status).toBe(500);
        });

        it('14. should handle database update errors gracefully', async () => {
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'a@a.com', password: 'password123' });
            (db.user.findUnique as any).mockResolvedValue({ id: '1', passwordHash: 'hash' });
            (comparePassword as any).mockResolvedValue(true);
            (db.user.update as any).mockRejectedValue(new Error('Update Error'));
            const res = await loginHandler(req);
            expect(res.status).toBe(500);
        });

        it('15. should apply rate limiting (429)', async () => {
            (ratelimit.limit as any).mockResolvedValue({ success: false });
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'a@a.com', password: 'password123' });
            const res = await loginHandler(req);
            expect(res.status).toBe(429);
        });

        it('16. should rate limit based on x-forwarded-for header', async () => {
            (ratelimit.limit as any).mockResolvedValue({ success: false });
            const req = mockReq('http://localhost/api/auth/login', 'POST', { email: 'a@a.com', password: 'password123' }, { 'x-forwarded-for': '10.0.0.1' });
            await loginHandler(req);
            expect(ratelimit.limit).toHaveBeenCalledWith('10.0.0.1');
        });
    });

    describe('GET /api/auth/me', () => {
        it('1. should return user data for valid token', async () => {
            const req = mockReq('http://localhost/api/auth/me', 'GET', undefined, { 'authorization': 'Bearer valid-token' });
            (extractTokenFromHeader as any).mockReturnValue('valid-token');
            (getUserFromToken as any).mockResolvedValue({ id: '1', email: 'a@a.com' });
            (db.user.update as any).mockResolvedValue({});

            const res = await meHandler(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.data.email).toBe('a@a.com');
        });

        it('2. should update isOnline and lastSeenAt for valid token', async () => {
            const req = mockReq('http://localhost/api/auth/me', 'GET', undefined, { 'authorization': 'Bearer valid-token' });
            (extractTokenFromHeader as any).mockReturnValue('valid-token');
            (getUserFromToken as any).mockResolvedValue({ id: '1', email: 'a@a.com' });

            await meHandler(req);
            expect(db.user.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: '1' },
                data: expect.objectContaining({ isOnline: true })
            }));
        });

        it('3. should reject request with missing authorization header', async () => {
            const req = mockReq('http://localhost/api/auth/me', 'GET');
            (extractTokenFromHeader as any).mockReturnValue(null);
            const res = await meHandler(req);
            expect(res.status).toBe(401);
        });

        it('4. should reject request with empty token in header', async () => {
            const req = mockReq('http://localhost/api/auth/me', 'GET', undefined, { 'authorization': 'Bearer ' });
            (extractTokenFromHeader as any).mockReturnValue(null);
            const res = await meHandler(req);
            expect(res.status).toBe(401);
        });

        it('5. should reject request if user from token does not exist', async () => {
            const req = mockReq('http://localhost/api/auth/me', 'GET', undefined, { 'authorization': 'Bearer invalid' });
            (extractTokenFromHeader as any).mockReturnValue('invalid');
            (getUserFromToken as any).mockResolvedValue(null);
            const res = await meHandler(req);
            expect(res.status).toBe(401);
        });

        it('6. should handle DB update failure gracefully', async () => {
            const req = mockReq('http://localhost/api/auth/me', 'GET', undefined, { 'authorization': 'Bearer valid' });
            (extractTokenFromHeader as any).mockReturnValue('valid');
            (getUserFromToken as any).mockResolvedValue({ id: '1' });
            (db.user.update as any).mockRejectedValue(new Error('Update Error'));
            const res = await meHandler(req);
            expect(res.status).toBe(500);
        });

        it('7. should pass actual header to extractTokenFromHeader', async () => {
            const req = mockReq('http://localhost/api/auth/me', 'GET', undefined, { 'authorization': 'Bearer test-token' });
            await meHandler(req);
            expect(extractTokenFromHeader).toHaveBeenCalledWith('Bearer test-token');
        });

        it('8. should verify token extraction throws no error internally', async () => {
            const req = mockReq('http://localhost/api/auth/me', 'GET', undefined, { 'authorization': 'Bearer test-token' });
            (extractTokenFromHeader as any).mockReturnValue('test-token');
            (getUserFromToken as any).mockResolvedValue({ id: '1' });
            (db.user.update as any).mockResolvedValue({});
            const res = await meHandler(req);
            expect(res.status).toBe(200);
        });

        it('9. should fail gracefully when getUserFromToken throws exception', async () => {
            const req = mockReq('http://localhost/api/auth/me', 'GET', undefined, { 'authorization': 'Bearer test-token' });
            (extractTokenFromHeader as any).mockReturnValue('test-token');
            (getUserFromToken as any).mockRejectedValue(new Error('Auth Error'));
            const res = await meHandler(req);
            expect(res.status).toBe(500);
        });

        it('10. should return correct payload success status', async () => {
            const req = mockReq('http://localhost/api/auth/me', 'GET', undefined, { 'authorization': 'Bearer valid-token' });
            (extractTokenFromHeader as any).mockReturnValue('valid-token');
            (getUserFromToken as any).mockResolvedValue({ id: '1', email: 'a@a.com' });
            const res = await meHandler(req);
            const data = await res.json();
            expect(data.success).toBe(true);
        });
    });
});
