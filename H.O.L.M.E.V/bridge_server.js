// H.O.L.M.E.V Native OS Bridge Server (Node.js)
// Allows HOLMEV to directly create folders on Windows Desktop, launch Notepad, Chrome, YouTube, and PC controls
// Run with: node bridge_server.js

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';

const PORT = 5000;
const desktopPath = path.join(os.homedir(), 'Desktop');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // 1. Health Status
  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ONLINE', host: os.hostname(), platform: os.platform() }));
    return;
  }

  // 2. Create Real Desktop Folder
  if (url.pathname === '/api/system/create_folder' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { folderName } = JSON.parse(body || '{}');
        const name = folderName || `HOLMEV_FOLDER_${Date.now()}`;
        const targetDir = path.join(desktopPath, name);

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, path: targetDir, message: `Folder "${name}" created on Desktop.` }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 3. Launch App (Notepad, Calculator, etc.)
  if (url.pathname === '/api/system/launch_app' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { app } = JSON.parse(body || '{}');
        const appCmd = app === 'notepad' ? 'notepad.exe' : app === 'calc' ? 'calc.exe' : app;
        exec(appCmd);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, app: appCmd }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 4. Open URL (YouTube, Google)
  if (url.pathname === '/api/system/open_url' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { targetUrl } = JSON.parse(body || '{}');
        if (targetUrl) {
          const startCmd = process.platform === 'win32' ? `start "" "${targetUrl}"` : `open "${targetUrl}"`;
          exec(startCmd);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, url: targetUrl }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`[H.O.L.M.E.V OS BRIDGE] Server listening on http://localhost:${PORT}`);
  console.log(`[H.O.L.M.E.V OS BRIDGE] Desktop Path: ${desktopPath}`);
});
