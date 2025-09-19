import express from 'express';

const app = express();
app.use(express.json());

// NOTE: health route intentionally NOT implemented yet (for RED test)
// Implementing health route (Stage 1: GREEN)
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
