// All types and schemas copied from packages/types/src/index.ts
import { z } from 'zod';

export const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  isAdmin: z.boolean().optional().default(false),
});

export const LoginUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const CreateSweetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().min(0, 'Quantity must be non-negative').optional().default(0),
  description: z.string().optional(),
});

export const UpdateSweetSchema = CreateSweetSchema.partial();

export const PurchaseSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const RestockSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const SearchSweetsSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  minPrice: z
    .string()
    .regex(/^[\d]+(\.\d+)?$/, 'Invalid price format')
    .optional(),
  maxPrice: z
    .string()
    .regex(/^[\d]+(\.\d+)?$/, 'Invalid price format')
    .optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
  timestamp: z.string(),
  path: z.string(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
});

export const AuthResponseSchema = z.object({
  success: z.literal(true),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    isAdmin: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  token: z.string(),
});

export const SweetResponseSchema = z.object({
  success: z.literal(true),
  sweet: z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    price: z.string(),
    quantity: z.number(),
    description: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export const SweetsListResponseSchema = z.object({
  success: z.literal(true),
  sweets: z.array(SweetResponseSchema.shape.sweet),
});

export const PurchaseResponseSchema = z.object({
  success: z.literal(true),
  purchase: z.object({
    id: z.string(),
    userId: z.string(),
    sweetId: z.string(),
    quantity: z.number(),
    totalPrice: z.string(),
    createdAt: z.date(),
  }),
  message: z.string(),
});

export type RegisterUser = z.infer<typeof RegisterUserSchema>;
export type LoginUser = z.infer<typeof LoginUserSchema>;
export type CreateSweet = z.infer<typeof CreateSweetSchema>;
export type UpdateSweet = z.infer<typeof UpdateSweetSchema>;
export type Purchase = z.infer<typeof PurchaseSchema>;
export type Restock = z.infer<typeof RestockSchema>;
export type SearchSweets = z.infer<typeof SearchSweetsSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type SweetResponse = z.infer<typeof SweetResponseSchema>;
export type SweetsListResponse = z.infer<typeof SweetsListResponseSchema>;
export type PurchaseResponse = z.infer<typeof PurchaseResponseSchema>;

export class ValidationError extends Error {
  details: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    details: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class InsufficientStockError extends Error {
  constructor(message: string = 'Insufficient stock') {
    super(message);
    this.name = 'InsufficientStockError';
  }
}
