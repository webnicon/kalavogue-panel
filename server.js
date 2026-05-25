import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

const compiledServerPath = path.join(process.cwd(), 'dist', 'server.cjs');

if (fs.existsSync(compiledServerPath)) {
  // Dynamically load the fully compiled production server using file URL protocol for Node ESM
  await import(pathToFileURL(compiledServerPath).href);
} else {
  console.log("--------------------------------------------------");
  console.log("⚠️  Notice: 'dist/server.cjs' was not found yet.");
  console.log("Starting a temporary builder health-check server.");
  console.log("Run 'npm run build' to compile production assets.");
  console.log("--------------------------------------------------");

  // Spin up a graceful fallback web server for Hostinger health checks during compile phases
  try {
    const express = (await import('express')).default;
    const app = express();
    const port = process.env.PORT || 3000;
    
    app.get('*', (req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.status(503).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Application Starting | Kalavogue Dashboard</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #090d16; color: #cbd5e1; text-align: center; padding: 100px 20px; }
            h1 { color: #f8fafc; margin-top: 24px; font-weight: 800; font-size: 28px; }
            p { color: #94a3b8; font-size: 15px; margin-top: 12px; }
            .spinner { border: 4px solid rgba(255, 255, 255, 0.05); width: 44px; height: 44px; border-radius: 50%; border-left-color: #38bdf8; animation: spin 1s linear infinite; display: inline-block; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h1>Kalavogue Portal is setting up...</h1>
          <p>The system is currently bundling production assets. Please reload in a few seconds.</p>
        </body>
        </html>
      `);
    });
    
    app.listen(port, '0.0.0.0', () => {
      console.log(`Fallback health-check server listening on port ${port}`);
    });
  } catch (err) {
    console.error("Express is not installed yet or failed to load. Startup halted:", err);
    process.exit(1);
  }
}
