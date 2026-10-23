import http from 'http';
import fs from 'fs';
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

    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 400));
      if (await check()) return;
    }
  }
}

async function run() {
  await ensureBrowser();
  const tabs = await new Promise((res, rej) => http.get('http://127.0.0.1:9222/json', r => {
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej));
  const page = tabs.find(t => t.type === 'page' && t.title.includes('Timeline'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (m, p={}) => new Promise((resolve) => {
    const i = id++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === i) { ws.removeEventListener('message', handler); resolve(d.result); }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });

  const res = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        const img = new Image();
        img.src = '/assets/environments/scene01_house.jpg';
        await new Promise(r => img.onload = r);
        const cvs = document.createElement('canvas');
        cvs.width = img.width;
        cvs.height = 100;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return {
          width: img.width,
          height: img.height,
          dataUrl: cvs.toDataURL('image/png')
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Result:', res.result?.value?.width, res.result?.value?.height);
  const data = res.result?.value?.dataUrl;
  if (data) {
    const base64 = data.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('scratch/top100_scene1.png', Buffer.from(base64, 'base64'));
    console.log('Saved scratch/top100_scene1.png');
  }
  ws.close();
}
run();
