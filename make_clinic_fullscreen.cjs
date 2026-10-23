const { spawn } = require('child_process');
const fs = require('fs');

async function makeClinic() {
  const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9240',
    'http://localhost:5173/?scene=scene06'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const listRes = await fetch('http://127.0.0.1:9240/json');
  const tabs = await listRes.json();
  const pageTab = tabs.find(t => t.url.includes('localhost:5173'));
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  await new Promise((resolve) => {
    ws.onopen = () => {
      const expr = `
        new Promise((res) => {
          const img = new Image();
          img.onload = () => {
            const W = 960;
            const H = 540;
            const canvas = document.createElement('canvas');
            canvas.width = W;
            canvas.height = H;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;

            const floorY = 446; // Baseboard line

            // 1. TILE THE SUBWAY TILE WALL
            // Sample clean subway tile patch from original img (x: 220..520, y: 70..210)
            const tileCanvas = document.createElement('canvas');
            tileCanvas.width = 120;
            tileCanvas.height = 70;
            const tctx = tileCanvas.getContext('2d');
            tctx.drawImage(img, 240, 80, 240, 140, 0, 0, 120, 70);
            const wallPattern = ctx.createPattern(tileCanvas, 'repeat');
            ctx.fillStyle = wallPattern;
            ctx.fillRect(0, 0, W, floorY);

            // Sunlight diagonal beam gradient across wall
            const sunGrad = ctx.createLinearGradient(100, 40, 450, 440);
            sunGrad.addColorStop(0, 'rgba(255, 248, 220, 0.35)');
            sunGrad.addColorStop(0.5, 'rgba(255, 235, 180, 0.18)');
            sunGrad.addColorStop(1, 'rgba(255, 235, 180, 0.0)');
            ctx.fillStyle = sunGrad;
            ctx.beginPath();
            ctx.moveTo(40, 20);
            ctx.lineTo(260, 20);
            ctx.lineTo(520, floorY);
            ctx.lineTo(160, floorY);
            ctx.closePath();
            ctx.fill();

            // 2. TILE THE HONEY-OAK PARQUET FLOOR
            // Sample clean parquet floor patch from original img (x: 600..900, y: 640..760)
            const floorCanvas = document.createElement('canvas');
            floorCanvas.width = 180;
            floorCanvas.height = 94;
            const fctx = floorCanvas.getContext('2d');
            fctx.drawImage(img, 600, 640, 300, 128, 0, 0, 180, 94);
            const floorPattern = ctx.createPattern(floorCanvas, 'repeat');
            ctx.fillStyle = floorPattern;
            ctx.fillRect(0, floorY, W, H - floorY);

            // Subtle sunlight sheen on parquet floor
            const floorSheen = ctx.createLinearGradient(200, floorY, 480, H);
            floorSheen.addColorStop(0, 'rgba(255, 240, 200, 0.28)');
            floorSheen.addColorStop(0.7, 'rgba(255, 220, 160, 0.12)');
            floorSheen.addColorStop(1, 'rgba(255, 220, 160, 0.0)');
            ctx.fillStyle = floorSheen;
            ctx.fillRect(0, floorY, W, H - floorY);

            // 3. BASEBOARD MOLDING (clean dark oak trim along floorY)
            ctx.fillStyle = '#3a2012';
            ctx.fillRect(0, floorY - 5, W, 7);
            ctx.fillStyle = '#61381e';
            ctx.fillRect(0, floorY - 5, W, 2); // highlight lip
            ctx.fillStyle = '#22120a';
            ctx.fillRect(0, floorY + 1, W, 2); // bottom shadow line

            // 4. CEILING CROWN MOLDING (clean warm oak trim along top)
            ctx.fillStyle = '#4a2c16';
            ctx.fillRect(0, 0, W, 14);
            ctx.fillStyle = '#7a4e28';
            ctx.fillRect(0, 12, W, 2); // lower reveal
            ctx.fillStyle = '#2d180c';
            ctx.fillRect(0, 14, W, 1); // shadow line

            // 5. WINDOW ON LEFT WALL
            // In img: x: 0..155, y: 20..740. Realistic human scale in 960x540:
            // Width: 75px, Height: 390px, top at 20, bottom at 410
            ctx.drawImage(img, 0, 20, 155, 720, 0, 15, 75, 430);

            // 6. MONSTERA PLANT ON STOOL
            // In img: x: 125..265, y: 415..725 (width 140, height 310)
            // Scaled realistically: width: 70px, height: 155px
            // Stool legs touch floor at floorY = 446
            const plantW = 68;
            const plantH = 152;
            const plantX = 140;
            const plantY = floorY + 2 - plantH;
            ctx.drawImage(img, 125, 415, 140, 310, plantX, plantY, plantW, plantH);

            // 7. DENTAL PATIENT CHAIR & OVERHEAD EXAMINATION LAMP
            // In img: x: 260..570, y: 245..740 (width 310, height 495)
            // Scaled realistically to fit 150px patient & 176px doctor:
            // Width: 185px, Height: 245px (chair seat at y ~ 420, headrest at y ~ 365, lamp reaches y ~ 215)
            const chairW = 185;
            const chairH = 245;
            const chairX = 215;
            const chairY = floorY + 8 - chairH; // base on floor
            ctx.drawImage(img, 260, 245, 310, 495, chairX, chairY, chairW, chairH);

            // 8. DIPLOMA & WALL CLOCK
            // In img: Diploma is x: 540..645, y: 200..345 (width 105, height 145)
            // Clock is x: 665..740, y: 200..330 (width 75, height 130)
            // Mounted on wall above head height (heads are at ~310)
            const dipW = 58;
            const dipH = 78;
            const dipX = 460;
            const dipY = 120;
            ctx.drawImage(img, 540, 200, 105, 145, dipX, dipY, dipW, dipH);

            const clockW = 44;
            const clockH = 68;
            const clockX = 535;
            const clockY = 125;
            ctx.drawImage(img, 665, 200, 75, 130, clockX, clockY, clockW, clockH);

            // 9. MEDICAL CABINETRY & COUNTERTOP (RIGHT SIDE)
            // Lower Counter: countertop at waist height y = 415
            // In img: lower counter is x: 705..1376, y: 565..740 (height 175)
            const counterTopY = 415;
            const lowerCabH = floorY + 4 - counterTopY; // 35px
            const cabX = 660;
            const cabW = W - cabX; // 300px
            ctx.drawImage(img, 705, 565, 671, 175, cabX, counterTopY, cabW, lowerCabH);

            // Countertop items: Microwave/Autoclave, cotton jar, metal tray
            // In img: microwave is x: 720..855, y: 440..565 (width 135, height 125)
            const microW = 75;
            const microH = 68;
            const microX = 675;
            const microY = counterTopY - microH + 3;
            ctx.drawImage(img, 720, 440, 135, 125, microX, microY, microW, microH);

            // Cotton jar: x: 860..900, y: 490..565
            const jarW = 20;
            const jarH = 40;
            const jarX = microX + microW + 12;
            const jarY = counterTopY - jarH + 2;
            ctx.drawImage(img, 860, 490, 40, 75, jarX, jarY, jarW, jarH);

            // Metal instrument tray: x: 905..985, y: 540..565
            const trayW = 45;
            const trayH = 14;
            const trayX = jarX + jarW + 10;
            const trayY = counterTopY - trayH + 2;
            ctx.drawImage(img, 905, 540, 80, 25, trayX, trayY, trayW, trayH);

            // Upper oak cupboards:
            // In img: x: 760..1376, y: 110..380 (width 616, height 270)
            // Mounted from y = 70 to y = 215 (height 145px)
            // Bottom at y = 215 is 95px ABOVE students' heads!
            const upperW = 260;
            const upperH = 145;
            const upperX = W - upperW;
            const upperY = 65;
            ctx.drawImage(img, 760, 110, 616, 270, upperX, upperY, upperW, upperH);

            res(canvas.toDataURL('image/png'));
          };
          img.src = '/assets/environments/scene06_clinic.jpg';
        });
      `;
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, awaitPromise: true, returnByValue: true } }));
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 1 && msg.result?.result?.value) {
        const base64 = msg.result.result.value.split(',')[1];
        fs.writeFileSync('public/assets/environments/scene06_clinic_clean.png', Buffer.from(base64, 'base64'));
        console.log('Saved public/assets/environments/scene06_clinic_clean.png');
        resolve();
      }
    };
  });
  ws.close();
  edge.kill();
}
makeClinic();
