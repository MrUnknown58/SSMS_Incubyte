import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

import app from '../src/index';

// Mock the database connection to avoid real database calls during tests
vi.mock('../src/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  users: {
    email: 'email',
    password: 'password',
    name: 'name',
    isAdmin: 'isAdmin',
  },
}));

describe('Authentication endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const res = await request(app).post('/api/auth/register').send(userData).expect(201); // RED: This will fail until endpoint is implemented

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', userData.email);
      expect(res.body.user).toHaveProperty('name', userData.name);
      expect(res.body.user).not.toHaveProperty('password'); // Password should not be returned
    });

    it('should return 400 for missing email', async () => {
      const userData = {
        password: 'password123',
        name: 'Test User',
      };

      const res = await request(app).post('/api/auth/register').send(userData).expect(400); // RED: This will fail until endpoint is implemented

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      const res = await request(app).post('/api/auth/register').send(userData).expect(400); // RED: This will fail until endpoint is implemented

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 400 for short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      };

      const res = await request(app).post('/api/auth/register').send(userData).expect(400); // RED: This will fail until endpoint is implemented

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const res = await request(app).post('/api/auth/register').send(userData).expect(409); // RED: This will fail until endpoint is implemented

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Email already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const res = await request(app).post('/api/auth/login').send(loginData).expect(200); // RED: This will fail until endpoint is implemented

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', loginData.email);
      expect(res.body.user).not.toHaveProperty('password'); // Password should not be returned
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const res = await request(app).post('/api/auth/login').send(loginData).expect(401); // RED: This will fail until endpoint is implemented

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const res = await request(app).post('/api/auth/login').send(loginData).expect(401); // RED: This will fail until endpoint is implemented

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 400 for missing email', async () => {
      const loginData = {
        password: 'password123',
      };

      const res = await request(app).post('/api/auth/login').send(loginData).expect(400); // RED: This will fail until endpoint is implemented

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 400 for missing password', async () => {
      const loginData = {
        email: 'test@example.com',
      };

      const res = await request(app).post('/api/auth/login').send(loginData).expect(400); // RED: This will fail until endpoint is implemented

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errors');
    });
  });
});
