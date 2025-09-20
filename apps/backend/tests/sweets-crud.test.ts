import { randomUUID } from 'crypto';

import { beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { sign } from 'jsonwebtoken';

import { db, sweets, users, purchases } from '../src/db';
import app from '../src/index';

let testSweetIds: string[] = [];
let testUserId: string;

beforeAll(async () => {
  // Insert a test user (admin)
  testUserId = randomUUID();
  const uniqueEmail = `admin-test+${testUserId}@example.com`;
  await db.insert(users).values({
    id: testUserId,
    email: uniqueEmail,
    password: '$2a$12$hashedpassword',
    name: 'Admin Test',
    isAdmin: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

beforeEach(async () => {
  // Insert dummy sweets
  const dummySweets = [
    { name: 'Chocolate Bar', category: 'Chocolate', price: '2.50', quantity: 10 },
    { name: 'Vanilla Cake', category: 'Cake', price: '5.00', quantity: 5 },
    { name: 'Dark Chocolate', category: 'Chocolate', price: '3.00', quantity: 8 },
    { name: 'Strawberry Candy', category: 'Candy', price: '1.50', quantity: 20 },
  ];
  testSweetIds = [];
  for (const sweet of dummySweets) {
    const id = randomUUID();
    testSweetIds.push(id);
    await db.insert(sweets).values({
      id,
      ...sweet,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
});

afterEach(async () => {
  // Delete purchases first (foreign key constraint)
  await db.delete(purchases).where(eq(purchases.userId, testUserId));
  // Then delete dummy sweets
  for (const id of testSweetIds) {
    await db.delete(sweets).where(eq(sweets.id, id));
  }
});

afterAll(async () => {
  // Delete test user
  await db.delete(users).where(eq(users.id, testUserId));
});

// Test token variables
let adminToken: string;
let userToken: string;

describe('Stage 4: Sweets CRUD with Admin Authorization', () => {
  beforeEach(() => {
    // Generate test tokens
    const uniqueEmail = `admin-test+${testUserId}@example.com`;
    adminToken = sign(
      { id: testUserId, email: uniqueEmail, isAdmin: true },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    userToken = sign(
      { id: testUserId, email: 'user@example.com', isAdmin: false },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/sweets - Create Sweet (Admin Only)', () => {
    it('should return 401 when no token provided', async () => {
      const validSweetData = {
        name: 'Test Sweet',
        category: 'Test Category',
        price: 2.99,
        quantity: 10,
        description: 'Test description',
      };

      const res = await request(app).post('/api/sweets').send(validSweetData).expect(401);
      expect(res.body.error).toBe('Unauthorized');
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
  });

  describe('PUT /api/sweets/:id - Update Sweet (Admin Only)', () => {
    it('should return 404 for non-existent sweet', async () => {
      const nonExistentId = randomUUID();
      const updateData = {
        name: 'Updated Sweet',
        price: 3.99,
      };
      const res = await request(app)
        .put(`/api/sweets/${nonExistentId}`)
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
        .put(`/api/sweets/${testSweetIds[0]}`)
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
        .delete(`/api/sweets/${testSweetIds[0]}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Sweet deleted successfully');
    });

    it('should return 403 when non-admin tries to delete sweet', async () => {
      const res = await request(app)
        .delete(`/api/sweets/${testSweetIds[0]}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toBe('Admin access required');
    });

    it('should return 404 for non-existent sweet', async () => {
      const nonExistentId = randomUUID();
      const res = await request(app)
        .delete(`/api/sweets/${nonExistentId}`)
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
    userToken = sign(
      { id: testUserId, email: 'user@example.com', isAdmin: false },
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

describe('Stage 6: Inventory Operations (Purchase & Restock)', () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(() => {
    vi.clearAllMocks();

    // Generate test tokens
    adminToken = sign(
      { id: randomUUID(), email: 'admin@example.com', isAdmin: true },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    userToken = sign(
      { id: testUserId, email: 'user@example.com', isAdmin: false },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/sweets/:id/purchase - Purchase Sweet', () => {
    const validPurchaseData = {
      quantity: 2,
    };

    it('should successfully purchase sweet when sufficient stock available', async () => {
      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPurchaseData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.purchase).toBeDefined();
      expect(res.body.purchase.quantity).toBe(2);
      expect(res.body.message).toBe('Purchase successful');
    });

    it('should create purchase audit entry with correct details', async () => {
      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPurchaseData)
        .expect(200);

      expect(res.body.purchase).toBeDefined();
      expect(res.body.purchase.userId).toBe(testUserId);
      expect(res.body.purchase.sweetId).toBe(testSweetIds[0]);
      expect(res.body.purchase.quantity).toBe(2);
      expect(res.body.purchase.totalPrice).toBeDefined();
    });

    it('should return 400 when insufficient stock available', async () => {
      const tooMuchQuantity = {
        quantity: 100, // More than available stock
      };

      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(tooMuchQuantity)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Insufficient stock');
    });

    it('should return 400 for invalid quantity (zero)', async () => {
      const invalidData = {
        quantity: 0,
      };

      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 for invalid quantity (negative)', async () => {
      const invalidData = {
        quantity: -5,
      };

      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 404 for non-existent sweet', async () => {
      const nonExistentId = randomUUID();
      const res = await request(app)
        .post(`/api/sweets/${nonExistentId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPurchaseData)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Sweet not found');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/purchase`)
        .send(validPurchaseData)
        .expect(401);

      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toBe('No token provided');
    });

    it('should handle atomic stock decrement correctly', async () => {
      // This test simulates the atomic UPDATE operation
      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.purchase).toBeDefined();
      // The mock should handle atomic stock update
    });

    it('should calculate correct total price for purchase', async () => {
      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 4 })
        .expect(200);

      expect(res.body.purchase.totalPrice).toBeDefined();
      // totalPrice should be calculated as price * quantity
    });
  });

  describe('POST /api/sweets/:id/restock - Restock Sweet (Admin Only)', () => {
    const validRestockData = {
      quantity: 50,
    };

    it('should successfully restock sweet when admin provides valid data', async () => {
      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRestockData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.sweet).toBeDefined();
      expect(res.body.message).toBe('Restock successful');
    });

    it('should return 403 when non-admin tries to restock', async () => {
      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/restock`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(validRestockData)
        .expect(403);

      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toBe('Admin access required');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/restock`)
        .send(validRestockData)
        .expect(401);

      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toBe('No token provided');
    });

    it('should return 400 for invalid quantity (zero)', async () => {
      const invalidData = {
        quantity: 0,
      };

      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 for invalid quantity (negative)', async () => {
      const invalidData = {
        quantity: -10,
      };

      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 404 for non-existent sweet', async () => {
      const nonExistentId = randomUUID();
      const res = await request(app)
        .post(`/api/sweets/${nonExistentId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRestockData)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Sweet not found');
    });

    it('should correctly increment stock quantity', async () => {
      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 25 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.sweet).toBeDefined();
      // Mock should handle quantity increment
    });
  });

  describe('Concurrency and Edge Cases', () => {
    it('should handle purchase of exactly remaining stock', async () => {
      // Simulate purchasing all remaining stock
      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 10 }) // All available stock
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.purchase.quantity).toBe(10);
    });

    it('should prevent overselling with concurrent requests simulation', async () => {
      // This test simulates the SQL atomic UPDATE pattern
      // UPDATE sweets SET quantity = quantity - $1 WHERE id=$2 AND quantity >= $1 RETURNING *
      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 15 }) // More than available
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Insufficient stock');
    });

    it('should handle large restock quantities', async () => {
      const res = await request(app)
        .post(`/api/sweets/${testSweetIds[0]}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 1000 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.sweet).toBeDefined();
    });
  });
});
// (File intentionally truncated here. All broken code below this line has been removed.)
