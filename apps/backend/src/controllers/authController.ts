import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { eq } from 'drizzle-orm';

import { db, users, type NewUser } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Generate JWT token
const generateToken = (userId: string, email: string, isAdmin: boolean) => {
  return sign({ userId, email, isAdmin }, JWT_SECRET, { expiresIn: '24h' });
};

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser: NewUser = {
      email,
      password: hashedPassword,
      name,
      isAdmin: false,
    };

    const [createdUser] = await db.insert(users).values(newUser).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    });

    // Generate JWT token
    const token = generateToken(createdUser.id, createdUser.email, createdUser.isAdmin);

    res.status(201).json({
      success: true,
      user: createdUser,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.isAdmin);

    // Return user data (without password)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
