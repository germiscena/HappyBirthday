import fs from 'fs';
import http from 'http';
import { spawn } from 'child_process';

async function ensureBrowser() {
  const check = () => new Promise((resolve) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      resolve(true);
    }).on('error', () => resolve(false));
  });

  const isUp = await check();
  if (!isUp) {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const edge = spawn(edgePath, [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--window-size=1024,576',
      'http://localhost:5173/'
    ], { detached: true, stdio: 'ignore' });
    edge.unref();

    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 400));
      if (await check()) return;
    }
  }
}

async function checkCoords() {
  await ensureBrowser();
  const imgRaw = fs.readFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/scene01b_school_pixel_art_1792655221353.jpg');
  const base64 = imgRaw.toString('base64');
  
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
        const data = ctx.getImageData(0, 0, c.width, c.height).data;

        let minX = 9999, maxX = 0, minY = 9999, maxY = 0;
        for (let y = 450; y < 750; y++) {
          for (let x = 350; x < 550; x++) {
            const idx = (y * c.width + x) * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            // Blue circle
            if (b > 110 && r < 90 && g < 150) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        return { w: c.width, h: c.height, minX, maxX, minY, maxY };
      })()
    `
  });

  console.log('Detected sign coordinates:', res.result.value);
  ws.close();
  process.exit(0);
}
checkCoords();
