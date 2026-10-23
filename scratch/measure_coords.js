import fs from 'fs';
import http from 'http';
import { ensureBrowser } from './browser_helper.js';

async function measureExactCoords() {
  const browserProc = await ensureBrowser();
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
        const img = new Image();
        img.src = 'data:image/jpeg;base64,' + '${base64}';
        await new Promise(r => img.onload = r);
        
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const data = imgData.data;

        // Find the blue circular sign border:
        // Blue text / background has R < 70, G: 80..165, B: 150..255
        let minX = 9999, maxX = 0, minY = 9999, maxY = 0;
        let sumX = 0, count = 0;
        for (let y = 440; y < 650; y++) {
          for (let x = 0; x < 700; x++) {
            const idx = (y * c.width + x) * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            if (b > 150 && r < 75 && g > 70 && g < 165) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              sumX += x;
              count++;
            }
          }
        }

        // Also find pole:
        let poleMinY = 9999, poleMaxY = 0, poleXSum = 0, poleCount = 0;
        for (let y = maxY; y < 650; y++) {
          for (let x = minX - 10; x < maxX + 10; x++) {
            const idx = (y * c.width + x) * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            if (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && r > 130 && r < 210) {
              if (y < poleMinY) poleMinY = y;
              if (y > poleMaxY) poleMaxY = y;
              poleXSum += x;
              poleCount++;
            }
          }
        }

        return {
          sign: { minX, maxX, minY, maxY, centerX: count ? Math.round(sumX / count) : 0, w: maxX - minX + 1, h: maxY - minY + 1 },
          pole: { poleMinY, poleMaxY, poleX: poleCount ? Math.round(poleXSum / poleCount) : 0 }
        };
      })()
    `
  });

  console.log('MEASURED COORDS:', JSON.stringify(res.result.value, null, 2));
  ws.close();
  if (browserProc) browserProc.kill();
  process.exit(0);
}
measureExactCoords();
