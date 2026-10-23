import fs from 'fs';
import http from 'http';
import path from 'path';
import { spawn } from 'child_process';

const ARTIFACT_DIR = 'C:\\Users\\Pasha\\.gemini\\antigravity\\brain\\72da3648-8ca2-4139-9d52-fa527994aebe';

async function ensureBrowser() {
  const check = () => new Promise((resolve) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      resolve(true);
    }).on('error', () => resolve(false));
  });

  const isUp = await check();
  if (!isUp) {
    console.log('Launching Edge in headless CDP mode...');
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const edge = spawn(edgePath, [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--window-size=1024,576',
      'http://localhost:5173/'
    ], { detached: true, stdio: 'ignore' });
    edge.unref();

    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 400));
      if (await check()) {
        console.log('Edge CDP is ready on port 9222.');
        return;
      }
    }
    throw new Error('Failed to launch Edge with CDP port 9222');
  }
}

async function run() {
  console.log('=== CAPTURING POLISHED SCENES FOR FINAL ART REVIEW ===\n');
  await ensureBrowser();

  const tabs = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = tabs.find(t => t.type === 'page' && (t.title.includes('Дорога жизни') || t.title.includes('Timeline') || t.url?.includes('5173')));
  if (!page) {
    console.error('ERROR: Game page not found!');
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

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');
  await send('Runtime.enable');

  async function evaluate(code) {
    const res = await send('Runtime.evaluate', {
      expression: code,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${res.exceptionDetails.text}`);
    }
    return res.result?.value;
  }

  async function captureSceneScreenshot(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${filename}`);
  }

  async function captureClipScreenshot(filename, clip) {
    const res = await send('Page.captureScreenshot', { format: 'png', clip });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved close-up screenshot: ${filename}`);
  }

  console.log('Navigating to game and reloading...');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2000));

  // Dismiss start screen overlay to reveal canvas
  await evaluate(`
    (() => {
      const btn = document.getElementById('btn-start');
      if (btn) btn.click();
      const startScreen = document.getElementById('start-screen');
      if (startScreen) startScreen.style.display = 'none';
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));

  const scenes = [
    { index: 0, id: 'scene01', name: 'polished_scene01_baseline.png' },
    { index: 1, id: 'scene01b', name: 'polished_scene01b_first_grade.png' },
    { index: 2, id: 'scene02', name: 'polished_scene02.png' },
    { index: 3, id: 'scene03', name: 'polished_scene03.png' },
    { index: 4, id: 'scene04', name: 'polished_scene04.png' },
    { index: 5, id: 'scene05', name: 'polished_scene05.png' },
    { index: 6, id: 'scene06', name: 'polished_scene06.png' },
    { index: 7, id: 'scene07', name: 'polished_scene07.png' },
    { index: 8, id: 'scene07b', name: 'polished_scene07b.png' },
    { index: 9, id: 'scene08', name: 'polished_scene08.png' }
  ];

  for (const s of scenes) {
    console.log(`Navigating to ${s.id} (index ${s.index})...`);
    await evaluate(`window.gameApp.timelineController.setIndex(${s.index})`);
    await new Promise(r => setTimeout(r, 1400));
    await captureSceneScreenshot(s.name);
    if (s.id === 'scene08') {
      console.log('Capturing high-resolution close-up of 23 balloons in Scene 08...');
      const clip = await evaluate(`
        (() => {
          const canvas = document.querySelector('#game-container canvas');
          if (!canvas) return { x: 395, y: 105, width: 235, height: 120, scale: 1 };
          const rect = canvas.getBoundingClientRect();
          const sx = rect.width / 1024;
          const sy = rect.height / 576;
          return {
            x: Math.round(rect.left + 390 * sx),
            y: Math.round(rect.top + 100 * sy),
            width: Math.round(245 * sx),
            height: Math.round(125 * sy),
            scale: 2
          };
        })()
      `);
      await captureClipScreenshot('balloons_23_closeup.png', clip);
    }
  }

  // Also capture photographer click interaction on Scene 01b
  console.log('Capturing Scene 01b photographer interaction...');
  await evaluate(`window.gameApp.timelineController.setIndex(1)`);
  await new Promise(r => setTimeout(r, 1200));
  await evaluate(`window.gameApp.sceneManager.currentScene.photographer.onClick()`);
  await new Promise(r => setTimeout(r, 400));
  await captureSceneScreenshot('scene01b_photographer_dialogue.png');

  console.log('\nAll polished scene screenshots captured successfully!');
  ws.close();
  process.exit(0);
}

run().catch(err => {
  console.error('Error during polished scene capture:', err);
  process.exit(1);
});
