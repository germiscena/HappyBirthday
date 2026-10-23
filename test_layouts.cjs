const { spawn } = require('child_process');
const fs = require('fs');

async function testLayout(setupFnName, outName) {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--window-size=1280,720',
    'http://localhost:5173/?scene=scene06'
  ]);
  await new Promise(r => setTimeout(r, 2000));

  const listRes = await fetch('http://127.0.0.1:9227/json');
  const tabs = await listRes.json();
  const pageTab = tabs.find(t => t.url.includes('localhost:5173'));
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  await new Promise((resolve) => {
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: { expression: `(${setupFnName})()`, awaitPromise: true }
      }));
      setTimeout(() => {
        ws.send(JSON.stringify({ id: 2, method: 'Page.captureScreenshot', params: { format: 'png' } }));
      }, 800);
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 2 && msg.result?.data) {
        fs.writeFileSync('d:\\Projects\\ДР\\' + outName, Buffer.from(msg.result.data, 'base64'));
        console.log('Saved ' + outName);
        resolve();
      }
    };
  });
  ws.close();
  edge.kill();
}

async function run() {
  // Option A: Seamless extension of tiles and floor
  // Room is scaled to 0.5x (width: 480, height: 270) or 0.6x, anchored on floor
  const setupSeamless = `
    () => {
      const scene = window.gameApp.sceneManager.currentScene;
      const { Container, Graphics, Sprite, Assets } = PIXI;
      
      // Clean parallax container
      scene.parallaxContainer.removeChildren();
      
      const roomContainer = new Container();
      scene.parallaxContainer.addChild(roomContainer);
      
      // Background base wall: cream subway tile color
      const wallG = new Graphics();
      // Wall
      wallG.rect(0, 0, 960, 460);
      wallG.fill({ color: 0xeeece8 });
      // Subtle subway tile mortar lines
      for (let y = 0; y < 460; y += 18) {
        wallG.moveTo(0, y);
        wallG.lineTo(960, y);
        wallG.stroke({ color: 0xdcd8d0, width: 1 });
        const row = Math.floor(y / 18);
        const offset = (row % 2) * 20;
        for (let x = offset; x < 960; x += 40) {
          wallG.moveTo(x, y);
          wallG.lineTo(x, y + 18);
          wallG.stroke({ color: 0xdcd8d0, width: 1 });
        }
      }
      // Baseboard molding
      wallG.rect(0, 452, 960, 10);
      wallG.fill({ color: 0x4a2e18 });
      // Parquet floor
      wallG.rect(0, 462, 960, 78);
      wallG.fill({ color: 0xb57842 });
      for (let y = 462; y < 540; y += 14) {
        wallG.moveTo(0, y);
        wallG.lineTo(960, y);
        wallG.stroke({ color: 0x8a5024, width: 1 });
      }
      roomContainer.addChild(wallG);
      
      // Scaled clinic image (reduced by 2x: width = 480, height = 270)
      // Placed so its floor aligns with baseboard at y = 462
      const bgTex = Assets.get('/assets/environments/scene06_clinic.jpg');
      const clinicSprite = new Sprite(bgTex);
      // Half scale of original 960x540 -> 480x270
      clinicSprite.width = 480;
      clinicSprite.height = 270;
      // In 270h, the floor is at 270 * 0.803 = 217px from top of sprite
      // So to place floor at y = 462, sprite.y = 462 - 217 = 245
      clinicSprite.x = 240;
      clinicSprite.y = 245;
      roomContainer.addChild(clinicSprite);
      
      // Now adjust characters: put characters on the floor (y = 472)
      // Olesya and her friends standing on the floor
      const groundY = 474;
      scene.characters.forEach((c) => {
        c.y = groundY;
      });
    }
  `;

  await testLayout(setupSeamless, 'test_seamless_480.png');
}
run();
