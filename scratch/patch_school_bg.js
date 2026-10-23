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

    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 400));
      if (await check()) return;
    }
  }
}

async function patchSchoolBg() {
  await ensureBrowser();
  const tabs = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = tabs.find(t => t.type === 'page' && (t.title.includes('Дорога жизни') || t.title.includes('Timeline') || t.url?.includes('5173')));
  if (!page) {
    console.error('No page found');
    return;
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    pending.set(curId, { resolve, reject });
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const result = await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `
      (async () => {
        const img = new Image();
        img.src = '/assets/environments/scene01b_school.jpg?t=' + Date.now();
        await new Promise(r => img.onload = r);

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Coordinates of the old painted circular sign:
        // centered around x ~ 460, y ~ 570 in 1376x768
        // Sample surrounding lawn texture from x: 340..390, y: 560..640
        // and foundation brick from x: 440..500, y: 470..520
        const sampleLawn = ctx.getImageData(340, 560, 60, 70);
        ctx.putImageData(sampleLawn, 440, 555);
        ctx.putImageData(sampleLawn, 465, 555);

        // Foundation grey band at y ~ 500..545
        const sampleWall = ctx.getImageData(350, 480, 70, 60);
        ctx.putImageData(sampleWall, 435, 485);
        ctx.putImageData(sampleWall, 465, 485);

        return canvas.toDataURL('image/jpeg', 0.95);
      })()
    `
  });

  if (result?.result?.value) {
    const base64Data = result.result.value.replace(/^data:image\/jpeg;base64,/, '');
    fs.writeFileSync('public/assets/environments/scene01b_school.jpg', Buffer.from(base64Data, 'base64'));
    console.log('Successfully patched public/assets/environments/scene01b_school.jpg!');
  } else {
    console.error('Failed to patch', result);
  }
  ws.close();
}

patchSchoolBg();
