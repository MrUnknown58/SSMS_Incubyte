import express from 'express';

import authRoutes from './routes/auth';
import sweetsRoutes from './routes/sweets';
import testRoutes from './routes/test';

const app = express();
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sweets', sweetsRoutes);
app.use('/api/test', testRoutes);

// Health route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

export default app;
