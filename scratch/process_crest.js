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

async function run() {
  await ensureBrowser();

  const tabs = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = tabs.find(t => t.type === 'page' && (t.title.includes('Дорога жизни') || t.title.includes('Timeline') || t.url?.includes('5173')));
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

  // Read raw original crest photo
  const crestRaw = fs.readFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/.user_uploaded/media_1792663820598_2814470e.png');
  const crestBase64 = crestRaw.toString('base64');

  // Read original school background
  const schoolRaw = fs.readFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/scene01b_school_pixel_art_1792655221353.jpg');
  const schoolBase64 = schoolRaw.toString('base64');

  const evalRes = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `
      (async () => {
        // 1. Process crest: remove background outside shield
        const imgCrest = new Image();
        imgCrest.src = 'data:image/png;base64,' + '${crestBase64}';
        await new Promise(r => imgCrest.onload = r);

        const w = imgCrest.naturalWidth;
        const h = imgCrest.naturalHeight;
        const cCrest = document.createElement('canvas');
        cCrest.width = w;
        cCrest.height = h;
        const ctxC = cCrest.getContext('2d');
        ctxC.drawImage(imgCrest, 0, 0);

        const imgData = ctxC.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Flood fill from outer borders to make all outer pixels transparent
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

          // Black border of the shield has low RGB
          const isBorder = (r < 75 && g < 75 && b < 75);
          if (isBorder) continue;

          // Transparent outside
          data[p + 3] = 0;

          const px = idx % w;
          const py = Math.floor(idx / w);
          if (px > 0 && !visited[idx - 1]) queue.push(idx - 1);
          if (px < w - 1 && !visited[idx + 1]) queue.push(idx + 1);
          if (py > 0 && !visited[idx - w]) queue.push(idx - w);
          if (py < h - 1 && !visited[idx + w]) queue.push(idx + w);
        }

        ctxC.putImageData(imgData, 0, 0);

        // Find shield bounding box
        let minX = w, maxX = 0, minY = h, maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (data[(y * w + x) * 4 + 3] > 20) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;
        const cCropped = document.createElement('canvas');
        cCropped.width = cropW;
        cCropped.height = cropH;
        const ctxCrop = cCropped.getContext('2d');
        ctxCrop.drawImage(cCrest, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

        // Pixel-art scaled badge: 90x104
        const targetBadgeW = 90;
        const targetBadgeH = Math.round(targetBadgeW * (cropH / cropW));
        const cBadge = document.createElement('canvas');
        cBadge.width = targetBadgeW;
        cBadge.height = targetBadgeH;
        const ctxBadge = cBadge.getContext('2d');
        ctxBadge.imageSmoothingEnabled = true;
        ctxBadge.drawImage(cCropped, 0, 0, targetBadgeW, targetBadgeH);

        // Pixel-art clean quantization
        const bData = ctxBadge.getImageData(0, 0, targetBadgeW, targetBadgeH);
        const bd = bData.data;
        for (let i = 0; i < bd.length; i += 4) {
          if (bd[i + 3] < 128) {
            bd[i + 3] = 0;
          } else {
            bd[i + 3] = 255;
            bd[i] = Math.min(255, Math.round(bd[i] / 16) * 16);
            bd[i + 1] = Math.min(255, Math.round(bd[i + 1] / 16) * 16);
            bd[i + 2] = Math.min(255, Math.round(bd[i + 2] / 16) * 16);
          }
        }
        ctxBadge.putImageData(bData, 0, 0);

        // 2. Load school background
        const imgSchool = new Image();
        imgSchool.src = 'data:image/jpeg;base64,' + '${schoolBase64}';
        await new Promise(r => imgSchool.onload = r);

        const cSchool = document.createElement('canvas');
        cSchool.width = 1376;
        cSchool.height = 768;
        const ctxS = cSchool.getContext('2d');
        ctxS.drawImage(imgSchool, 0, 0);

        // COMPLETELY ERASE OLD BLUE CIRCULAR SIGN:
        // The old sign was at x: 395..515, y: 410..535.
        // Sample clean brick wall and foundation from x: 260..380, y: 410..535
        ctxS.drawImage(imgSchool, 260, 410, 120, 125, 395, 410, 120, 125);

        // Draw clean metal sign pole in the center:
        // Center x is 454.
        ctxS.fillStyle = '#1e293b';
        ctxS.fillRect(451, 480, 6, 96);
        ctxS.fillStyle = '#475569';
        ctxS.fillRect(452, 480, 2, 96);

        // Mounting bracket for the crest:
        ctxS.fillStyle = '#334155';
        ctxS.fillRect(444, 474, 20, 8);
        ctxS.fillRect(442, 440, 24, 6);

        // Position the Loshnitsa Gymnasium Crest on the pole:
        const signW = 90;
        const signH = Math.round(signW * (cropH / cropW));
        const signX = Math.round(454 - signW / 2);
        const signY = Math.round(482 - signH); // bottom tip of shield touches bracket at y=482

        // Soft drop-shadow behind shield
        ctxS.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctxS.beginPath();
        ctxS.roundRect(signX + 3, signY + 3, signW, signH, 8);
        ctxS.fill();

        // Draw the authentic pixel-art badge
        ctxS.imageSmoothingEnabled = false;
        ctxS.drawImage(cBadge, signX, signY, signW, signH);

        return {
          badge: cBadge.toDataURL('image/png'),
          schoolBg: cSchool.toDataURL('image/jpeg', 0.95),
          coords: { signX, signY, signW, signH, poleX: 454 }
        };
      })()
    `
  });

  if (evalRes?.result?.value) {
    const { badge, schoolBg, coords } = evalRes.result.value;

    fs.writeFileSync('public/assets/props/school_badge_loshnitsa.png', Buffer.from(badge.replace(/^data:image\/png;base64,/, ''), 'base64'));
    fs.writeFileSync('public/assets/environments/scene01b_school.jpg', Buffer.from(schoolBg.replace(/^data:image\/jpeg;base64,/, ''), 'base64'));
    console.log('Successfully updated scene01b_school.jpg and school_badge_loshnitsa.png!', coords);
  } else {
    console.error('Error:', evalRes);
  }

  ws.close();
}

run();
