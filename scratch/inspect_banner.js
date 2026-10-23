import http from 'http';
import fs from 'fs';

async function run() {
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
        cvs.height = 120;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(img, 0, 0);
        // sample colors along y = 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
        const rows = [];
        for (let y = 0; y < 100; y += 10) {
          const pixel = ctx.getImageData(img.width / 2, y, 1, 1).data;
          rows.push({ y, r: pixel[0], g: pixel[1], b: pixel[2] });
        }
        return { rows, dataUrl: cvs.toDataURL('image/png') };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Sample rows:', res.result?.value?.rows);
  const data = res.result?.value?.dataUrl;
  if (data) {
    const base64 = data.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('scratch/top120_scene1.png', Buffer.from(base64, 'base64'));
  }
  ws.close();
}
run();
