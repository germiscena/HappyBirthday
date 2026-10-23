import fs from 'fs';
import http from 'http';

async function run() {
  const tabs = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = tabs.find(t => t.type === 'page');
  if (!page) {
    console.error('No page found');
    process.exit(1);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  ws.onopen = async () => {
    try {
      await send('Page.enable');
      await send('Runtime.enable');

      await send('Page.navigate', { url: 'http://localhost:5173/?scene=scene08' });
      await new Promise(r => setTimeout(r, 2000));

      // Click on tooth cake or show modal
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            window.birthdayModal.show();
            const btnBlow = document.querySelector('#btn-blow-candles');
            if (btnBlow) btnBlow.click();
          })()
        `
      });

      await new Promise(r => setTimeout(r, 800));

      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(screenshot.data, 'base64');

      fs.writeFileSync('d:/Projects/ДР/public/scene8_candles_blown_modal_view.png', buffer);
      fs.writeFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/scene8_candles_blown_modal_view.png', buffer);

      console.log('Candles blown screenshot saved successfully!');
      ws.close();
      process.exit(0);
    } catch (e) {
      console.error(e);
      ws.close();
      process.exit(1);
    }
  };
}

run();
