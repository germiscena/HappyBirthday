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

        // Find the exact Y where the dark banner ends across multiple X points
        const tempCvs = document.createElement('canvas');
        tempCvs.width = img.width;
        tempCvs.height = img.height;
        const tempCtx = tempCvs.getContext('2d');
        tempCtx.drawImage(img, 0, 0);

        let bannerEndY = 0;
        for (let y = 0; y < 80; y++) {
          let darkCount = 0;
          for (let x = 100; x < img.width - 100; x += 50) {
            const [r, g, b] = tempCtx.getImageData(x, y, 1, 1).data;
            // Check if dark banner color (r < 50 && g < 50 && b < 50)
            if (r < 40 && g < 40 && b < 40) darkCount++;
          }
          if (darkCount > 10) {
            bannerEndY = y;
          }
        }

        // Create a cleaned canvas without the banner
        // We crop from bannerEndY + 2 to img.height, or we draw the sky up into the banner area
        const cvs = document.createElement('canvas');
        cvs.width = img.width;
        cvs.height = img.height;
        const ctx = cvs.getContext('2d');

        // Draw the full image
        ctx.drawImage(img, 0, 0);

        // Fill the banner area with the sky color or clone the sky row upwards
        const skyY = bannerEndY + 3;
        const skyPatternCanvas = document.createElement('canvas');
        skyPatternCanvas.width = img.width;
        skyPatternCanvas.height = 1;
        const skyPatternCtx = skyPatternCanvas.getContext('2d');
        skyPatternCtx.drawImage(img, 0, skyY, img.width, 1, 0, 0, img.width, 1);

        for (let y = 0; y <= skyY; y++) {
          ctx.drawImage(skyPatternCanvas, 0, y);
        }

        return {
          bannerEndY,
          cleanedDataUrl: cvs.toDataURL('image/jpeg', 0.95)
        };
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Detected bannerEndY:', res.result?.value?.bannerEndY);
  const data = res.result?.value?.cleanedDataUrl;
  if (data) {
    const base64 = data.replace(/^data:image\/jpeg;base64,/, '');
    fs.writeFileSync('public/assets/environments/scene01_house.jpg', Buffer.from(base64, 'base64'));
    console.log('Saved cleaned public/assets/environments/scene01_house.jpg without banner!');
  }
  ws.close();
}
run();
