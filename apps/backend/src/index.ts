import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import sweetsRoutes from './routes/sweets';
import testRoutes from './routes/test';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Allow frontend connection
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting for auth endpoints (disabled in test environment)
const authLimiter =
  process.env.NODE_ENV === 'test'
    ? (_req: express.Request, _res: express.Response, next: express.NextFunction) => next() // Skip rate limiting in tests
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 requests per windowMs
        message: {
          success: false,
          error: 'Too Many Requests',
          message: 'Too many authentication attempts, please try again later',
          timestamp: new Date().toISOString(),
          path: '/api/auth',
        },
        standardHeaders: true,
        legacyHeaders: false,
      });

// General rate limiting (disabled in test environment)
const generalLimiter =
  process.env.NODE_ENV === 'test'
    ? (_req: express.Request, _res: express.Response, next: express.NextFunction) => next() // Skip rate limiting in tests
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: {
          success: false,
          error: 'Too Many Requests',
          message: 'Too many requests, please try again later',
          timestamp: new Date().toISOString(),
          path: '',
        },
        standardHeaders: true,
        legacyHeaders: false,
      });

app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

// API routes with specific rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/sweets', sweetsRoutes);
app.use('/api/test', testRoutes);

// Health route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorHandler);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`🔒 Secure backend listening on http://localhost:${port}`);
  });
}

export default app;
