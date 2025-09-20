import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InsufficientStockError,
  ErrorResponse,
} from '@sweet-shop/types';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  const path = req.originalUrl;

  // Default error response
  let statusCode = 500;
  let errorType = 'Internal Server Error';
  let message = 'An unexpected error occurred';
  let details: Array<{ field: string; message: string }> | undefined;

  // Handle specific error types
  if (error instanceof ZodError) {
    statusCode = 400;
    errorType = 'Validation Error';
    message = 'Request validation failed';
    details = error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  } else if (error instanceof ValidationError) {
    statusCode = 400;
    errorType = 'Validation Error';
    message = error.message;
    details = error.details;
  } else if (error instanceof AuthenticationError) {
    statusCode = 401;
    errorType = 'Unauthorized';
    message = error.message;
  } else if (error instanceof AuthorizationError) {
    statusCode = 403;
    errorType = 'Forbidden';
    message = error.message;
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    errorType = 'Not Found';
    message = error.message;
  } else if (error instanceof ConflictError) {
    statusCode = 409;
    errorType = 'Conflict';
    message = error.message;
  } else if (error instanceof InsufficientStockError) {
    statusCode = 400;
    errorType = 'Bad Request';
    message = error.message;
  } else if (error.message.includes('JWT')) {
    statusCode = 401;
    errorType = 'Unauthorized';
    message = 'Invalid or expired token';
  } else if (error.message.includes('UNIQUE constraint')) {
    statusCode = 409;
    errorType = 'Conflict';
    message = 'Resource already exists';
  }

  // Log error for debugging (exclude in production)
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${timestamp}] ${errorType} - ${path}:`, error);
  }

  // Send standardized error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: errorType,
    message,
    timestamp,
    path,
    ...(details && { details }),
  };

  res.status(statusCode).json(errorResponse);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
