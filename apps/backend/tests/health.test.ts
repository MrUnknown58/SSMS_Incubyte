import { describe, it, expect } from 'vitest';
import request from 'supertest';

import app from '../src/index';

describe('Health endpoint', () => {
  it('should return 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200); // RED: will fail until route added
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(res.body.timestamp).toBeDefined();
  });
});
