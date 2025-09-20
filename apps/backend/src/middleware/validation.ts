import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import {
  RegisterUserSchema,
  LoginUserSchema,
  CreateSweetSchema,
  UpdateSweetSchema,
  PurchaseSchema,
  RestockSchema,
  SearchSweetsSchema,
} from '@sweet-shop/types';

// Generic Zod validation middleware
export const validateSchema = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request body
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Pass Zod error to error handler middleware
        next(error);
      } else {
        next(new Error('Validation failed'));
      }
    }
  };
};

// Query parameter validation middleware
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the query parameters
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Pass Zod error to error handler middleware
        next(error);
      } else {
        next(new Error('Query validation failed'));
      }
    }
  };
};

// Specific validation middleware for each endpoint
export const validateRegister = validateSchema(RegisterUserSchema);
export const validateLogin = validateSchema(LoginUserSchema);
export const validateCreateSweet = validateSchema(CreateSweetSchema);
export const validateUpdateSweet = validateSchema(UpdateSweetSchema);
export const validatePurchase = validateSchema(PurchaseSchema);
export const validateRestock = validateSchema(RestockSchema);
export const validateSearchQuery = validateQuery(SearchSweetsSchema);
