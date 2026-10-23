import fs from 'fs';
import http from 'http';
import { ensureBrowser } from './browser_helper.js';

async function restoreBuildingWall() {
  const proc = await ensureBrowser();
  const raw = fs.readFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/scene01b_school_pixel_art_1792655221353.jpg');
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
        const c = document.createElement('canvas');
        const img = new Image();
        img.src = 'data:image/jpeg;base64,' + '${base64}';
        await new Promise(r => img.onload = r);
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // 1. Restore Foundation Base at y=524..580 across x=395..515
        // Sample clean foundation base from x=330..390, y=524..580 (width 60)
        ctx.drawImage(img, 330, 524, 60, 56, 395, 524, 60, 56);
        ctx.drawImage(img, 330, 524, 60, 56, 455, 524, 60, 56);

        // 2. Restore Central Yellow Brick Pier at x=442..470, y=450..524
        // Sample from the same pier above at y=380..450 (height 70)
        ctx.drawImage(img, 442, 380, 28, 70, 442, 450, 28, 70);
        // And bottom 10px of pier
        ctx.drawImage(img, 442, 430, 28, 20, 442, 514, 28, 20);

        // 3. Restore Left Window (Window 4) at x=400..442, y=450..524
        // Window 4 width is ~50. Left side of Window 4 (x=380..405) has the pane and sill!
        // Also Window 3 (x=195..245) or Window 2 (x=115..165) has the entire right side of the window!
        // In Window 2 (x=115..165): right pane + sill is at x=140..165, y=450..524
        ctx.drawImage(img, 137, 450, 42, 74, 400, 450, 42, 74);

        // 4. Restore Right Window (Window 5) at x=470..512, y=450..524
        // In Window 2: left pane + sill is at x=115..145, y=450..524
        ctx.drawImage(img, 115, 450, 42, 74, 470, 450, 42, 74);

        // 5. Restore lawn where pole entered at x=445..465, y=580..635
        // Sample clean lawn grass from x=350..370, y=580..635
        ctx.drawImage(img, 350, 580, 20, 55, 445, 580, 20, 55);

        // Crop the result region around the restored wall
        const cCrop = document.createElement('canvas');
        cCrop.width = 180;
        cCrop.height = 230;
        const ctxCrop = cCrop.getContext('2d');
        ctxCrop.drawImage(c, 370, 420, 180, 230, 0, 0, 180, 230);

        return cCrop.toDataURL('image/png');
      })()
    `
  });

  fs.writeFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/restored_wall_crop.png', Buffer.from(res.result.value.replace(/^data:image\/png;base64,/, ''), 'base64'));
  ws.close();
  if (proc) proc.kill();
  process.exit(0);
}
restoreBuildingWall();
