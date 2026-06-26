const authorize = require('../../src/middleware/rbac');
const validate = require('../../src/middleware/validate');
const Joi = require('joi');

const run = (mw, req) => new Promise((res) => mw(req, {}, (err) => res(err)));

describe('rbac', () => {
  test('allows matching role', async () => {
    const err = await run(authorize('admin'), { user: { role: 'admin' } });
    expect(err).toBeUndefined();
  });
  test('blocks mismatched role with 403', async () => {
    const err = await run(authorize('admin'), { user: { role: 'front_desk' } });
    expect(err.statusCode).toBe(403);
  });
  test('blocks missing user with 401', async () => {
    const err = await run(authorize('admin'), {});
    expect(err.statusCode).toBe(401);
  });
});

describe('validate', () => {
  const schema = Joi.object({ email: Joi.string().email().required() });
  test('passes valid body', async () => {
    const req = { body: { email: 'a@b.com' } };
    const err = await run(validate(schema), req);
    expect(err).toBeUndefined();
  });
  test('rejects invalid body with details', async () => {
    const req = { body: { email: 'nope' } };
    const err = await run(validate(schema), req);
    expect(err.statusCode).toBe(400);
    expect(err.details[0].field).toBe('email');
  });
});
