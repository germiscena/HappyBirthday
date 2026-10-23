import fs from 'fs';
import http from 'http';
import { ensureBrowser } from './browser_helper.js';

const UPLOAD_DIR = 'C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/.user_uploaded';

const CHARACTERS = [
  { key: 'sister', name: 'Яна', file: 'media_1792671000953_ed9902b1.jpg' },
  { key: 'dad', name: 'Папа', file: 'media_1792671000955_8ed92e8c.jpg' },
  { key: 'mom', name: 'Мама', file: 'media_1792671000957_6cf1d29f.jpg' },
  { key: 'cat', name: 'Кошка', file: 'media_1792671000961_41b36b27.jpg' },
  { key: 'heroine', name: 'Леся (3 года)', file: 'media_1792671023339_15642018.jpg' }
];

async function inspectChars() {
  const proc = await ensureBrowser();

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

  const results = [];

  for (const c of CHARACTERS) {
    const raw = fs.readFileSync(`${UPLOAD_DIR}/${c.file}`);
    const base64 = raw.toString('base64');

    const res = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `
        (async () => {
          const img = new Image();
          img.src = 'data:image/jpeg;base64,' + '${base64}';
          await new Promise(r => img.onload = r);
          return { w: img.naturalWidth, h: img.naturalHeight };
        })()
      `
    });

    results.push({ ...c, dimensions: res.result.value });
  }

  console.log('Character Dimensions:', JSON.stringify(results, null, 2));
  ws.close();
  if (proc) proc.kill();
  process.exit(0);
}

inspectChars();
