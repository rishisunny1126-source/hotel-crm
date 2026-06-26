/* API tests — require a running PostgreSQL (DATABASE_URL). Skipped otherwise. */
const request = require('supertest');
const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb('Auth & RBAC API', () => {
  let app, token;
  beforeAll(() => { app = require('../../src/app'); });

  test('POST /api/auth/login rejects bad credentials', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'admin@hotel.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login returns tokens for seeded admin', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'admin@hotel.com', password: 'Password@123' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    token = res.body.data.accessToken;
  });

  test('GET /api/enquiries requires auth', async () => {
    const res = await request(app).get('/api/enquiries');
    expect(res.status).toBe(401);
  });

  test('GET /api/enquiries works with token', async () => {
    const res = await request(app).get('/api/enquiries')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('validation rejects malformed enquiry', async () => {
    const res = await request(app).post('/api/enquiries')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  test('front_desk cannot create rooms (RBAC 403)', async () => {
    const login = await request(app).post('/api/auth/login')
      .send({ email: 'frontdesk@hotel.com', password: 'Password@123' });
    const res = await request(app).post('/api/rooms')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .send({ room_number: 'X1', room_type: 'Standard', capacity: 2, rate: 1000 });
    expect(res.status).toBe(403);
  });
});
