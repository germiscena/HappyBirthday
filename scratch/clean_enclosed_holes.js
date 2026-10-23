import fs from 'fs';
import http from 'http';
import { ensureBrowser } from './browser_helper.js';

// Specific seed points (x, y) inside the enclosed background holes for each cropped character
// We will also detect any white pixel inside these known bounding boxes.
const HOLE_SEEDS = {
  sister: [
    // between legs
    { x: 175, y: 750 }
  ],
  dad: [
    // between legs
    { x: 195, y: 700 }
  ],
  mom: [
    // between legs
    { x: 130, y: 650 }
  ],
  cat: [
    // between curved tail and hind thigh
    { x: 135, y: 400 }
  ],
  heroine: [
    // between front arm and belly/leg
    { x: 440, y: 620 }
  ]
};

async function cleanEnclosedHoles() {
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

  const files = [
    { key: 'sister', file: 'scene01_sister.png' },
    { key: 'dad', file: 'scene01_dad.png' },
    { key: 'mom', file: 'scene01_mom.png' },
    { key: 'cat', file: 'scene01_cat.png' },
    { key: 'heroine', file: 'scene01_heroine_toddler.png' }
  ];

  for (const item of files) {
    const raw = fs.readFileSync(`public/assets/characters/${item.file}`);
    const base64 = raw.toString('base64');
    const seeds = HOLE_SEEDS[item.key] || [];

    const res = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `
        (async () => {
          const img = new Image();
          img.src = 'data:image/png;base64,' + '${base64}';
          await new Promise(r => img.onload = r);

          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          const seeds = ${JSON.stringify(seeds)};
          for (const s of seeds) {
            // Find a white pixel near the seed
            const visited = new Uint8Array(w * h);
            const queue = [];

            // Search in 20px radius for white pixel
            let startIdx = -1;
            for (let dy = -20; dy <= 20; dy++) {
              for (let dx = -20; dx <= 20; dx++) {
                const sx = s.x + dx;
                const sy = s.y + dy;
                if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
                  const idx = sy * w + sx;
                  const p = idx * 4;
                  if (data[p] > 230 && data[p+1] > 230 && data[p+2] > 230 && data[p+3] > 0) {
                    startIdx = idx;
                    break;
                  }
                }
              }
              if (startIdx >= 0) break;
            }

            if (startIdx >= 0) {
              queue.push(startIdx);
              while (queue.length > 0) {
                const idx = queue.pop();
                if (visited[idx]) continue;
                visited[idx] = 1;

                const p = idx * 4;
                const r = data[p], g = data[p+1], b = data[p+2];
                // Background white/near-white
                const isWhite = (r > 230 && g > 230 && b > 230) ||
                                (r > 210 && g > 210 && b > 210 && Math.abs(r - g) < 8 && Math.abs(g - b) < 8);
                if (!isWhite) continue;

                data[p+3] = 0; // Transparent

                const px = idx % w;
                const py = Math.floor(idx / w);
                if (px > 0 && !visited[idx - 1]) queue.push(idx - 1);
                if (px < w - 1 && !visited[idx + 1]) queue.push(idx + 1);
                if (py > 0 && !visited[idx - w]) queue.push(idx - w);
                if (py < h - 1 && !visited[idx + w]) queue.push(idx + w);
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);
          return canvas.toDataURL('image/png');
        })()
      `
    });

    const base64Out = res.result.value.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(`public/assets/characters/${item.file}`, Buffer.from(base64Out, 'base64'));
    fs.writeFileSync(`C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/${item.file}`, Buffer.from(base64Out, 'base64'));
    console.log(`Cleaned holes in ${item.file}`);
  }

  ws.close();
  if (proc) proc.kill();
  process.exit(0);
}

cleanEnclosedHoles();
