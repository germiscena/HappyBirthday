import fs from 'fs';
import http from 'http';
import { ensureBrowser } from './browser_helper.js';

const UPLOAD_DIR = 'C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/.user_uploaded';

const CHARACTERS = [
  { key: 'sister', name: 'Яна', file: 'media_1792671000953_ed9902b1.jpg', out: 'scene01_sister.png' },
  { key: 'dad', name: 'Папа', file: 'media_1792671000955_8ed92e8c.jpg', out: 'scene01_dad.png' },
  { key: 'mom', name: 'Мама', file: 'media_1792671000957_6cf1d29f.jpg', out: 'scene01_mom.png' },
  { key: 'cat', name: 'Кошка', file: 'media_1792671000961_41b36b27.jpg', out: 'scene01_cat.png' },
  { key: 'heroine', name: 'Леся (3 года)', file: 'media_1792671023339_15642018.jpg', out: 'scene01_heroine_toddler.png' }
];

async function processCharacters() {
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

          const w = img.naturalWidth;
          const h = img.naturalHeight;
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          // BFS flood fill from outside borders
          const visited = new Uint8Array(w * h);
          const queue = [];
          for (let x = 0; x < w; x++) {
            queue.push(x);
            queue.push((h - 1) * w + x);
          }
          for (let y = 0; y < h; y++) {
            queue.push(y * w);
            queue.push(y * w + (w - 1));
          }

          while (queue.length > 0) {
            const idx = queue.pop();
            if (visited[idx]) continue;
            visited[idx] = 1;

            const p = idx * 4;
            const r = data[p], g = data[p + 1], b = data[p + 2];

            // Background is white/near-white: stop at character contour
            // Character outline is dark or colored clothing.
            // If pixel is near-white (all channels > 242), it is background.
            // If there is slight JPEG ringing (e.g. > 235 and low saturation |r-g| < 12 and |g-b| < 12)
            const isWhiteBg = (r > 240 && g > 240 && b > 240) ||
                              (r > 225 && g > 225 && b > 225 && Math.abs(r - g) < 8 && Math.abs(g - b) < 8);

            if (!isWhiteBg) {
              // Hit character boundary
              continue;
            }

            // Make transparent
            data[p + 3] = 0;

            const px = idx % w;
            const py = Math.floor(idx / w);
            if (px > 0 && !visited[idx - 1]) queue.push(idx - 1);
            if (px < w - 1 && !visited[idx + 1]) queue.push(idx + 1);
            if (py > 0 && !visited[idx - w]) queue.push(idx - w);
            if (py < h - 1 && !visited[idx + w]) queue.push(idx + w);
          }

          ctx.putImageData(imgData, 0, 0);

          // Find tight bounding box of character
          let minX = w, maxX = 0, minY = h, maxY = 0;
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              if (data[(y * w + x) * 4 + 3] > 10) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          const cropW = maxX - minX + 1;
          const cropH = maxY - minY + 1;

          const cCrop = document.createElement('canvas');
          cCrop.width = cropW;
          cCrop.height = cropH;
          const ctxCrop = cCrop.getContext('2d');
          ctxCrop.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

          return {
            minX, maxX, minY, maxY, cropW, cropH,
            pngData: cCrop.toDataURL('image/png')
          };
        })()
      `
    });

    const info = res.result.value;
    console.log(`Processed ${c.name} (${c.key}): crop ${info.cropW}x${info.cropH}`);

    const base64Data = info.pngData.replace(/^data:image\/png;base64,/, '');
    const outPath = `public/assets/characters/${c.out}`;
    fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));

    // Also copy to artifact dir for visual verification
    fs.writeFileSync(`C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/${c.out}`, Buffer.from(base64Data, 'base64'));
  }

  console.log('All 5 characters processed successfully!');
  ws.close();
  if (proc) proc.kill();
  process.exit(0);
}

processCharacters();
