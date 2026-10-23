import fs from 'fs';
import http from 'http';
import { ensureBrowser } from './browser_helper.js';

async function captureScene01b() {
  const proc = await ensureBrowser();

  const tabs = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9222/json', r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
  const page = tabs.find(t => t.type === 'page' && (t.url?.includes('5173') || t.title.includes('Timeline') || t.title.includes('Дорога жизни')));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (m, p = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === curId) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method: m, params: p }));
  });

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('Reloading page...');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2000));

  // Dismiss start overlay
  await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `
      (() => {
        const btn = document.getElementById('btn-start');
        if (btn) btn.click();
        const startScreen = document.getElementById('start-screen');
        if (startScreen) startScreen.style.display = 'none';
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  // Navigate to Scene 01b (index 1)
  console.log('Navigating to Scene 01b...');
  await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `window.gameApp.timelineController.setIndex(1)`
  });

  await new Promise(r => setTimeout(r, 2000));

  // Capture full screenshot
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/scene01b_in_game_crest.png', Buffer.from(screenshot.data, 'base64'));

  // Also capture close-up of the crest stand
  // virtual stand: x ~ 339, y ~ 373. Window: 1024x576
  const clipScreenshot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: 270,
      y: 280,
      width: 160,
      height: 220,
      scale: 1
    }
  });
  fs.writeFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/scene01b_crest_closeup.png', Buffer.from(clipScreenshot.data, 'base64'));

  console.log('Screenshots captured successfully!');
  ws.close();
  if (proc) proc.kill();
  process.exit(0);
}
captureScene01b();
