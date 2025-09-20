import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import app from '../src/index';

// Mock the database for testing
vi.mock('../src/db', () => {
  const mockSweets = [
    { id: 'sweet-1', name: 'Existing Sweet', category: 'Test', price: 2.5, quantity: 10 },
  ];

  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn(() =>
            Promise.resolve([
              { id: 'new-sweet-id', name: 'New Sweet', category: 'Test', price: 1.99, quantity: 5 },
            ])
          ),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() =>
              Promise.resolve([
                {
                  id: 'sweet-1',
                  name: 'Updated Sweet',
                  category: 'Test',
                  price: 3.0,
                  quantity: 15,
                },
              ])
            ),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: 'sweet-1' }])),
        })),
      })),
    },
    sweets: {
      id: 'id',
      name: 'name',
      category: 'category',
      price: 'price',
      quantity: 'quantity',
      description: 'description',
    },
  };
});

describe('Stage 4: Sweets CRUD with Admin Authorization', () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(() => {
    vi.clearAllMocks();

    // Generate test tokens
    adminToken = jwt.sign(
      { id: 'admin-id', email: 'admin@example.com', role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { id: 'user-id', email: 'user@example.com', role: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/sweets - Create Sweet (Admin Only)', () => {
    const validSweetData = {
      name: 'New Chocolate Bar',
      category: 'Chocolate',
      price: 3.99,
      quantity: 25,
      description: 'Premium dark chocolate bar',
    };

    it('should create sweet when admin provides valid data', async () => {
      const res = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSweetData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.sweet).toBeDefined();
      expect(res.body.sweet.name).toBe(validSweetData.name);
    });

    it('should return 403 when non-admin tries to create sweet', async () => {
      const res = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validSweetData)
        .expect(403);

      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toBe('Admin access required');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app).post('/api/sweets').send(validSweetData).expect(401);

      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toBe('No token provided');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        name: 'Test Sweet',
        // Missing category, price
      };

      const res = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 409 for duplicate sweet name', async () => {
      const duplicateData = {
        name: 'Existing Sweet', // This name already exists
        category: 'Test',
        price: 1.99,
        quantity: 5,
      };

      const res = await request(app)
        .post('/api/sweets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateData)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('PUT /api/sweets/:id - Update Sweet (Admin Only)', () => {
    const updateData = {
      name: 'Updated Sweet Name',
      price: 4.99,
      quantity: 30,
    };

    it('should update sweet when admin provides valid data', async () => {
      const res = await request(app)
        .put('/api/sweets/sweet-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.sweet).toBeDefined();
    });

    it('should return 403 when non-admin tries to update sweet', async () => {
      const res = await request(app)
        .put('/api/sweets/sweet-1')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toBe('Admin access required');
    });

    it('should return 404 for non-existent sweet', async () => {
      const res = await request(app)
        .put('/api/sweets/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Sweet not found');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        price: -1, // Invalid negative price
        quantity: -5, // Invalid negative quantity
      };

      const res = await request(app)
        .put('/api/sweets/sweet-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/sweets/:id - Delete Sweet (Admin Only)', () => {
    it('should delete sweet when admin requests', async () => {
      const res = await request(app)
        .delete('/api/sweets/sweet-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Sweet deleted successfully');
    });

    it('should return 403 when non-admin tries to delete sweet', async () => {
      const res = await request(app)
        .delete('/api/sweets/sweet-1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toBe('Admin access required');
    });

    it('should return 404 for non-existent sweet', async () => {
      const res = await request(app)
        .delete('/api/sweets/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Sweet not found');
    });
  });
});
