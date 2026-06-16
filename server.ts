import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRouter from './src/routes/api';
import { startCronJobs } from './src/cron';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 1. Enable standard cross-compatibility middle-layers
  app.use(cors());
  app.use(express.json());

  // 2. Register REST API Routing controllers
  app.use('/api', apiRouter);

  // 3. Initiate scheduled Node-Cron jobs & statistics seeds
  startCronJobs();

  // 4. Integrate Vite Middleware (or compile server-hosting in production)
  if (process.env.NODE_ENV !== "production") {
    console.log('[EXPRESS SERVER]: Booting Vite middleware handler (Development)...');
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(viteInstance.middlewares);
  } else {
    console.log('[EXPRESS SERVER]: Binding compiled static directories (Production)...');
    const distFolder = path.join(process.cwd(), 'dist');
    app.use(express.static(distFolder));
    
    // Serve client runtime fallback page
    app.get('*', (req, res) => {
      res.sendFile(path.join(distFolder, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EXPRESS SERVER]: Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('[EXPRESS SERVER FATAL STARTUP FAILURE]:', error);
});
