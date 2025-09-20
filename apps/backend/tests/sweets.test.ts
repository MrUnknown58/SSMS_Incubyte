import { randomUUID } from 'crypto';

import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { sign } from 'jsonwebtoken';
import request from 'supertest';

import app from '../src/index';
import { db, sweets } from '../src/db';

let testSweetId: string;
const jwtSecret = process.env.JWT_SECRET || 'test-secret';
const validUserId = randomUUID();
const validAdminId = randomUUID();
const testUserEmail = `user+${validUserId}@example.com`;
const testAdminEmail = `admin+${validAdminId}@example.com`;
const userToken = sign({ id: validUserId, email: testUserEmail, isAdmin: false }, jwtSecret, {
  expiresIn: '1h',
});
const adminToken = sign({ id: validAdminId, email: testAdminEmail, isAdmin: true }, jwtSecret, {
  expiresIn: '1h',
});

beforeAll(async () => {
  testSweetId = randomUUID();
  await db.insert(sweets).values({
    id: testSweetId,
    name: 'Test Sweet',
    category: 'Test Category',
    price: '1.99', // decimal as string per schema
    quantity: 10,
    description: 'Dummy sweet for testing',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  // Ensure test user exists for purchase test
  await db.execute(
    `INSERT INTO users (id, email, password, is_admin, name, created_at, updated_at) VALUES ('${validUserId}', '${testUserEmail}', '$2b$10$testhash', false, 'Test User', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;`
  );
  // Ensure admin user exists for admin tests
  await db.execute(
    `INSERT INTO users (id, email, password, is_admin, name, created_at, updated_at) VALUES ('${validAdminId}', '${testAdminEmail}', '$2b$10$testhash', true, 'Admin User', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;`
  );
});

afterAll(async () => {
  // Delete purchases for the test sweet first to avoid FK constraint
  await db.execute(`DELETE FROM purchases WHERE sweet_id = '${testSweetId}'`);
  await db.delete(sweets).where(eq(sweets.id, testSweetId));
});

describe('Sweets endpoints', () => {
  it('GET /api/sweets - authenticated', async () => {
    const res = await request(app)
      .get('/api/sweets')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('sweets');
    expect(Array.isArray(res.body.sweets)).toBe(true);
  });

  it('GET /api/sweets - unauthenticated', async () => {
    const res = await request(app).get('/api/sweets').expect(401);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/sweets - admin', async () => {
    const uniqueSweetName = `Chocolate Chip Cookie ${randomUUID()}`;
    const sweetData = {
      name: uniqueSweetName,
      category: 'Cookies',
      price: 2.99,
      quantity: 50,
      description: 'Delicious homemade chocolate chip cookies',
    };
    const res = await request(app)
      .post('/api/sweets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sweetData)
      .expect(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('sweet');
    expect(res.body.sweet).toHaveProperty('name', sweetData.name);
    expect(res.body.sweet).toHaveProperty('category', sweetData.category);
  });

  it('POST /api/sweets - missing fields', async () => {
    const incompleteData = { name: 'Test Sweet' };
    const res = await request(app)
      .post('/api/sweets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(incompleteData)
      .expect(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('errors');
  });

  it('POST /api/sweets - unauthenticated', async () => {
    const sweetData = { name: 'Test Sweet', category: 'Test', price: 1.99, quantity: 10 };
    const res = await request(app).post('/api/sweets').send(sweetData).expect(401);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /api/sweets/search - by name', async () => {
    const res = await request(app)
      .get('/api/sweets/search?name=chocolate')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('sweets');
  });

  it('GET /api/sweets/search - by category', async () => {
    const res = await request(app)
      .get('/api/sweets/search?category=cookies')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('sweets');
  });

  it('GET /api/sweets/search - by price range', async () => {
    const res = await request(app)
      .get('/api/sweets/search?minPrice=1.00&maxPrice=5.00')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('sweets');
  });

  it('PUT /api/sweets/:id - admin', async () => {
    const updateData = { name: 'Updated Sweet Name', price: 3.99, quantity: 25 };
    const res = await request(app)
      .put(`/api/sweets/${testSweetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateData)
      .expect(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('sweet');
  });

  it('PUT /api/sweets/:id - not found', async () => {
    const updateData = { name: 'Updated Name', price: 1.99, quantity: 0 };
    const invalidId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .put(`/api/sweets/${invalidId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateData)
      .expect(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message');
  });

  it('DELETE /api/sweets/:id - non-admin', async () => {
    const res = await request(app)
      .delete(`/api/sweets/${testSweetId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
    expect(res.body).toHaveProperty('error');
  });
});

it('DELETE /api/sweets/:id - not found', async () => {
  const invalidId = '00000000-0000-0000-0000-000000000000';
  const res = await request(app)
    .delete(`/api/sweets/${invalidId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .expect(404);
  expect(res.body).toHaveProperty('success', false);
  expect(res.body).toHaveProperty('message');
});

it('POST /api/sweets/:id/purchase - valid', async () => {
  const purchaseData = { quantity: 2 };
  const res = await request(app)
    .post(`/api/sweets/${testSweetId}/purchase`)
    .set('Authorization', `Bearer ${userToken}`)
    .send(purchaseData)
    .expect(200);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('purchase');
  expect(res.body).toHaveProperty('message');
});

it('POST /api/sweets/:id/purchase - insufficient stock', async () => {
  const purchaseData = { quantity: 1000 };
  const res = await request(app)
    .post(`/api/sweets/${testSweetId}/purchase`)
    .set('Authorization', `Bearer ${userToken}`)
    .send(purchaseData)
    .expect(400);
  expect(res.body).toHaveProperty('success', false);
  expect(res.body).toHaveProperty('message', 'Insufficient stock');
});

it('POST /api/sweets/:id/restock - admin', async () => {
  const restockData = { quantity: 50 };
  const res = await request(app)
    .post(`/api/sweets/${testSweetId}/restock`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send(restockData)
    .expect(200);
  expect(res.body).toHaveProperty('success', true);
  expect(res.body).toHaveProperty('sweet');
  expect(res.body).toHaveProperty('message');
});

it('POST /api/sweets/:id/restock - non-admin', async () => {
  const restockData = { quantity: 50 };
  const res = await request(app)
    .post(`/api/sweets/${testSweetId}/restock`)
    .set('Authorization', `Bearer ${userToken}`)
    .send(restockData)
    .expect(403);
  expect(res.body).toHaveProperty('error');
});
