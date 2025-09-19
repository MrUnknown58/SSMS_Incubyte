import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Extend Request interface to include user data
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    isAdmin: boolean;
  };
}

// JWT authentication middleware
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
    return;
  }

  try {
    const decoded = verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      isAdmin: boolean;
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

// Admin authorization middleware (requires authenticateToken first)
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.isAdmin) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
    return;
  }
  next();
};
