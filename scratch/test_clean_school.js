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

async function testCleanSchool() {
  await ensureBrowser();
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
        c.width = 1376;
        c.height = 768;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // 1. Erase wall:
        // Source region: x=270, y=440, w=110, h=145
        // Destination region: x=400, y=440, w=110, h=145
        ctx.drawImage(img, 270, 440, 110, 145, 400, 440, 110, 145);

        // 2. Erase pole in lawn:
        // Source grass: x=340, y=585, w=60, h=60
        // Dest grass: x=430, y=585, w=60, h=60
        ctx.drawImage(img, 340, 585, 60, 60, 430, 585, 60, 60);

        // Crop region around the erased sign to inspect
        const cCrop = document.createElement('canvas');
        cCrop.width = 260;
        cCrop.height = 300;
        const ctxCrop = cCrop.getContext('2d');
        ctxCrop.drawImage(c, 330, 430, 260, 300, 0, 0, 260, 300);

        return {
          full: c.toDataURL('image/jpeg', 0.95),
          crop: cCrop.toDataURL('image/png')
        };
      })()
    `
  });

  fs.writeFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/clean_wall_test_crop.png', Buffer.from(res.result.value.crop.replace(/^data:image\/png;base64,/, ''), 'base64'));
  ws.close();
  process.exit(0);
}
testCleanSchool();
