const request = require('supertest');
const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb('Booking conflict prevention', () => {
  let app, token, roomId, guestId;
  beforeAll(async () => {
    app = require('../../src/app');
    const login = await request(app).post('/api/auth/login')
      .send({ email: 'admin@hotel.com', password: 'Password@123' });
    token = login.body.data.accessToken;
    const rooms = await request(app).get('/api/rooms').set('Authorization', `Bearer ${token}`);
    roomId = rooms.body.data[0].id;
    const guests = await request(app).get('/api/guests').set('Authorization', `Bearer ${token}`);
    guestId = guests.body.data[0].id;
  });

  test('second overlapping booking is rejected with 409', async () => {
    const body = { guest_id: guestId, room_id: roomId,
      check_in_date: '2030-01-10', check_out_date: '2030-01-15', amount: 5000 };
    const first = await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${token}`).send(body);
    expect([201, 409]).toContain(first.status);
    const second = await request(app).post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...body, check_in_date: '2030-01-12', check_out_date: '2030-01-14' });
    expect(second.status).toBe(409);
  });
});
