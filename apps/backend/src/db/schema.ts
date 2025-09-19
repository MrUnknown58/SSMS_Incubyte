import { pgTable, text, integer, decimal, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table - for authentication
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // Will store hashed passwords
  name: text('name').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Sweets table - core entity for the shop
export const sweets = pgTable('sweets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(0),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Purchase transactions table - for tracking purchases
export const purchases = pgTable('purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  sweetId: uuid('sweet_id')
    .notNull()
    .references(() => sweets.id),
  quantity: integer('quantity').notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  purchases: many(purchases),
}));

export const sweetsRelations = relations(sweets, ({ many }) => ({
  purchases: many(purchases),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
  sweet: one(sweets, {
    fields: [purchases.sweetId],
    references: [sweets.id],
  }),
}));

// TypeScript types derived from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Sweet = typeof sweets.$inferSelect;
export type NewSweet = typeof sweets.$inferInsert;
export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
