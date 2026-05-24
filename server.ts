import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { LocalDB } from './src/server/db.js';
import apiRouter from './src/server/routes/api.js';

async function startServer() {
  // Initialize and seed local database
  LocalDB.initialize();

  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // Mount central API endpoints
  app.use('/api', apiRouter);

  // Vite middleware for development or Static Asset serving for production builds
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('⚡ Development Mode: Vite middleware mounted');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('📦 Production Mode: Static React files served');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WooCommerce stand-alone admin server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Fatal database/server crash:', error);
});
