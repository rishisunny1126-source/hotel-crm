const { signAccess, verifyAccess, signRefresh, verifyRefresh } = require('../../src/utils/token');
const ApiError = require('../../src/utils/ApiError');

describe('token utils', () => {
  test('access token round-trips payload', () => {
    const t = signAccess({ sub: 'u1', role: 'admin', name: 'A' });
    const d = verifyAccess(t);
    expect(d.sub).toBe('u1');
    expect(d.role).toBe('admin');
  });
  test('refresh token verifies', () => {
    const t = signRefresh({ sub: 'u2' });
    expect(verifyRefresh(t).sub).toBe('u2');
  });
  test('invalid token throws', () => {
    expect(() => verifyAccess('garbage')).toThrow();
  });
});

describe('ApiError', () => {
  test('factory helpers set status codes', () => {
    expect(ApiError.notFound().statusCode).toBe(404);
    expect(ApiError.unauthorized().statusCode).toBe(401);
    expect(ApiError.conflict().statusCode).toBe(409);
    expect(ApiError.badRequest('x', [1]).details).toEqual([1]);
  });
});
