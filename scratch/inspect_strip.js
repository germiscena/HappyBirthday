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

        // Let's inspect columns from x=300 to x=600 at y=480 (brick wall height)
        // and at y=540 (foundation base height)
        const strip = [];
        for (let x = 320; x < 600; x += 10) {
          const pBrick = ctx.getImageData(x, 480, 1, 1).data;
          const pBase = ctx.getImageData(x, 540, 1, 1).data;
          strip.push({ x, brick: [pBrick[0], pBrick[1], pBrick[2]], base: [pBase[0], pBase[1], pBase[2]] });
        }
        return strip;
      })()
    `
  });

  console.log(JSON.stringify(res.result.value, null, 2));
  ws.close();
  if (proc) proc.kill();
  process.exit(0);
}
main();
