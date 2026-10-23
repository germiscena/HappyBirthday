import fs from 'fs';
import http from 'http';
import { ensureBrowser } from './browser_helper.js';

async function main() {
  const proc = await ensureBrowser();
  const raw = fs.readFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/scene01b_school_pixel_art_1792655221353.jpg');
  const base64 = raw.toString('base64');
  
  const tabs = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9222/json', r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
  const page = tabs.find(t => t.type === 'page');
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

  const res = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `
      (async () => {
        const c = document.createElement('canvas');
        const img = new Image();
        img.src = 'data:image/jpeg;base64,' + '${base64}';
        await new Promise(r => img.onload = r);
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(400, 450, 110, 120).data;
        let minX = 999, maxX = 0, minY = 999, maxY = 0;
        for (let y = 0; y < 120; y++) {
          for (let x = 0; x < 110; x++) {
            const idx = (y * 110 + x) * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            // Deep blue circle
            if (b > 130 && r < 70 && g < 140) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        return { minX: minX + 400, maxX: maxX + 400, minY: minY + 450, maxY: maxY + 450 };
      })()
    `
  });

  console.log('SIGN BOUNDS:', res.result.value);
  ws.close();
  if (proc) proc.kill();
  process.exit(0);
}
main();
