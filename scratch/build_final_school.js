import fs from 'fs';
import http from 'http';
import { ensureBrowser } from './browser_helper.js';

async function buildFinalSchoolEnvironment() {
  const proc = await ensureBrowser();
  const rawBg = fs.readFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/scene01b_school_pixel_art_1792655221353.jpg');
  const base64Bg = rawBg.toString('base64');

  const rawCrest = fs.readFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/.user_uploaded/media_1792663820598_2814470e.png');
  const base64Crest = rawCrest.toString('base64');
  
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
        // ==========================================
        // 1. PROCESS HIGH-RES CREST INTO 16-BIT PIXEL ART
        // ==========================================
        const imgC = new Image();
        imgC.src = 'data:image/png;base64,' + '${base64Crest}';
        await new Promise(r => imgC.onload = r);

        const wC = imgC.naturalWidth;
        const hC = imgC.naturalHeight;
        const cHigh = document.createElement('canvas');
        cHigh.width = wC;
        cHigh.height = hC;
        const ctxH = cHigh.getContext('2d');
        ctxH.drawImage(imgC, 0, 0);

        // Flood fill outside black outline to transparent
        const imgDataC = ctxH.getImageData(0, 0, wC, hC);
        const dataC = imgDataC.data;
        const visited = new Uint8Array(wC * hC);
        const queue = [];
        for (let x = 0; x < wC; x++) {
          queue.push(x);
          queue.push((hC - 1) * wC + x);
        }
        for (let y = 0; y < hC; y++) {
          queue.push(y * wC);
          queue.push(y * wC + (wC - 1));
        }

        while (queue.length > 0) {
          const idx = queue.pop();
          if (visited[idx]) continue;
          visited[idx] = 1;

          const p = idx * 4;
          const r = dataC[p], g = dataC[p + 1], b = dataC[p + 2];
          // Stop strictly at outer black outline of shield
          if (r < 65 && g < 65 && b < 65) continue;

          dataC[p + 3] = 0; // Alpha 0 (transparent outside)

          const px = idx % wC;
          const py = Math.floor(idx / wC);
          if (px > 0 && !visited[idx - 1]) queue.push(idx - 1);
          if (px < wC - 1 && !visited[idx + 1]) queue.push(idx + 1);
          if (py > 0 && !visited[idx - wC]) queue.push(idx - wC);
          if (py < hC - 1 && !visited[idx + wC]) queue.push(idx + wC);
        }
        ctxH.putImageData(imgDataC, 0, 0);

        // Find bounding box of the shield
        let minX = wC, maxX = 0, minY = hC, maxY = 0;
        for (let y = 0; y < hC; y++) {
          for (let x = 0; x < wC; x++) {
            if (dataC[(y * wC + x) * 4 + 3] > 10) {
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

        // Pixel-art badge canvas: width = 84px, height = 98px
        const badgeW = 84;
        const badgeH = 98;
        const cBadge = document.createElement('canvas');
        cBadge.width = badgeW;
        cBadge.height = badgeH;
        const ctxB = cBadge.getContext('2d');
        ctxB.imageSmoothingEnabled = true;
        ctxB.drawImage(cCrop, 2, 2, badgeW - 4, badgeH - 4);

        // Clean pixel art quantization & color tuning
        const bImgData = ctxB.getImageData(0, 0, badgeW, badgeH);
        const bd = bImgData.data;

        for (let i = 0; i < bd.length; i += 4) {
          const a = bd[i + 3];
          if (a < 120) {
            bd[i + 3] = 0;
          } else {
            bd[i + 3] = 255;
            const r = bd[i], g = bd[i + 1], b = bd[i + 2];
            // Outer black/dark outline
            if (r < 60 && g < 60 && b < 60) {
              bd[i] = 18; bd[i + 1] = 20; bd[i + 2] = 28;
            }
            // Crisp white (banner, book pages, inner trim)
            else if (r > 200 && g > 200 && b > 200) {
              bd[i] = 255; bd[i + 1] = 255; bd[i + 2] = 255;
            }
            // Soft white/page shadow
            else if (r > 170 && r <= 200 && g > 180 && b > 190) {
              bd[i] = 226; bd[i + 1] = 232; bd[i + 2] = 240;
            }
            // Sun golden yellow
            else if (r > 190 && g > 150 && b < 100) {
              bd[i] = 251; bd[i + 1] = 191; bd[i + 2] = 36;
            }
            // Sun core orange
            else if (r > 200 && g > 90 && g <= 150 && b < 60) {
              bd[i] = 245; bd[i + 1] = 158; bd[i + 2] = 11;
            }
            // Azure/sky blue shield field
            else if (b > 150 && r < 80 && g > 90) {
              bd[i] = 14; bd[i + 1] = 165; bd[i + 2] = 233;
            }
            // Olive/laurel green
            else if (g > 100 && r < 100 && b < 80) {
              bd[i] = 34; bd[i + 1] = 197; bd[i + 2] = 94;
            }
            // Dark forest green
            else if (g > 50 && g <= 100 && r < 70 && b < 60) {
              bd[i] = 21; bd[i + 1] = 128; bd[i + 2] = 61;
            }
            // Book red cover edge
            else if (r > 160 && g < 80 && b < 80) {
              bd[i] = 225; bd[i + 1] = 29; bd[i + 2] = 72;
            }
          }
        }
        ctxB.putImageData(bImgData, 0, 0);

        // Crisp pixel typography on top white banner:
        // Arched lettering: "ЛОШНИЦКАЯ ГИМНАЗИЯ"
        ctxB.fillStyle = '#0284c7';
        ctxB.font = 'bold 5px -apple-system, sans-serif';
        ctxB.textAlign = 'center';
        ctxB.textBaseline = 'middle';
        ctxB.fillText('ЛОШНИЦКАЯ', badgeW / 2, 8);
        ctxB.font = 'bold 4.5px -apple-system, sans-serif';
        ctxB.fillText('ГИМНАЗИЯ', badgeW / 2, 13);

        // ==========================================
        // 2. CREATE PRECISE SILHOUETTE SHADOW CANVAS
        // ==========================================
        const cShadow = document.createElement('canvas');
        cShadow.width = badgeW;
        cShadow.height = badgeH;
        const ctxSh = cShadow.getContext('2d');
        ctxSh.drawImage(cBadge, 0, 0);
        const shData = ctxSh.getImageData(0, 0, badgeW, badgeH);
        const shd = shData.data;
        for (let i = 0; i < shd.length; i += 4) {
          if (shd[i + 3] > 0) {
            shd[i] = 15;
            shd[i + 1] = 23;
            shd[i + 2] = 42;
            shd[i + 3] = 70; // 28% alpha
          }
        }
        ctxSh.putImageData(shData, 0, 0);

        // ==========================================
        // 3. RESTORE SCHOOL BACKGROUND IMAGE
        // ==========================================
        const imgBg = new Image();
        imgBg.src = 'data:image/jpeg;base64,' + '${base64Bg}';
        await new Promise(r => imgBg.onload = r);

        const cBg = document.createElement('canvas');
        cBg.width = 1376;
        cBg.height = 768;
        const ctxS = cBg.getContext('2d');
        ctxS.drawImage(imgBg, 0, 0);

        // 1. Perfectly restore window panes, frames, sill, and central brick pier:
        // Copy 2nd floor windows + pier (x: 400..512, y: 320..395) down with dy = 132 (y: 452..527)
        ctxS.drawImage(imgBg, 400, 320, 114, 75, 400, 452, 114, 75);

        // 2. Perfectly restore foundation base wall at y=527..585 across x=395..518:
        ctxS.drawImage(imgBg, 325, 527, 60, 58, 395, 527, 60, 58);
        ctxS.drawImage(imgBg, 325, 527, 65, 58, 455, 527, 65, 58);

        // 3. Clean lawn grass at y=580..650 across x=435..475:
        // Sample clean adjacent lawn grass from x=395..425, y=580..650
        ctxS.drawImage(imgBg, 395, 580, 30, 70, 440, 580, 30, 70);

        // ==========================================
        // 4. MOUNT THE PIXEL-ART CREST ON STAND
        // ==========================================
        const poleX = 456;
        const crestW = 84;
        const crestH = 98;
        const crestX = poleX - Math.round(crestW / 2); // 414
        const crestY = 448; // y: 448..546

        // 1. Precise silhouette shadow (offset +2, +3):
        ctxS.drawImage(cShadow, crestX + 2, crestY + 3);

        // 2. Sign Pole (dark metal with highlight):
        // Goes from bottom of shield at y=542 down into lawn at y=630
        ctxS.fillStyle = '#1e293b';
        ctxS.fillRect(poleX - 3, 538, 6, 92);
        ctxS.fillStyle = '#64748b'; // highlight line
        ctxS.fillRect(poleX - 2, 538, 2, 92);
        ctxS.fillStyle = '#0f172a'; // shadow line
        ctxS.fillRect(poleX + 1, 538, 2, 92);

        // 3. Metal Mounting Bracket / Ring:
        ctxS.fillStyle = '#334155';
        ctxS.fillRect(poleX - 10, 538, 20, 5);
        ctxS.fillStyle = '#64748b';
        ctxS.fillRect(poleX - 9, 538, 18, 2);

        // 4. Small grass tuft / ground shadow at base of pole in lawn:
        ctxS.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctxS.beginPath();
        ctxS.ellipse(poleX, 630, 6, 2, 0, 0, Math.PI * 2);
        ctxS.fill();

        // 5. Draw the authentic 16-bit pixel-art crest
        ctxS.imageSmoothingEnabled = false;
        ctxS.drawImage(cBadge, crestX, crestY, crestW, crestH);

        // Crop detailed area around the new crest (x: 370..540, y: 420..640)
        const cCropPreview = document.createElement('canvas');
        cCropPreview.width = 170;
        cCropPreview.height = 220;
        const ctxCP = cCropPreview.getContext('2d');
        ctxCP.drawImage(cBg, 370, 420, 170, 220, 0, 0, 170, 220);

        return {
          badgeBase64: cBadge.toDataURL('image/png'),
          bgBase64: cBg.toDataURL('image/jpeg', 0.96),
          previewBase64: cCropPreview.toDataURL('image/png'),
          coords: { crestX, crestY, crestW, crestH, poleX }
        };
      })()
    `
  });

  const { badgeBase64, bgBase64, previewBase64, coords } = res.result.value;

  fs.writeFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/preview_final_crest.png', Buffer.from(previewBase64.replace(/^data:image\/png;base64,/, ''), 'base64'));
  fs.writeFileSync('public/assets/props/school_badge_loshnitsa.png', Buffer.from(badgeBase64.replace(/^data:image\/png;base64,/, ''), 'base64'));
  fs.writeFileSync('public/assets/environments/scene01b_school.jpg', Buffer.from(bgBase64.replace(/^data:image\/jpeg;base64,/, ''), 'base64'));

  console.log('Final build complete!', coords);
  ws.close();
  if (proc) proc.kill();
  process.exit(0);
}
buildFinalSchoolEnvironment();
