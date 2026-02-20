import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getSurveys, POST as createSurvey } from '@/app/api/surveys/route';
import { GET as getSurveyById, PATCH as updateSurveyById, DELETE as deleteSurveyById } from '@/app/api/surveys/[id]/route';
import { PATCH as publishSurvey } from '@/app/api/surveys/[id]/publish/route';
import { POST as respondToSurvey } from '@/app/api/surveys/[id]/respond/route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { extractTokenFromHeader, getUserFromToken, hashPassword } from '@/lib/auth';

// Mock DB and Auth
vi.mock('@/lib/db', () => ({
    db: {
        $transaction: vi.fn((promises) => Promise.all(promises)),
        survey: {
            findMany: vi.fn(),
            count: vi.fn().mockResolvedValue(1),
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        response: {
            findFirst: vi.fn(),
            create: vi.fn(),
        }
    },
}));

vi.mock('@/lib/auth', () => ({
    getUserFromToken: vi.fn(),
    extractTokenFromHeader: vi.fn(),
    hashPassword: vi.fn((pw) => Promise.resolve(`hashed-${pw}`)),
}));

function mockReq(url: string, method: string, body?: any, headers: Record<string, string> = {}) {
    return new NextRequest(url, {
        method,
        headers: new Headers(headers),
        body: body ? JSON.stringify(body) : undefined,
    });
}

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('Survey API Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/surveys (List Surveys)', () => {
        it('1. Rejects missing auth header (401)', async () => {
            const req = mockReq('http://localhost/api/surveys', 'GET');
            (extractTokenFromHeader as any).mockReturnValue(null);
            const res = await getSurveys(req);
            expect(res.status).toBe(401);
        });

        it('2. Rejects invalid token (401)', async () => {
            const req = mockReq('http://localhost/api/surveys', 'GET', undefined, { 'authorization': 'Bearer bad' });
            (extractTokenFromHeader as any).mockReturnValue('bad');
            (getUserFromToken as any).mockResolvedValue(null);
            const res = await getSurveys(req);
            expect(res.status).toBe(401);
        });

        it('3. Mine filter (returns user surveys)', async () => {
            const req = mockReq('http://localhost/api/surveys?filter=mine', 'GET', undefined, { 'authorization': 'Bearer valid' });
            (extractTokenFromHeader as any).mockReturnValue('valid');
            (getUserFromToken as any).mockResolvedValue({ id: 'u1' });
            (db.survey.findMany as any).mockResolvedValue([
                { id: '1', title: 'mine', _count: { questions: 1, responses: 2, comments: 0 } }
            ]);

            const res = await getSurveys(req);
            expect(res.status).toBe(200);
            expect(db.survey.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { authorId: 'u1' } }));
        });

        it('4. Public filter (returns published public surveys)', async () => {
            const req = mockReq('http://localhost/api/surveys?filter=public', 'GET', undefined, { 'authorization': 'Bearer valid' });
            (extractTokenFromHeader as any).mockReturnValue('valid');
            (getUserFromToken as any).mockResolvedValue({ id: 'u1' });
            (db.survey.findMany as any).mockResolvedValue([]);

            await getSurveys(req);
            expect(db.survey.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isPublic: true, status: 'published' } }));
        });

        it('5. Default filter (returns mine surveys fallback)', async () => {
            const req = mockReq('http://localhost/api/surveys', 'GET', undefined, { 'authorization': 'Bearer valid' });
            (extractTokenFromHeader as any).mockReturnValue('valid');
            (getUserFromToken as any).mockResolvedValue({ id: 'u2' });
            (db.survey.findMany as any).mockResolvedValue([]);

            await getSurveys(req);
            expect(db.survey.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { authorId: 'u2' } }));
        });

        it('6. Handles internal error (500)', async () => {
            const req = mockReq('http://localhost/api/surveys', 'GET', undefined, { 'authorization': 'Bearer valid' });
            (extractTokenFromHeader as any).mockReturnValue('valid');
            (getUserFromToken as any).mockResolvedValue({ id: 'u1' });
            (db.survey.findMany as any).mockRejectedValue(new Error('DB Error'));

            const res = await getSurveys(req);
            expect(res.status).toBe(500);
        });
    });

    describe('POST /api/surveys (Create Survey)', () => {
        beforeEach(() => {
            (extractTokenFromHeader as any).mockReturnValue('valid');
            (getUserFromToken as any).mockResolvedValue({ id: 'u1' });
        });

        it('7. Creates successfully', async () => {
            const req = mockReq('http://localhost/api/surveys', 'POST', { title: 'Test' }, { 'authorization': 'Bearer valid' });
            (db.survey.create as any).mockResolvedValue({ id: 's1', title: 'Test' });
            const res = await createSurvey(req);
            expect(res.status).toBe(200);
            expect(db.survey.create).toHaveBeenCalled();
        });

        it('8. Rejects missing token (401)', async () => {
            const req = mockReq('http://localhost/api/surveys', 'POST', { title: 'Test' });
            (extractTokenFromHeader as any).mockReturnValue(null);
            const res = await createSurvey(req);
            expect(res.status).toBe(401);
        });

        it('9. Rejects invalid token (401)', async () => {
            const req = mockReq('http://localhost/api/surveys', 'POST', { title: 'Test' }, { 'authorization': 'Bearer bad' });
            (extractTokenFromHeader as any).mockReturnValue('bad');
            (getUserFromToken as any).mockResolvedValue(null);
            const res = await createSurvey(req);
            expect(res.status).toBe(401);
        });

        it('10. Rejects missing title (400)', async () => {
            const req = mockReq('http://localhost/api/surveys', 'POST', {}, { 'authorization': 'Bearer valid' });
            const res = await createSurvey(req);
            expect(res.status).toBe(400);
        });

        it('11. Rejects blank title (400)', async () => {
            const req = mockReq('http://localhost/api/surveys', 'POST', { title: '   ' }, { 'authorization': 'Bearer valid' });
            const res = await createSurvey(req);
            expect(res.status).toBe(400);
        });

        it('12. Sanitizes HTML in title', async () => {
            const req = mockReq('http://localhost/api/surveys', 'POST', { title: '<b>bold</b>' }, { 'authorization': 'Bearer valid' });
            (db.survey.create as any).mockResolvedValue({});
            await createSurvey(req);
            expect(db.survey.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ title: 'bold' }) }));
        });

        it('13. Sanitizes HTML in description', async () => {
            const req = mockReq('http://localhost/api/surveys', 'POST', { title: 'T', description: '<script>alert()</script>bad' }, { 'authorization': 'Bearer valid' });
            (db.survey.create as any).mockResolvedValue({});
            await createSurvey(req);
            expect(db.survey.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ description: 'alert()bad' }) }));
        });

        it('14. Allows null description', async () => {
            const req = mockReq('http://localhost/api/surveys', 'POST', { title: 'T', description: null }, { 'authorization': 'Bearer valid' });
            (db.survey.create as any).mockResolvedValue({});
            await createSurvey(req);
            expect(db.survey.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ description: null }) }));
        });

        it('15. Validates payload size of options (rejects >10KB) (400)', async () => {
            const hugePayload = Array(10250).fill('a').join('');
            const req = mockReq('http://localhost/api/surveys', 'POST', { title: 'T', questions: [{ options: hugePayload }] }, { 'authorization': 'Bearer valid' });
            const res = await createSurvey(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.message).toContain('exceed 10KB limit');
        });

        it('16. Allows normal payload size of options', async () => {
            const req = mockReq('http://localhost/api/surveys', 'POST', { title: 'T', questions: [{ options: ['a', 'b'] }] }, { 'authorization': 'Bearer valid' });
            (db.survey.create as any).mockResolvedValue({});
            const res = await createSurvey(req);
            expect(res.status).toBe(200);
        });

        it('17. Creates default questions config if missing', async () => {
            const req = mockReq('http://localhost/api/surveys', 'POST', { title: 'T', questions: [{}] }, { 'authorization': 'Bearer valid' });
            (db.survey.create as any).mockResolvedValue({});
            await createSurvey(req);
            expect(db.survey.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    questions: expect.objectContaining({
                        create: expect.arrayContaining([
                            expect.objectContaining({ title: 'Untitled Question', type: 'shortText' })
                        ])
                    })
                })
            }));
        });

        it('18. Hashes password if provided', async () => {
            const req = mockReq('http://localhost/api/surveys', 'POST', { title: 'T', password: 'sec' }, { 'authorization': 'Bearer valid' });
            (db.survey.create as any).mockResolvedValue({});
            await createSurvey(req);
            expect(hashPassword).toHaveBeenCalledWith('sec');
            expect(db.survey.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ password: 'hashed-sec' }) }));
        });

        it('19. Handles missing optional fields correctly', async () => {
            const req = mockReq('http://localhost/api/surveys', 'POST', { title: 'T' }, { 'authorization': 'Bearer valid' });
            (db.survey.create as any).mockResolvedValue({});
            await createSurvey(req);
            expect(db.survey.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ mediaType: null, caption: null, maxResponses: null, closesAt: null, password: null })
            }));
        });

        it('20. Handles internal error (500)', async () => {
            const req = mockReq('http://localhost/api/surveys', 'POST', { title: 'T' }, { 'authorization': 'Bearer valid' });
            (db.survey.create as any).mockRejectedValue(new Error('err'));
            const res = await createSurvey(req);
            expect(res.status).toBe(500);
        });
    });

    describe('GET /api/surveys/[id] (Get Survey By ID)', () => {
        it('21. Returns survey successfully and increments view count', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'GET');
            (db.survey.findUnique as any).mockResolvedValue({ id: '1' });
            (db.survey.update as any).mockResolvedValue({});

            const res = await getSurveyById(req, mockParams('1'));
            expect(res.status).toBe(200);
            expect(db.survey.update).toHaveBeenCalledWith(expect.objectContaining({ data: { viewCount: { increment: 1 } } }));
        });

        it('22. Returns 404 if survey not found', async () => {
            const req = mockReq('http://localhost/api/surveys/missing', 'GET');
            (db.survey.findUnique as any).mockResolvedValue(null);
            const res = await getSurveyById(req, mockParams('missing'));
            expect(res.status).toBe(404);
        });

        it('23. Handles internal error (500)', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'GET');
            (db.survey.findUnique as any).mockRejectedValue(new Error('err'));
            const res = await getSurveyById(req, mockParams('1'));
            expect(res.status).toBe(500);
        });
    });

    describe('PATCH /api/surveys/[id] (Update Survey Details)', () => {
        beforeEach(() => {
            (extractTokenFromHeader as any).mockReturnValue('valid');
            (getUserFromToken as any).mockResolvedValue({ id: 'u1' });
            (db.survey.findUnique as any).mockResolvedValue({ id: 's1', authorId: 'u1' });
        });

        it('24. Rejects missing token (401)', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'PATCH', {});
            (extractTokenFromHeader as any).mockReturnValue(null);
            const res = await updateSurveyById(req, mockParams('1'));
            expect(res.status).toBe(401);
        });

        it('25. Rejects invalid token (401)', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'PATCH', {}, { 'authorization': 'Bearer bad' });
            (extractTokenFromHeader as any).mockReturnValue('bad');
            (getUserFromToken as any).mockResolvedValue(null);
            const res = await updateSurveyById(req, mockParams('1'));
            expect(res.status).toBe(401);
        });

        it('26. Rejects non-existent survey (404)', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'PATCH', {}, { 'authorization': 'Bearer valid' });
            (db.survey.findUnique as any).mockResolvedValue(null);
            const res = await updateSurveyById(req, mockParams('1'));
            expect(res.status).toBe(404);
        });

        it('27. Rejects unauthorized author (403)', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'PATCH', {}, { 'authorization': 'Bearer valid' });
            (db.survey.findUnique as any).mockResolvedValue({ id: '1', authorId: 'u2' });
            const res = await updateSurveyById(req, mockParams('1'));
            expect(res.status).toBe(403);
        });

        it('28. Updates title, successfully stripped HTML', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'PATCH', { title: '<b>test</b>' }, { 'authorization': 'Bearer valid' });
            (db.survey.update as any).mockResolvedValue({});
            await updateSurveyById(req, mockParams('1'));
            expect(db.survey.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ title: 'test' }) }));
        });

        it('29. Updates description optionally', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'PATCH', { description: 'desc' }, { 'authorization': 'Bearer valid' });
            (db.survey.update as any).mockResolvedValue({});
            await updateSurveyById(req, mockParams('1'));
            expect(db.survey.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ description: 'desc' }) }));
        });

        it('30. Updates password, hashes it', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'PATCH', { password: 'new' }, { 'authorization': 'Bearer valid' });
            (db.survey.update as any).mockResolvedValue({});
            await updateSurveyById(req, mockParams('1'));
            expect(db.survey.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ password: 'hashed-new' }) }));
        });

        it('31. Updates all other boolean/date fields', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'PATCH', { isPublic: false, maxResponses: 10, category: 'quiz' }, { 'authorization': 'Bearer valid' });
            (db.survey.update as any).mockResolvedValue({});
            await updateSurveyById(req, mockParams('1'));
            expect(db.survey.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isPublic: false, maxResponses: 10, category: 'quiz' }) }));
        });

        it('32. Handles internal error (500)', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'PATCH', {}, { 'authorization': 'Bearer valid' });
            (db.survey.update as any).mockRejectedValue(new Error('err'));
            const res = await updateSurveyById(req, mockParams('1'));
            expect(res.status).toBe(500);
        });
    });

    describe('DELETE /api/surveys/[id]', () => {
        beforeEach(() => {
            (extractTokenFromHeader as any).mockReturnValue('valid');
            (getUserFromToken as any).mockResolvedValue({ id: 'u1' });
            (db.survey.findUnique as any).mockResolvedValue({ id: 's1', authorId: 'u1' });
        });

        it('33. Rejects missing token (401)', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'DELETE');
            (extractTokenFromHeader as any).mockReturnValue(null);
            const res = await deleteSurveyById(req, mockParams('1'));
            expect(res.status).toBe(401);
        });

        it('34. Rejects invalid token (401)', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'DELETE', undefined, { 'authorization': 'Bearer bad' });
            (extractTokenFromHeader as any).mockReturnValue('bad');
            (getUserFromToken as any).mockResolvedValue(null);
            const res = await deleteSurveyById(req, mockParams('1'));
            expect(res.status).toBe(401);
        });

        it('35. Rejects non-existent survey (404)', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'DELETE', undefined, { 'authorization': 'Bearer valid' });
            (db.survey.findUnique as any).mockResolvedValue(null);
            const res = await deleteSurveyById(req, mockParams('1'));
            expect(res.status).toBe(404);
        });

        it('36. Rejects unauthorized author (403)', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'DELETE', undefined, { 'authorization': 'Bearer valid' });
            (db.survey.findUnique as any).mockResolvedValue({ id: '1', authorId: 'u2' });
            const res = await deleteSurveyById(req, mockParams('1'));
            expect(res.status).toBe(403);
        });

        it('37. Deletes survey successfully', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'DELETE', undefined, { 'authorization': 'Bearer valid' });
            (db.survey.delete as any).mockResolvedValue({});
            const res = await deleteSurveyById(req, mockParams('1'));
            expect(res.status).toBe(200);
            expect(db.survey.delete).toHaveBeenCalledWith({ where: { id: '1' } });
        });

        it('38. Handles internal error (500)', async () => {
            const req = mockReq('http://localhost/api/surveys/1', 'DELETE', undefined, { 'authorization': 'Bearer valid' });
            (db.survey.delete as any).mockRejectedValue(new Error('err'));
            const res = await deleteSurveyById(req, mockParams('1'));
            expect(res.status).toBe(500);
        });
    });

    describe('PATCH /api/surveys/[id]/publish', () => {
        beforeEach(() => {
            (extractTokenFromHeader as any).mockReturnValue('valid');
            (getUserFromToken as any).mockResolvedValue({ id: 'u1' });
            (db.survey.findUnique as any).mockResolvedValue({ id: '1', authorId: 'u1', questions: [{ id: 'q1' }] });
        });

        it('39. Rejects missing token (401)', async () => {
            const req = mockReq('http://localhost/api/surveys/1/publish', 'PATCH');
            (extractTokenFromHeader as any).mockReturnValue(null);
            const res = await publishSurvey(req, mockParams('1'));
            expect(res.status).toBe(401);
        });

        it('40. Rejects invalid token (401)', async () => {
            const req = mockReq('http://localhost/api/surveys/1/publish', 'PATCH', undefined, { 'authorization': 'Bearer bad' });
            (extractTokenFromHeader as any).mockReturnValue('bad');
            (getUserFromToken as any).mockResolvedValue(null);
            const res = await publishSurvey(req, mockParams('1'));
            expect(res.status).toBe(401);
        });

        it('41. Rejects non-existent survey (404)', async () => {
            const req = mockReq('http://localhost/api/surveys/1/publish', 'PATCH', undefined, { 'authorization': 'Bearer valid' });
            (db.survey.findUnique as any).mockResolvedValue(null);
            const res = await publishSurvey(req, mockParams('1'));
            expect(res.status).toBe(404);
        });

        it('42. Rejects unauthorized author (403)', async () => {
            const req = mockReq('http://localhost/api/surveys/1/publish', 'PATCH', undefined, { 'authorization': 'Bearer valid' });
            (db.survey.findUnique as any).mockResolvedValue({ id: '1', authorId: 'u2', questions: [] });
            const res = await publishSurvey(req, mockParams('1'));
            expect(res.status).toBe(403);
        });

        it('43. Rejects publishing survey without questions (400)', async () => {
            const req = mockReq('http://localhost/api/surveys/1/publish', 'PATCH', undefined, { 'authorization': 'Bearer valid' });
            (db.survey.findUnique as any).mockResolvedValue({ id: '1', authorId: 'u1', questions: [] });
            const res = await publishSurvey(req, mockParams('1'));
            expect(res.status).toBe(400);
        });

        it('44. Publishes successfully if questions exist', async () => {
            const req = mockReq('http://localhost/api/surveys/1/publish', 'PATCH', undefined, { 'authorization': 'Bearer valid' });
            (db.survey.update as any).mockResolvedValue({});
            const res = await publishSurvey(req, mockParams('1'));
            expect(res.status).toBe(200);
            expect(db.survey.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'published', publishedAt: expect.any(Date) } }));
        });

        it('45. Handles internal error (500)', async () => {
            const req = mockReq('http://localhost/api/surveys/1/publish', 'PATCH', undefined, { 'authorization': 'Bearer valid' });
            (db.survey.update as any).mockRejectedValue(new Error('err'));
            const res = await publishSurvey(req, mockParams('1'));
            expect(res.status).toBe(500);
        });
    });

    describe('POST /api/surveys/[id]/respond', () => {
        beforeEach(() => {
            (extractTokenFromHeader as any).mockReturnValue(null);
            (getUserFromToken as any).mockResolvedValue(null);
            (db.survey.findUnique as any).mockResolvedValue({
                id: '1',
                status: 'published',
                allowAnon: true,
                closesAt: null,
                maxResponses: null,
                responseCount: 0,
                questions: [
                    { id: 'q1', required: true }
                ]
            });
            (db.response.create as any).mockResolvedValue({ id: 'r1' });
            (db.survey.update as any).mockResolvedValue({});
        });

        it('46. Rejects non-existent survey (404)', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [] });
            (db.survey.findUnique as any).mockResolvedValue(null);
            const res = await respondToSurvey(req, mockParams('1'));
            expect(res.status).toBe(404);
        });

        it('47. Rejects draft survey (400)', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [] });
            (db.survey.findUnique as any).mockResolvedValue({ status: 'draft' });
            const res = await respondToSurvey(req, mockParams('1'));
            expect(res.status).toBe(400);
        });

        it('48. Rejects closed survey (date) (400)', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [] });
            (db.survey.findUnique as any).mockResolvedValue({ status: 'published', closesAt: new Date(Date.now() - 10000) });
            const res = await respondToSurvey(req, mockParams('1'));
            expect(res.status).toBe(400);
        });

        it('49. Rejects survey at max responses (400)', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [] });
            (db.survey.findUnique as any).mockResolvedValue({ status: 'published', maxResponses: 10, responseCount: 10 });
            const res = await respondToSurvey(req, mockParams('1'));
            expect(res.status).toBe(400);
        });

        it('50. Rejects wrong password if set (401)', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [], password: 'wrong' });
            (db.survey.findUnique as any).mockResolvedValue({ status: 'published', password: 'correct' });
            const res = await respondToSurvey(req, mockParams('1'));
            expect(res.status).toBe(401);
        });

        it('51. Accepts correct password if set', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [{ questionId: 'q1', value: 'a' }], password: 'correct' });
            (db.survey.findUnique as any).mockResolvedValue({
                status: 'published', password: 'correct', allowAnon: true,
                questions: [{ id: 'q1', required: true }]
            });
            const res = await respondToSurvey(req, mockParams('1'));
            expect(res.status).toBe(200);
        });

        it('52. Rejects unauthenticated on a survey explicitly requiring auth (allowAnon = false) (401)', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [] });
            (db.survey.findUnique as any).mockResolvedValue({ status: 'published', allowAnon: false });
            const res = await respondToSurvey(req, mockParams('1'));
            expect(res.status).toBe(401);
        });

        it('53. Allows unauthenticated on a survey allowing anon', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [{ questionId: 'q1', value: 'a' }] });
            const res = await respondToSurvey(req, mockParams('1'));
            expect(res.status).toBe(200);
        });

        it('54. Blocks duplicate response from authenticated user (409)', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [{ questionId: 'q1', value: 'a' }] }, { 'authorization': 'Bearer valid' });
            (extractTokenFromHeader as any).mockReturnValue('valid');
            (getUserFromToken as any).mockResolvedValue({ id: 'u1' });
            (db.response.findFirst as any).mockResolvedValue({ id: 'existing' });
            const res = await respondToSurvey(req, mockParams('1'));
            expect(res.status).toBe(409);
        });

        it('55. Rejects response with an invalid questionId (400)', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [{ questionId: 'invalid-q', value: 'a' }] });
            const res = await respondToSurvey(req, mockParams('1'));
            expect(res.status).toBe(400);
        });

        it('56. Rejects response with missing answers for required questions (400)', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [] });
            const res = await respondToSurvey(req, mockParams('1'));
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.message).toContain('Missing answer');
        });

        it('57. Creates response with valid answers', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [{ questionId: 'q1', value: 'val' }] });
            const res = await respondToSurvey(req, mockParams('1'));
            expect(res.status).toBe(200);
            expect(db.response.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ surveyId: '1', answers: { create: [{ questionId: 'q1', value: 'val' }] } })
            }));
        });

        it('58. Updates responseCount on survey table on successful response', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [{ questionId: 'q1', value: 'val' }] });
            await respondToSurvey(req, mockParams('1'));
            expect(db.survey.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: '1' }, data: { responseCount: { increment: 1 } }
            }));
        });

        it('59. Parses ip and user agent headers', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [{ questionId: 'q1', value: 'val' }] }, { 'x-forwarded-for': '12.34.56.78', 'user-agent': 'MyUserAgent 1.0' });
            await respondToSurvey(req, mockParams('1'));
            expect(db.response.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ ipAddress: '12.34.56.78', userAgent: 'MyUserAgent 1.0' })
            }));
        });

        it('60. Handles internal error (500)', async () => {
            const req = mockReq('http://localhost', 'POST', { answers: [{ questionId: 'q1', value: 'val' }] });
            (db.response.create as any).mockRejectedValue(new Error('err'));
            const res = await respondToSurvey(req, mockParams('1'));
            expect(res.status).toBe(500);
        });
    });
});
