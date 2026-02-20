import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getAnalytics } from '@/app/api/surveys/[id]/analytics/route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';

vi.mock('@/lib/db', () => ({
    db: {
        survey: {
            findUnique: vi.fn(),
        }
    }
}));

vi.mock('@/lib/auth', () => ({
    extractTokenFromHeader: vi.fn(),
    getUserFromToken: vi.fn(),
}));

function mockReq(url: string, headers: Record<string, string> = {}) {
    return new NextRequest(url, { headers: new Headers(headers) });
}

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('Analytics API Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (extractTokenFromHeader as any).mockReturnValue('valid-token');
        (getUserFromToken as any).mockResolvedValue({ id: 'author-id' });
    });

    const createMockSurvey = (overrides = {}) => ({
        id: 's1',
        authorId: 'author-id',
        title: 'Mock Survey',
        status: 'published',
        createdAt: new Date(),
        publishedAt: new Date(),
        responseCount: 10,
        viewCount: 20,
        questions: [],
        responses: [],
        ...overrides
    });

    describe('GET /api/surveys/[id]/analytics - Auth & Basics', () => {
        it('1. Rejects missing token (401)', async () => {
            (extractTokenFromHeader as any).mockReturnValue(null);
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            expect(res.status).toBe(401);
        });

        it('2. Rejects invalid token (401)', async () => {
            (getUserFromToken as any).mockResolvedValue(null);
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            expect(res.status).toBe(401);
        });

        it('3. Rejects missing survey (404)', async () => {
            (db.survey.findUnique as any).mockResolvedValue(null);
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            expect(res.status).toBe(404);
        });

        it('4. Rejects unauthorized author (403)', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({ authorId: 'other-user' }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            expect(res.status).toBe(403);
        });

        it('5. Handles internal server error (500)', async () => {
            (db.survey.findUnique as any).mockRejectedValue(new Error('Crash'));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            expect(res.status).toBe(500);
        });

        it('6. Returns 200 with proper basic metadata', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey());
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.data.surveyInfo.title).toBe('Mock Survey');
        });
    });

    describe('GET /api/surveys/[id]/analytics - Metadata Logic', () => {
        it('7. Calculates conversion rate correctly', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({ responseCount: 5, viewCount: 20 }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            expect(data.data.surveyInfo.conversionRate).toBe(25);
        });

        it('8. Handles 0 views for conversion rate gracefully (returns 0)', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({ responseCount: 0, viewCount: 0 }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            expect(data.data.surveyInfo.conversionRate).toBe(0);
        });

        it('9. Returns complete vs partial response counts', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                responses: [
                    { isComplete: true, startedAt: new Date() },
                    { isComplete: true, startedAt: new Date() },
                    { isComplete: false, startedAt: new Date() }
                ]
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            expect(data.data.responseStats.completed).toBe(2);
            expect(data.data.responseStats.partial).toBe(1);
        });

        it('10. Includes survey metadata cleanly', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({ status: 'draft', createdAt: new Date('2026-01-01') }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            expect(data.data.surveyInfo.status).toBe('draft');
            expect(new Date(data.data.surveyInfo.createdAt).toISOString()).toContain('2026-01-01');
        });
    });

    describe('GET /api/surveys/[id]/analytics - Timeline Generation', () => {
        it('11. Fills responsesTimeline accurately', async () => {
            const d1 = new Date(); d1.setDate(d1.getDate() - 1);
            const d2 = new Date(); d2.setDate(d2.getDate() - 2);
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                responses: [
                    { startedAt: d1, isComplete: true },
                    { startedAt: d1, isComplete: false },
                    { startedAt: d2, isComplete: true }
                ]
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const d1Key = d1.toISOString().split('T')[0];
            const d2Key = d2.toISOString().split('T')[0];
            expect(data.data.responsesTimeline[d1Key]).toBe(2);
            expect(data.data.responsesTimeline[d2Key]).toBe(1);
        });

        it('12. Filters timeline by default 30 days window', async () => {
            const dOld = new Date(); dOld.setDate(dOld.getDate() - 40);
            const dNew = new Date();
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                responses: [
                    { startedAt: dOld, isComplete: true },
                    { startedAt: dNew, isComplete: true }
                ]
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const newKey = dNew.toISOString().split('T')[0];
            const oldKey = dOld.toISOString().split('T')[0];
            expect(data.data.responsesTimeline[newKey]).toBe(1);
            expect(data.data.responsesTimeline[oldKey]).toBeUndefined();
        });

        it('13. Filters timeline based on custom days parameter', async () => {
            const dOld = new Date(); dOld.setDate(dOld.getDate() - 15);
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                responses: [{ startedAt: dOld, isComplete: true }]
            }));
            // Should filter out 15 days if days=10
            let req = mockReq('http://localhost/api?days=10');
            let res = await getAnalytics(req, mockParams('1'));
            let data = await res.json();
            let oldKey = dOld.toISOString().split('T')[0];
            expect(data.data.responsesTimeline[oldKey]).toBeUndefined();

            req = mockReq('http://localhost/api?days=20');
            res = await getAnalytics(req, mockParams('1'));
            data = await res.json();
            expect(data.data.responsesTimeline[oldKey]).toBe(1);
        });

        it('14. Ignores empty dates if any (although DB asserts startsAt)', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                responses: []
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            expect(Object.keys(data.data.responsesTimeline).length).toBe(0);
        });
    });

    describe('GET /api/surveys/[id]/analytics - Multiple Choice', () => {
        it('15. Aggregates option counts accurately', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'multipleChoice', options: JSON.stringify(['A', 'B']) }],
                responses: [
                    { answers: [{ questionId: 'q1', value: 'A' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: 'B' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: 'A' }], startedAt: new Date(), isComplete: true }
                ]
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const mcData = data.data.questionAnalytics[0];
            expect(mcData.optionCounts['A']).toBe(2);
            expect(mcData.optionCounts['B']).toBe(1);
        });

        it('16. Includes zero counts for options with no answers', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'multipleChoice', options: JSON.stringify(['A', 'B', 'C']) }],
                responses: [
                    { answers: [{ questionId: 'q1', value: 'A' }], startedAt: new Date(), isComplete: true }
                ]
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const mcData = data.data.questionAnalytics[0];
            expect(mcData.optionCounts['A']).toBe(1);
            expect(mcData.optionCounts['B']).toBe(0);
            expect(mcData.optionCounts['C']).toBe(0);
        });

        it('17. Handles multiple choice gracefully if options string is malformed or missing', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'multipleChoice', options: null }],
                responses: []
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.data.questionAnalytics[0].optionCounts).toBeUndefined();
        });

        it('18. Tracks multipleChoice invalid option inputs by safely ignoring them in counts', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'multipleChoice', options: JSON.stringify(['A']) }],
                responses: [{ answers: [{ questionId: 'q1', value: 'Invalid' }], startedAt: new Date(), isComplete: true }]
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const mcData = data.data.questionAnalytics[0];
            expect(mcData.optionCounts['A']).toBe(0);
            expect(mcData.optionCounts['Invalid']).toBeUndefined();
        });
    });

    describe('GET /api/surveys/[id]/analytics - Rating', () => {
        it('19. Calculates rating max, min, average correctly', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'rating' }],
                responses: [
                    { answers: [{ questionId: 'q1', value: '2' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: '4' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: '5' }], startedAt: new Date(), isComplete: true }
                ]
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const rtData = data.data.questionAnalytics[0];
            expect(rtData.average).toBeCloseTo((2 + 4 + 5) / 3);
            expect(rtData.min).toBe(2);
            expect(rtData.max).toBe(5);
        });

        it('20. Distribution graph tracks counts of each rating correctly', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'rating' }],
                responses: [
                    { answers: [{ questionId: 'q1', value: '4' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: '4' }], startedAt: new Date(), isComplete: true }
                ]
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const rtData = data.data.questionAnalytics[0];
            expect(rtData.distribution['4']).toBe(2);
        });

        it('21. Ignores NaN values safely in ratings', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'rating' }],
                responses: [
                    { answers: [{ questionId: 'q1', value: 'bad' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: '3' }], startedAt: new Date(), isComplete: true }
                ]
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const rtData = data.data.questionAnalytics[0];
            expect(rtData.average).toBe(3);
            expect(rtData.totalResponses).toBe(2); // Still counts as response
        });

        it('22. Handles empty rating data gracefully without average calculations failing', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'rating' }],
                responses: []
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const rtData = data.data.questionAnalytics[0];
            expect(rtData.average).toBeUndefined();
            expect(rtData.min).toBeUndefined();
            expect(rtData.max).toBeUndefined();
        });
    });

    describe('GET /api/surveys/[id]/analytics - YesNo', () => {
        it('23. Counts YES and NO values correctly', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'yesNo' }],
                responses: [
                    { answers: [{ questionId: 'q1', value: 'yes' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: 'True' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: 'No' }], startedAt: new Date(), isComplete: true }
                ]
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const ynData = data.data.questionAnalytics[0];
            expect(ynData.yesCount).toBe(2);
            expect(ynData.noCount).toBe(1);
        });

        it('24. Calculates Yes percentage properly', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'yesNo' }],
                responses: [
                    { answers: [{ questionId: 'q1', value: 'Yes' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: 'No' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: 'No' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: 'No' }], startedAt: new Date(), isComplete: true }
                ]
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const ynData = data.data.questionAnalytics[0];
            expect(ynData.yesPercentage).toBe(25);
        });

        it('25. Handles division explicitly securely by returning 0 percentage without erroring for 0 answers', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'yesNo' }],
                responses: []
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const ynData = data.data.questionAnalytics[0];
            expect(ynData.yesPercentage).toBe(0);
        });
    });

    describe('GET /api/surveys/[id]/analytics - Text Formats', () => {
        it('26. Exposes top 10 recent short texts correctly', async () => {
            const responses = Array.from({ length: 15 }, (_, i) => ({ answers: [{ questionId: 'q1', value: `V-${i}` }], startedAt: new Date(), isComplete: true }));
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'shortText' }],
                responses
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const textData = data.data.questionAnalytics[0];
            expect(textData.responses.length).toBe(10);
        });

        it('27. Tracks unique texts properly across fields', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'email' }],
                responses: [
                    { answers: [{ questionId: 'q1', value: 'a@a.com' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: 'a@a.com' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: 'b@b.com' }], startedAt: new Date(), isComplete: true }
                ]
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const textData = data.data.questionAnalytics[0];
            expect(textData.uniqueResponses).toBe(2);
        });
    });

    describe('GET /api/surveys/[id]/analytics - Date Data', () => {
        it('28. Aggregates earliest vs latest dates', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'date' }],
                responses: [
                    { answers: [{ questionId: 'q1', value: '2026-05-01' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: '2025-01-01' }], startedAt: new Date(), isComplete: true },
                    { answers: [{ questionId: 'q1', value: '2026-07-02' }], startedAt: new Date(), isComplete: true }
                ]
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const dateData = data.data.questionAnalytics[0];
            expect(dateData.dateRange.earliest).toBe('2025-01-01');
            expect(dateData.dateRange.latest).toBe('2026-07-02');
        });

        it('29. Safely skips empty date arrays', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'date' }],
                responses: []
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const dateData = data.data.questionAnalytics[0];
            expect(dateData.dateRange).toBeUndefined();
        });

        it('30. Sets identical date for same inputs', async () => {
            (db.survey.findUnique as any).mockResolvedValue(createMockSurvey({
                questions: [{ id: 'q1', type: 'date' }],
                responses: [{ answers: [{ questionId: 'q1', value: '2022-01-01' }], startedAt: new Date(), isComplete: true }]
            }));
            const req = mockReq('http://localhost/api');
            const res = await getAnalytics(req, mockParams('1'));
            const data = await res.json();
            const dateData = data.data.questionAnalytics[0];
            expect(dateData.dateRange.earliest).toBe('2022-01-01');
            expect(dateData.dateRange.latest).toBe('2022-01-01');
        });
    });
});
