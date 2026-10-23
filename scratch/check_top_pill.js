import fs from 'fs';
import http from 'http';
import { spawn } from 'child_process';

async function check() {
  return new Promise(r => http.get('http://127.0.0.1:9222/json', () => r(true)).on('error', () => r(false)));
}

async function run() {
  if (!await check()) {
    const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
      '--headless=new', '--remote-debugging-port=9222', '--window-size=1024,576', 'http://localhost:5173/'
    ], { detached: true, stdio: 'ignore' });
    edge.unref();
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 400));
      if (await check()) break;
    }
  }

  const tabs = await new Promise(r => http.get('http://127.0.0.1:9222/json', res => {
    let d = ''; res.on('data', c => d += c); res.on('end', () => r(JSON.parse(d)));
  }));
  const page = tabs.find(t => t.url && t.url.includes('5173'));
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 1;
  const send = (method, params) => new Promise((resolve, reject) => {
    const mid = id++;
    const h = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === mid) {
        ws.removeEventListener('message', h);
        if (data.error) reject(data.error); else resolve(data.result);
      }
    };
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Runtime.evaluate', { expression: `
    const btn = document.getElementById('btn-start');
    if (btn) btn.click();
    const sc = document.getElementById('start-screen');
    if (sc) sc.style.display = 'none';
  ` });
  await new Promise(r => setTimeout(r, 1000));
  await send('Runtime.evaluate', { expression: 'window.gameApp.timelineController.setIndex(9)' });
  await new Promise(r => setTimeout(r, 1200));

  const info = await send('Runtime.evaluate', {
    expression: 'JSON.stringify({ title: window.gameApp.timelineBar.titleText.text, sub: window.gameApp.timelineBar.subtitleText.text, titleW: window.gameApp.timelineBar.titleText.width })'
  });
  console.log('INFO:', info.result.value);

  const canvasRect = await send('Runtime.evaluate', {
    expression: 'JSON.stringify(document.querySelector("#game-container canvas").getBoundingClientRect())'
  });
  console.log('CANVAS RECT:', canvasRect.result.value);
  const r = JSON.parse(canvasRect.result.value);
  const sx = r.width / 1024;
  const sy = r.height / 576;

  const res = await send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: r.left + 300 * sx,
      y: r.top + 8 * sy,
      width: 424 * sx,
      height: 60 * sy,
      scale: 3
    }
  });
  fs.writeFileSync('C:\\Users\\Pasha\\.gemini\\antigravity\\brain\\72da3648-8ca2-4139-9d52-fa527994aebe\\top_pill_zoom.png', Buffer.from(res.data, 'base64'));
  console.log('Saved top_pill_zoom.png');
  ws.close();
  process.exit(0);
}
run();
