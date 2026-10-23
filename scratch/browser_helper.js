import http from 'http';
import { spawn } from 'child_process';

export async function ensureBrowser() {
  const check = () => new Promise((resolve) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      resolve(true);
    }).on('error', () => resolve(false));
  });

  if (await check()) return null;

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\Pasha\\AppData\\Local\\Temp\\edge_cdp_fresh',
    '--window-size=1024,576',
    'http://localhost:5173/'
  ], { detached: false });

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 300));
    if (await check()) return edge;
  }
  throw new Error('Edge failed to start');
}
