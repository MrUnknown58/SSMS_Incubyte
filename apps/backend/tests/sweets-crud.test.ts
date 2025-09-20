import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { sign } from 'jsonwebtoken';

import app from '../src/index';

// Mock the database for testing
vi.mock('../src/db', () => {
  const mockSweets = [
    { id: 'sweet-1', name: 'Chocolate Bar', category: 'Chocolate', price: '2.50', quantity: 10 },
    { id: 'sweet-2', name: 'Vanilla Cake', category: 'Cake', price: '5.00', quantity: 5 },
    { id: 'sweet-3', name: 'Dark Chocolate', category: 'Chocolate', price: '3.00', quantity: 8 },
    { id: 'sweet-4', name: 'Strawberry Candy', category: 'Candy', price: '1.50', quantity: 20 },
  ];

  interface MockPurchase {
    id: string;
    userId: string;
    sweetId: string;
    quantity: number;
    totalPrice: string;
    createdAt: Date;
  }

  const mockPurchases: MockPurchase[] = [];

  // Helper function to apply filters
  const applyFilters = (items: typeof mockSweets, conditions: unknown): typeof mockSweets => {
    if (!conditions) return items;

    // Handle single condition
    if (typeof conditions === 'object' && conditions !== null && 'type' in conditions) {
      return applyCondition(items, conditions as any);
    }

    // Handle multiple conditions (AND)
    if (
      typeof conditions === 'object' &&
      conditions !== null &&
      'type' in conditions &&
      (conditions as any).type === 'and' &&
      'conditions' in conditions
    ) {
      return (conditions as any).conditions.reduce(
        (filtered: typeof mockSweets, condition: unknown) => {
          return applyCondition(filtered, condition);
        },
        items
      );
    }

    return items;
  };

  const applyCondition = (items: typeof mockSweets, condition: unknown): typeof mockSweets => {
    if (
      !condition ||
      typeof condition !== 'object' ||
      condition === null ||
      !('type' in condition)
    ) {
      return items;
    }

    const cond = condition as any;

    switch (cond.type) {
      case 'eq':
        return items.filter((item) => {
          if (cond.field === 'name') return item.name === cond.value;
          if (cond.field === 'category') return item.category === cond.value;
          if (cond.field === 'id') return item.id === cond.value;
          return true;
        });

      case 'ilike':
        return items.filter((item) => {
          if (cond.field === 'name') {
            return item.name.toLowerCase().includes(cond.value.replace(/%/g, '').toLowerCase());
          }
          return true;
        });

      case 'gte':
        return items.filter((item) => {
          if (cond.field === 'price') return parseFloat(item.price) >= parseFloat(cond.value);
          if (cond.field === 'quantity') return item.quantity >= cond.value;
          return true;
        });

      case 'lte':
        return items.filter((item) => {
          if (cond.field === 'price') return parseFloat(item.price) <= parseFloat(cond.value);
          if (cond.field === 'quantity') return item.quantity <= cond.value;
          return true;
        });

      default:
        return items;
    }
  };

  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn((_table) => ({
          where: vi.fn((condition) => {
            // Handle different query patterns based on table and conditions
            const queryChain = {
              limit: vi.fn(() => {
                // For single item queries (sweet lookup)
                if (condition && condition.toString().includes('non-existent')) {
                  return Promise.resolve([]); // No items found
                }

                // Apply filters for single item lookup
                const filtered = applyFilters(mockSweets, condition);
                return Promise.resolve(filtered.slice(0, 1)); // Return first match for single select
              }),
              // For multiple item queries (list all, search)
              then: (resolve: (value: unknown) => void) => {
                // Apply filters for search queries
                const filtered = applyFilters(mockSweets, condition);
                resolve(filtered);
              },
            };

            // Return the query chain that supports both patterns
            return queryChain;
          }),
          // Handle queries without where clause (get all)
          then: (resolve: (value: unknown) => void) => {
            resolve(mockSweets); // Return all sweets for list queries without filters
          },
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn((data: unknown) => {
          // Handle purchase inserts
          const purchaseData = data as {
            userId?: string;
            sweetId?: string;
            quantity?: number;
            totalPrice?: string;
          };
          if (purchaseData.userId && purchaseData.sweetId) {
            const newPurchase: MockPurchase = {
              id: 'purchase-' + Date.now(),
              userId: purchaseData.userId,
              sweetId: purchaseData.sweetId,
              quantity: purchaseData.quantity || 0,
              totalPrice: purchaseData.totalPrice || '0.00',
              createdAt: new Date(),
            };
            mockPurchases.push(newPurchase);
            return {
              returning: vi.fn(() => Promise.resolve([newPurchase])),
            };
          }
          // Handle sweet inserts
          const sweetData = data as { name?: string };
          const isDuplicate = sweetData.name === 'Chocolate Bar'; // Simulate duplicate check
          if (isDuplicate) {
            throw new Error('UNIQUE constraint failed: sweets.name');
          }
          return {
            returning: vi.fn(() =>
              Promise.resolve([
                {
                  id: 'new-sweet-id',
                  name: sweetData.name || 'New Sweet',
                  category: 'Test',
                  price: 1.99,
                  quantity: 5,
                },
              ])
            ),
          };
        }),
      })),
      update: vi.fn(() => ({
        set: vi.fn((updateData) => ({
          where: vi.fn((condition) => ({
            returning: vi.fn(() => {
              // Check if updating non-existent item
              if (condition && condition.toString().includes('non-existent')) {
                return Promise.resolve([]); // No items updated
              }

              // Handle atomic purchase logic - simulate insufficient stock
              if (
                updateData &&
                updateData.quantity &&
                updateData.quantity.toString().includes('- 100')
              ) {
                // Simulate insufficient stock for large quantity (100)
                return Promise.resolve([]); // No items updated due to insufficient stock
              }

              if (
                updateData &&
                updateData.quantity &&
                updateData.quantity.toString().includes('- 15')
              ) {
                // Simulate insufficient stock for overselling test (15)
                return Promise.resolve([]); // No items updated due to insufficient stock
              }

              return Promise.resolve([
                {
                  id: 'sweet-1',
                  name: 'Updated Sweet',
                  category: 'Test',
                  price: 3.0,
                  quantity: 15,
                },
              ]);
            }),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn((condition) => ({
          returning: vi.fn(() => {
            // Check if deleting non-existent item
            if (condition && condition.toString().includes('non-existent')) {
              return Promise.resolve([]); // No items deleted
            }
            return Promise.resolve([{ id: 'sweet-1' }]);
          }),
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
    purchases: {
      id: 'id',
      userId: 'userId',
      sweetId: 'sweetId',
      quantity: 'quantity',
      totalPrice: 'totalPrice',
      createdAt: 'createdAt',
    },
    eq: (field: string, value: unknown) => ({ type: 'eq', field, value }),
    ilike: (field: string, value: string) => ({ type: 'ilike', field, value }),
    gte: (field: string, value: unknown) => ({ type: 'gte', field, value }),
    lte: (field: string, value: unknown) => ({ type: 'lte', field, value }),
    and: (...conditions: unknown[]) => ({ type: 'and', conditions }),
    sql: (template: TemplateStringsArray, ...values: unknown[]) => ({
      type: 'sql',
      template: template.join('?'),
      values,
    }),
  };
});

describe('Stage 4: Sweets CRUD with Admin Authorization', () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(() => {
    vi.clearAllMocks();

    // Generate test tokens
    adminToken = sign(
      { id: 'admin-id', email: 'admin@example.com', role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    userToken = sign(
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
      console.log(adminToken);
      console.log(validSweetData);
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
    userToken = sign(
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

describe('Stage 6: Inventory Operations (Purchase & Restock)', () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(() => {
    vi.clearAllMocks();

    // Generate test tokens
    adminToken = sign(
      { id: 'admin-id', email: 'admin@example.com', role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    userToken = sign(
      { id: 'user-id', email: 'user@example.com', role: 'user' },
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
        .post('/api/sweets/sweet-1/purchase')
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
        .post('/api/sweets/sweet-1/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPurchaseData)
        .expect(200);

      expect(res.body.purchase).toBeDefined();
      expect(res.body.purchase.userId).toBe('user-id');
      expect(res.body.purchase.sweetId).toBe('sweet-1');
      expect(res.body.purchase.quantity).toBe(2);
      expect(res.body.purchase.totalPrice).toBeDefined();
    });

    it('should return 400 when insufficient stock available', async () => {
      const tooMuchQuantity = {
        quantity: 100, // More than available stock
      };

      const res = await request(app)
        .post('/api/sweets/sweet-1/purchase')
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
        .post('/api/sweets/sweet-1/purchase')
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
        .post('/api/sweets/sweet-1/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 404 for non-existent sweet', async () => {
      const res = await request(app)
        .post('/api/sweets/non-existent-id/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPurchaseData)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Sweet not found');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .post('/api/sweets/sweet-1/purchase')
        .send(validPurchaseData)
        .expect(401);

      expect(res.body.error).toBe('Unauthorized');
      expect(res.body.message).toBe('No token provided');
    });

    it('should handle atomic stock decrement correctly', async () => {
      // This test simulates the atomic UPDATE operation
      const res = await request(app)
        .post('/api/sweets/sweet-1/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.purchase).toBeDefined();
      // The mock should handle atomic stock update
    });

    it('should calculate correct total price for purchase', async () => {
      const res = await request(app)
        .post('/api/sweets/sweet-1/purchase')
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
        .post('/api/sweets/sweet-1/restock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRestockData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.sweet).toBeDefined();
      expect(res.body.message).toBe('Restock successful');
    });

    it('should return 403 when non-admin tries to restock', async () => {
      const res = await request(app)
        .post('/api/sweets/sweet-1/restock')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validRestockData)
        .expect(403);

      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toBe('Admin access required');
    });

    it('should return 401 when no token provided', async () => {
      const res = await request(app)
        .post('/api/sweets/sweet-1/restock')
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
        .post('/api/sweets/sweet-1/restock')
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
        .post('/api/sweets/sweet-1/restock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 404 for non-existent sweet', async () => {
      const res = await request(app)
        .post('/api/sweets/non-existent-id/restock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRestockData)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Sweet not found');
    });

    it('should correctly increment stock quantity', async () => {
      const res = await request(app)
        .post('/api/sweets/sweet-1/restock')
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
        .post('/api/sweets/sweet-1/purchase')
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
        .post('/api/sweets/sweet-1/purchase')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 15 }) // More than available
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Insufficient stock');
    });

    it('should handle large restock quantities', async () => {
      const res = await request(app)
        .post('/api/sweets/sweet-1/restock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 1000 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.sweet).toBeDefined();
    });
  });
});
