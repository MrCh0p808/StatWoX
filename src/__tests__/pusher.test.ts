import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as pusherAuth } from '@/app/api/pusher/auth/route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import Pusher from 'pusher';

// Mock DB
vi.mock('@/lib/db', () => ({
    db: {
        survey: {
            findUnique: vi.fn(),
        }
    }
}));

// Mock Auth
vi.mock('@/lib/auth', () => ({
    extractTokenFromHeader: vi.fn(),
    getUserFromToken: vi.fn(),
}));

// Mock Pusher SDK
vi.mock('pusher', () => {
    return {
        default: class PusherMock {
            authorizeChannel = vi.fn((socketId, channel, data) => ({
                auth: `auth-${socketId}-${channel}`,
                channel_data: data ? JSON.stringify(data) : undefined
            }));
        }
    };
});

// Polyfill formData for NextRequest
function mockReq(url: string, headers: Record<string, string> = {}, formDataObj: Record<string, string> = {}) {
    const formData = new FormData();
    Object.entries(formDataObj).forEach(([k, v]) => formData.set(k, v));

    // Provide a mocked formData resolver
    const req = new NextRequest(url, { headers: new Headers(headers), method: 'POST' });
    req.formData = () => Promise.resolve(formData);
    return req;
}

describe('Pusher Auth API Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (extractTokenFromHeader as any).mockReturnValue('valid-token');
        (getUserFromToken as any).mockResolvedValue({ id: 'user-id', name: 'Test User', image: 'url' });
    });

    describe('POST /api/pusher/auth', () => {
        it('31. Rejects missing Authorization header (401)', async () => {
            (extractTokenFromHeader as any).mockReturnValue(null);
            (getUserFromToken as any).mockResolvedValue(null);
            const req = mockReq('http://localhost', {}, { socket_id: '123', channel_name: 'presence-chat' });
            const res = await pusherAuth(req);
            expect(res.status).toBe(401);
            const data = await res.json();
            expect(data.error).toBe('Unauthorized');
        });

        it('32. Rejects invalid token (401)', async () => {
            (getUserFromToken as any).mockResolvedValue(null);
            const req = mockReq('http://localhost', { 'Authorization': 'Bearer bad' }, { socket_id: '123', channel_name: 'presence-chat' });
            const res = await pusherAuth(req);
            expect(res.status).toBe(401);
        });

        it('33. Rejects missing socket_id (400)', async () => {
            const req = mockReq('http://localhost', { 'Authorization': 'Bearer valid' }, { channel_name: 'presence-chat' });
            const res = await pusherAuth(req);
            expect(res.status).toBe(400);
        });

        it('34. Rejects missing channel_name (400)', async () => {
            const req = mockReq('http://localhost', { 'Authorization': 'Bearer valid' }, { socket_id: '123' });
            const res = await pusherAuth(req);
            expect(res.status).toBe(400);
        });

        it('35. Allows authenticated users into presence- channels with user_info', async () => {
            const req = mockReq('http://localhost', { 'Authorization': 'Bearer valid' }, { socket_id: '123', channel_name: 'presence-room' });
            const res = await pusherAuth(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.auth).toBe('auth-123-presence-room');
            expect(data.channel_data).toContain('Test User');
        });

        it('36. Uses Anonymous if user name is missing in presence- channel', async () => {
            (getUserFromToken as any).mockResolvedValue({ id: 'user-id', name: null, image: 'url' });
            const req = mockReq('http://localhost', { 'Authorization': 'Bearer valid' }, { socket_id: '123', channel_name: 'presence-room' });
            const res = await pusherAuth(req);
            const data = await res.json();
            expect(data.channel_data).toContain('Anonymous');
        });

        it('37. Rejects users from other user\'s private-user- channels (403)', async () => {
            const req = mockReq('http://localhost', { 'Authorization': 'Bearer valid' }, { socket_id: '123', channel_name: 'private-user-other-notifications' });
            const res = await pusherAuth(req);
            expect(res.status).toBe(403);
        });

        it('38. Allows users into their own private-user- channels (notifications)', async () => {
            const req = mockReq('http://localhost', { 'Authorization': 'Bearer valid' }, { socket_id: '123', channel_name: 'private-user-user-id-notifications' });
            const res = await pusherAuth(req);
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.auth).toBe('auth-123-private-user-user-id-notifications');
        });

        it('39. Allows users into their own private-user- channels (messages)', async () => {
            const req = mockReq('http://localhost', { 'Authorization': 'Bearer valid' }, { socket_id: '123', channel_name: 'private-user-user-id-messages' });
            const res = await pusherAuth(req);
            expect(res.status).toBe(200);
        });

        it('40. Rejects non-existent survey for private-survey- channels (404)', async () => {
            (db.survey.findUnique as any).mockResolvedValue(null);
            const req = mockReq('http://localhost', { 'Authorization': 'Bearer valid' }, { socket_id: '123', channel_name: 'private-survey-1' });
            const res = await pusherAuth(req);
            expect(res.status).toBe(404);
        });

        it('41. Allows author into their own private survey channel', async () => {
            (db.survey.findUnique as any).mockResolvedValue({ authorId: 'user-id', isPublic: false });
            const req = mockReq('http://localhost', { 'Authorization': 'Bearer valid' }, { socket_id: '123', channel_name: 'private-survey-1' });
            const res = await pusherAuth(req);
            expect(res.status).toBe(200);
        });

        it('42. Rejects non-author from private survey channel (403)', async () => {
            (db.survey.findUnique as any).mockResolvedValue({ authorId: 'other', isPublic: false });
            const req = mockReq('http://localhost', { 'Authorization': 'Bearer valid' }, { socket_id: '123', channel_name: 'private-survey-1' });
            const res = await pusherAuth(req);
            expect(res.status).toBe(403);
        });

        it('43. Allows any authenticated user into public survey channel', async () => {
            (db.survey.findUnique as any).mockResolvedValue({ authorId: 'other', isPublic: true });
            const req = mockReq('http://localhost', { 'Authorization': 'Bearer valid' }, { socket_id: '123', channel_name: 'private-survey-1' });
            const res = await pusherAuth(req);
            expect(res.status).toBe(200);
        });

        it('44. Rejects unknown channel types (403)', async () => {
            const req = mockReq('http://localhost', { 'Authorization': 'Bearer valid' }, { socket_id: '123', channel_name: 'private-unknown-1' });
            const res = await pusherAuth(req);
            expect(res.status).toBe(403);
        });

        it('45. Handles internal database error gracefully (500)', async () => {
            (db.survey.findUnique as any).mockRejectedValue(new Error('DB crashed'));
            const req = mockReq('http://localhost', { 'Authorization': 'Bearer valid' }, { socket_id: '123', channel_name: 'private-survey-1' });
            const res = await pusherAuth(req);
            expect(res.status).toBe(500);
        });
    });
});
