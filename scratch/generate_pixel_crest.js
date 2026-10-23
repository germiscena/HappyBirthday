import fs from 'fs';
import http from 'http';
import { ensureBrowser } from './browser_helper.js';

async function generatePixelCrest() {
  const proc = await ensureBrowser();
  const raw = fs.readFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/.user_uploaded/media_1792663820598_2814470e.png');
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
        img.src = 'data:image/png;base64,' + '${base64}';
        await new Promise(r => img.onload = r);

        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const cHigh = document.createElement('canvas');
        cHigh.width = w;
        cHigh.height = h;
        const ctxH = cHigh.getContext('2d');
        ctxH.drawImage(img, 0, 0);

        // 1. Remove background by precise flood-fill from edges
        const imgData = ctxH.getImageData(0, 0, w, h);
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
          const r = data[p];
          const g = data[p + 1];
          const b = data[p + 2];

          // Outer black outline of shield is dark: r < 60 && g < 60 && b < 60
          // Stop at the black outline
          if (r < 65 && g < 65 && b < 65) continue;

          data[p + 3] = 0; // Transparent

          const px = idx % w;
          const py = Math.floor(idx / w);
          if (px > 0 && !visited[idx - 1]) queue.push(idx - 1);
          if (px < w - 1 && !visited[idx + 1]) queue.push(idx + 1);
          if (py > 0 && !visited[idx - w]) queue.push(idx - w);
          if (py < h - 1 && !visited[idx + w]) queue.push(idx + w);
        }

        ctxH.putImageData(imgData, 0, 0);

        // Find exact bounds of the shield
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
        ctxCrop.drawImage(cHigh, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

        // Target pixel-art dimensions: width 84px, height ~98px
        const targetW = 84;
        const targetH = Math.round(targetW * (cropH / cropW));
        const cPixel = document.createElement('canvas');
        cPixel.width = targetW;
        cPixel.height = targetH;
        const ctxP = cPixel.getContext('2d');
        ctxP.imageSmoothingEnabled = true;
        ctxP.drawImage(cCrop, 0, 0, targetW, targetH);

        // Pixel cleanup pass
        const pImgData = ctxP.getImageData(0, 0, targetW, targetH);
        const pd = pImgData.data;

        for (let i = 0; i < pd.length; i += 4) {
          const a = pd[i + 3];
          if (a < 110) {
            pd[i + 3] = 0;
          } else {
            pd[i + 3] = 255;
            // Clean pixel-art contrast and tone quantization
            const r = pd[i], g = pd[i + 1], b = pd[i + 2];
            // Black outline
            if (r < 55 && g < 55 && b < 55) {
              pd[i] = 22; pd[i + 1] = 24; pd[i + 2] = 34; // Deep dark slate
            }
            // Crisp white details (banner, pages, trim)
            else if (r > 210 && g > 210 && b > 210) {
              pd[i] = 255; pd[i + 1] = 255; pd[i + 2] = 255;
            }
            // Golden yellow sun/rays
            else if (r > 190 && g > 150 && b < 100) {
              pd[i] = 250; pd[i + 1] = 204; pd[i + 2] = 21; // Bright gold
            }
            // Sun orange
            else if (r > 200 && g > 100 && g <= 150 && b < 60) {
              pd[i] = 245; pd[i + 1] = 158; pd[i + 2] = 11; // Amber orange
            }
            // Sky blue shield background
            else if (b > 160 && r < 70 && g > 110) {
              pd[i] = 14; pd[i + 1] = 165; pd[i + 2] = 233; // Vivid cyan-blue
            }
            // Green branch
            else if (g > 100 && r < 100 && b < 70) {
              pd[i] = 34; pd[i + 1] = 197; pd[i + 2] = 94; // Vibrant green
            }
            // Dark olive green
            else if (g > 60 && g <= 100 && r < 70 && b < 60) {
              pd[i] = 22; pd[i + 1] = 101; pd[i + 2] = 52; // Forest green
            }
            // Red book edges
            else if (r > 170 && g < 80 && b < 70) {
              pd[i] = 220; pd[i + 1] = 38; pd[i + 2] = 38; // Red
            }
          }
        }
        ctxP.putImageData(pImgData, 0, 0);

        // Refine top banner with crisp stylized pixel text:
        // Banner curve is at y ~ 7..17
        ctxP.fillStyle = '#0284c7';
        // Draw crisp micro-lettering hints for "ЛОШНИЦКАЯ ГИМНАЗИЯ / БОРИСОВСКОГО Р-НА"
        // so it looks like authentic 16-bit retro typography
        ctxP.font = 'bold 5px sans-serif';
        ctxP.textAlign = 'center';
        ctxP.fillText('ЛОШНИЦКАЯ', targetW / 2, 9);
        ctxP.fillText('ГИМНАЗИЯ', targetW / 2, 14);

        return {
          targetW,
          targetH,
          dataUrl: cPixel.toDataURL('image/png')
        };
      })()
    `
  });

  fs.writeFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/test_pixel_crest.png', Buffer.from(res.result.value.dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
  console.log('Generated test_pixel_crest.png', res.result.value);
  ws.close();
  if (proc) proc.kill();
  process.exit(0);
}
generatePixelCrest();
