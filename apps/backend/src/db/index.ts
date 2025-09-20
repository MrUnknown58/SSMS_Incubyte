import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

import * as schema from './schema';

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Get database URL from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create SQL client using Neon serverless driver
const sql = neon(databaseUrl);

// Create Drizzle instance with schema
export const db = drizzle(sql, { schema });

// Export schema for convenience
export * from './schema';
