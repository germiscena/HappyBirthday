import fs from 'fs';
import http from 'http';
import { ensureBrowser } from './browser_helper.js';

async function testClickCrest() {
  const proc = await ensureBrowser();

  const tabs = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9222/json', r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
  const page = tabs.find(t => t.type === 'page' && (t.url?.includes('5173') || t.title.includes('Timeline') || t.title.includes('Дорога жизни')));
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

  await send('Page.enable');
  await send('Runtime.enable');

  // Trigger click on festiveStand in Scene 01b
  const clickRes = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `
      (async () => {
        if (window.gameApp && window.gameApp.timelineController) {
          window.gameApp.timelineController.setIndex(1);
          await new Promise(r => setTimeout(r, 1200));
        }
        const curScene = window.gameApp?.sceneManager?.currentScene;
        if (curScene && curScene.festiveStand) {
          curScene.festiveStand.emit('pointerdown');
          curScene.festiveStand.onClick();
          return 'clicked festiveStand successfully!';
        }
        return 'still no festiveStand';
      })()
    `
  });

  console.log('Click result:', clickRes);
  await new Promise(r => setTimeout(r, 800));

  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/scene01b_crest_dialog_verified.png', Buffer.from(screenshot.data, 'base64'));

  console.log('Saved scene01b_crest_dialog_verified.png');
  ws.close();
  if (proc) proc.kill();
  process.exit(0);
}
testClickCrest();
