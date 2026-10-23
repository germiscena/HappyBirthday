const http = require('http');
const fs = require('fs');

async function testFraming() {
  const cdpList = await (await fetch('http://localhost:9222/json')).json();
  const cdp = cdpList.find(c => c.url.includes('localhost:5173')) || cdpList[0];
  const WebSocket = require('ws');
  const ws = new WebSocket(cdp.webSocketDebuggerUrl);
  await new Promise(res => ws.once('open', res));

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (msg) => {
      const resp = JSON.parse(msg);
      if (resp.id === curId) {
        ws.off('message', handler);
        resolve(resp.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.navigate', { url: 'http://localhost:5173/?scene=scene06&autostart=true' });
  await new Promise(r => setTimeout(r, 1200));

  await send('Runtime.evaluate', {
    expression: `
      const sc = window.gameApp.sceneManager.currentScene;
      if (sc && sc.id === 'scene06') {
        const bg = sc.parallaxContainer.children[0];
        bg.width = 1024 * 1.20;
        bg.height = 576 * 1.05;
        bg.x = -135;
        bg.y = -15;
      }
    `
  });

  await new Promise(r => setTimeout(r, 400));
  const snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/test_scene06_framing.png', Buffer.from(snap.data, 'base64'));
  console.log('Saved test_scene06_framing.png');
  ws.close();
}
testFraming();
