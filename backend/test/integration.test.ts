import request from 'supertest';
import app from '../src/index';

describe('Auth API', () => {
    it('should return 401 for missing token', async () => {
        const res = await request(app).get('/api/surveys');
        expect(res.statusCode).toEqual(401);
    });

    it('should health check pass', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('ok');
    });
});
