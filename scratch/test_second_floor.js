import fs from 'fs';
import http from 'http';
import { ensureBrowser } from './browser_helper.js';

async function test2ndFloorSample() {
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

        // Crop 2nd floor windows x: 370..530, y: 250..380
        const cCrop = document.createElement('canvas');
        cCrop.width = 160;
        cCrop.height = 130;
        const ctxCrop = cCrop.getContext('2d');
        ctxCrop.drawImage(c, 370, 250, 160, 130, 0, 0, 160, 130);

        return cCrop.toDataURL('image/png');
      })()
    `
  });

  fs.writeFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/second_floor_crop.png', Buffer.from(res.result.value.replace(/^data:image\/png;base64,/, ''), 'base64'));
  ws.close();
  if (proc) proc.kill();
  process.exit(0);
}
test2ndFloorSample();
