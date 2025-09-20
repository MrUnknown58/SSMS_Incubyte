import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import app from '../src/index';

// Mock the database for testing
vi.mock('../src/db', () => {
  const mockSweets = [
    { id: 'sweet-1', name: 'Chocolate Bar', category: 'Chocolate', price: 2.5, quantity: 10 },
    { id: 'sweet-2', name: 'Vanilla Cake', category: 'Cake', price: 5.0, quantity: 5 },
    { id: 'sweet-3', name: 'Dark Chocolate', category: 'Chocolate', price: 3.0, quantity: 8 },
    { id: 'sweet-4', name: 'Strawberry Candy', category: 'Candy', price: 1.5, quantity: 20 },
  ];

  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve(mockSweets)),
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
        name: 'Chocolate Bar', // This name already exists in mock data
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

describe('Stage 5: Sweets List & Search', () => {
  let userToken: string;

  beforeEach(() => {
    vi.clearAllMocks();

    // Generate test token (search should be available to all authenticated users)
    userToken = jwt.sign(
      { id: 'user-id', email: 'user@example.com', role: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/sweets - List All Sweets', () => {
    it('should return all sweets for authenticated user', async () => {
      const res = await request(app)
        .get('/api/sweets')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.sweets).toBeDefined();
      expect(Array.isArray(res.body.sweets)).toBe(true);
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app).get('/api/sweets').expect(401);

      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toBe('No token provided');
    });
  });

  describe('GET /api/sweets/search - Search with Filters', () => {
    it('should search by name (case-insensitive substring)', async () => {
      const res = await request(app)
        .get('/api/sweets/search?name=chocolate')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.sweets).toBeDefined();
      expect(Array.isArray(res.body.sweets)).toBe(true);
    });

    it('should search by category', async () => {
      const res = await request(app)
        .get('/api/sweets/search?category=Chocolate')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.sweets).toBeDefined();
    });

    it('should search by minimum price', async () => {
      const res = await request(app)
        .get('/api/sweets/search?minPrice=2.0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.sweets).toBeDefined();
    });

    it('should search by maximum price', async () => {
      const res = await request(app)
        .get('/api/sweets/search?maxPrice=3.0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.sweets).toBeDefined();
    });

    it('should search by price range (minPrice and maxPrice)', async () => {
      const res = await request(app)
        .get('/api/sweets/search?minPrice=2.0&maxPrice=4.0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.sweets).toBeDefined();
    });

    it('should combine multiple filters (name, category, price)', async () => {
      const res = await request(app)
        .get('/api/sweets/search?name=chocolate&category=Chocolate&minPrice=2.0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.sweets).toBeDefined();
    });

    it('should return empty array when no matches found', async () => {
      const res = await request(app)
        .get('/api/sweets/search?name=nonexistent')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.sweets).toEqual([]);
    });

    it('should return 400 for invalid price parameters', async () => {
      const res = await request(app)
        .get('/api/sweets/search?minPrice=invalid')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid');
    });

    it('should return 400 when minPrice > maxPrice', async () => {
      const res = await request(app)
        .get('/api/sweets/search?minPrice=5.0&maxPrice=2.0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('minimum price cannot be greater than maximum price');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app).get('/api/sweets/search?name=chocolate').expect(401);

      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toBe('No token provided');
    });
  });
});
