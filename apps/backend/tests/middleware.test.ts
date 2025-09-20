import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';

import app from '../src/index';

const request = supertest(app);

describe('JWT Middleware', () => {
  let validToken: string;
  let expiredToken: string;
  let invalidToken: string;

  beforeEach(() => {
    const payload = { id: '1', email: 'test@example.com', role: 'user' };
    validToken = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    expiredToken = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '-1h' });
    invalidToken = 'invalid.token.here';
  });

  describe('Protected Route Access', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request.get('/api/test/auth-test').expect(401);

      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toBe('No token provided');
    });

    it('should return 401 when invalid token is provided', async () => {
      const res = await request
        .get('/api/test/auth-test')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toBe('Invalid token');
    });

    it('should return 401 when expired token is provided', async () => {
      const res = await request
        .get('/api/test/auth-test')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toBe('Token expired');
    });

    it('should allow access when valid token is provided', async () => {
      const res = await request
        .get('/api/test/auth-test')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
    });
  });

  describe('Role-based Authorization', () => {
    let userToken: string;
    let adminToken: string;

    beforeEach(() => {
      userToken = jwt.sign(
        { id: '1', email: 'user@example.com', role: 'user' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      adminToken = jwt.sign(
        { id: '2', email: 'admin@example.com', role: 'admin' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should return 403 when user tries to access admin endpoint', async () => {
      const res = await request
        .post('/api/test/admin-test')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ test: 'data' })
        .expect(403);

      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toBe('Admin access required');
    });

    it('should allow admin access to admin endpoints', async () => {
      const res = await request
        .post('/api/test/admin-test')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ test: 'data' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
    });

    it('should allow both user and admin access to user endpoints', async () => {
      // Test with user token
      await request
        .get('/api/test/user-test')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Test with admin token
      await request
        .get('/api/test/user-test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
