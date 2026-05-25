import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compiledServerPath = path.join(__dirname, 'dist', 'server.cjs');

// Global state to track building process
let isBuilding = false;
let buildLogs = [];
let buildError = null;
let buildCompleted = false;
let tempServerInstance = null;

function logLine(msg) {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  console.log(line);
  buildLogs.push(line);
}

async function loadProductionServer() {
  logLine("🚀 Booting compiled production server...");
  try {
    await import(pathToFileURL(compiledServerPath).href);
    logLine("✅ Production server is now fully operational!");
  } catch (err) {
    console.error("Fatal error loading production server:", err);
    buildLogs.push(`❌ FATAL ERROR DURING BOOTUP: ${err.message}\n${err.stack}`);
    buildError = err.message || "Failed to import bundled server module.";
  }
}

async function runProgrammaticBuild() {
  if (isBuilding) return;
  isBuilding = true;
  buildError = null;
  buildCompleted = false;
  buildLogs = [];
  
  logLine("📦 Initializing dynamic build on Hostinger server environment...");
  logLine("📂 Working directory: " + process.cwd());
  logLine("⚡ Running command: npm run build");

  const buildProcess = exec("npm run build", { cwd: process.cwd() });

  buildProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(l => {
      if (l.trim()) logLine(`[STDOUT] ${l}`);
    });
  });

  buildProcess.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(l => {
      if (l.trim()) logLine(`[STDERR] ${l}`);
    });
  });

  buildProcess.on('exit', async (code) => {
    isBuilding = false;
    if (code === 0) {
      logLine("🎉 Build completed successfully with exit code 0!");
      buildCompleted = true;
      
      // Stop the temp server and boot the production one
      if (tempServerInstance) {
        logLine("🛑 Stopping temporary builder server instance to free port...");
        tempServerInstance.close();
        
        // Wait 500ms for sockets to clear out, then start the production server
        setTimeout(async () => {
          await loadProductionServer();
        }, 500);
      } else {
        await loadProductionServer();
      }
    } else {
      logLine(`❌ Build failed with exit code ${code}`);
      buildError = `Compilation failed with exit code ${code}. Please verify the output logs below.`;
    }
  });
}

if (fs.existsSync(compiledServerPath)) {
  logLine("✅ Compiled asset 'dist/server.cjs' found! Launching immediately.");
  await loadProductionServer();
} else {
  // Setup fallback server and trigger build
  runProgrammaticBuild();

  try {
    const express = (await import('express')).default;
    const app = express();
    const port = Number(process.env.PORT) || 3000;

    app.get('*', (req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Connection', 'close'); // Prevent keep-alive from halting port release

      let statusMessage = "🚀 Kalavogue Setup in Progress...";
      let statusColorStyle = "color: #38bdf8; text-shadow: 0 0 10px rgba(56,189,248,0.2);";
      let statusIndicator = '<div class="spinner"></div>';
      let refreshMetaElement = '<meta http-equiv="refresh" content="2">';

      if (buildCompleted) {
        statusMessage = "🎉 Calibration Finished! Launching Portal...";
        statusColorStyle = "color: #34d399; text-shadow: 0 0 10px rgba(52,211,153,0.2);";
        statusIndicator = '<div style="height: 32px; width: 32px; display: flex; align-items: center; justify-content: center; background: rgba(52,211,153,0.1); color: #34d399; border-radius: 50%; font-size: 14px; font-weight: bold;">✓</div>';
        refreshMetaElement = '<meta http-equiv="refresh" content="1">';
      } else if (buildError) {
        statusMessage = "❌ Dynamic Compilation Failed!";
        statusColorStyle = "color: #f87171; text-shadow: 0 0 10px rgba(248,113,113,0.2);";
        statusIndicator = '<div style="height: 32px; width: 32px; display: flex; align-items: center; justify-content: center; background: rgba(248,113,113,0.1); color: #f87171; border-radius: 50%; font-size: 14px; font-weight: bold;">!</div>';
        refreshMetaElement = ''; // Stop refreshing automatically if failed
      }

      const logText = buildLogs.join('\n');

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>System Compilation | Kalavogue Portal Builder</title>
          ${refreshMetaElement}
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #070b15; color: #cbd5e1; padding: 40px 20px; margin: 0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; }
            .card { width: 100%; max-width: 800px; background: #0c1125; border: 1px solid rgba(255,255,255,0.05); padding: 32px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
            h1 { color: #f8fafc; margin: 0; font-weight: 800; font-size: 24px; letter-spacing: -0.025em; }
            p { color: #94a3b8; font-size: 14px; margin-top: 6px; margin-bottom: 24px; line-height: 1.5; }
            .status-banner { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 24px; background: rgba(255,255,255,0.01); }
            .status-text { flex: 1; font-weight: 600; font-size: 14px; }
            .terminal { background: #03060f; border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 16px; margin-top: 10px; height: 320px; overflow-y: auto; font-family: "JetBrains Mono", SFMono-Regular, Consolas, monospace; font-size: 11px; line-height: 1.6; color: #a1a1aa; text-align: left; }
            .terminal-header { display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #52525b; margin-bottom: 8px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px; }
            .log-line { margin: 2px 0; white-space: pre-wrap; word-break: break-all; }
            .spinner { border: 3px solid rgba(56, 189, 248, 0.1); width: 24px; height: 24px; border-radius: 50%; border-left-color: #38bdf8; animation: spin 0.8s linear infinite; display: inline-block; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .sky-text { color: #38bdf8; }
            .btn-retry { background: #38bdf8; color: #090d16; font-weight: bold; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-size: 13px; margin-top: 12px; }
            .btn-retry:hover { background: #7dd3fc; }
          </style>
          <script>
            // Auto scroll terminal to bottom
            window.onload = function() {
              var t = document.getElementById("logTerm");
              if (t) t.scrollTop = t.scrollHeight;
            }
          </script>
        </head>
        <body>
          <div class="card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <h1>✨ Hostinger Builder Console</h1>
              <span style="font-size: 10px; font-weight: bold; color: #475569; border: 1px solid rgba(255,255,255,0.04); padding: 2px 8px; border-radius: 4px; font-family: sans-serif;">KALAVOGUE</span>
            </div>
            <p>Dynamic bundle environment calibration for Hostinger Web Services. When setup completes successfully, the panel will live-swap onto port <strong>${port}</strong> automatically.</p>
            
            <div class="status-banner">
              ${statusIndicator}
              <div class="status-text" style="${statusColorStyle}">
                ${statusMessage}
              </div>
            </div>

            <div class="terminal-header">
              <span>Active Builder Pipeline Output</span>
              <span>Port ${port} logs</span>
            </div>
            <div class="terminal" id="logTerm">
              ${logText.split('\n').map(line => `<div class="log-line">${line}</div>`).join('')}
              ${!buildCompleted && !buildError ? '<div class="log-line sky-text" style="animation: pulse 2s infinite;">⚡ Spawning compilers... tracking bundle processes...</div>' : ''}
            </div>

            ${buildError ? `
              <div style="text-align: right;">
                <button class="btn-retry" onclick="window.location.reload()">Refresh Console Status</button>
              </div>
            ` : ''}
          </div>
        </body>
        </html>
      `);
    });

    tempServerInstance = app.listen(port, '0.0.0.0', () => {
      logLine(`💡 Initial fallback server launched on http://0.0.0.0:${port}`);
    });
  } catch (err) {
    console.error("Temporary server initialization crashed:", err);
    process.exit(1);
  }
}
