import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compiledServerPath = path.join(__dirname, 'dist', 'server.cjs');

async function bootstrap() {
  console.log("-----------------------------------------");
  console.log("⚡ Starting Kalavogue Hub Production Mainline...");
  console.log("-----------------------------------------");
  
  if (fs.existsSync(compiledServerPath)) {
    console.log("📡 Found compiled production build: '" + compiledServerPath + "'");
    try {
      // Load and run the production server bundle
      const fileUrl = pathToFileURL(compiledServerPath).href;
      await import(fileUrl);
    } catch (err) {
      console.error("❌ Critical: Failed to load bundled server module:", err);
      process.exit(1);
    }
  } else {
    console.warn("⚠️ Warning: 'dist/server.cjs' was not found on Hostinger.");
    console.warn("Please run 'npm run build' locally before pushing to GitHub.");
    
    // Serve a simple, elegant static page on process.env.PORT or 3000 to explain the issue
    try {
      const express = (await import('express')).default;
      const app = express();
      const port = Number(process.env.PORT) || 3000;
      
      app.get('*', (req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.status(503).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Static Build Required | Kalavogue Portal</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #070b15; color: #cbd5e1; text-align: center; padding: 100px 20px; }
              .card { max-width: 600px; margin: 0 auto; background: #0c1125; padding: 40px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
              h1 { color: #f8fafc; font-size: 24px; font-weight: 800; margin-bottom: 12px; }
              p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
              .code-block { background: #03060f; padding: 12px; border-radius: 6px; font-family: monospace; color: #38bdf8; font-size: 13px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>⚠️ Production Output Directory Missing</h1>
              <p>The precompiled Kalavogue production bundle is not found in the <code>dist/</code> directory. To run this app on Hostinger with zero latency:</p>
              <div class="code-block">dist/server.cjs is missing</div>
              <p>Make sure you let your AI Studio agent run a full compilation build, then commit and push the newly generated <code>dist/</code> folder to GitHub. The host will boot instantly!</p>
            </div>
          </body>
          </html>
        `);
      });
      
      app.listen(port, () => {
        console.log("Fallback placeholder server started on port " + port);
      });
    } catch (expressErr) {
      console.error("Express is unavailable and production assets are missing. Halting.", expressErr);
      process.exit(1);
    }
  }
}

bootstrap().catch(err => {
  console.error("Fatal startup sequence exception:", err);
  process.exit(1);
});
