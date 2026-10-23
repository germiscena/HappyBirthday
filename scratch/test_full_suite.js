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
  console.log('=== STARTING AUTOMATED TEST SUITE: TIMELINE ROAD TO 23 ===\n');
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
    console.error('ERROR: Timeline page not found in CDP tabs!');
    process.exit(1);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();
  const consoleErrors = [];
  const testResults = [];

  function record(testName, passed, details = '') {
    testResults.push({ testName, passed, details });
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${testName} ${details ? '(' + details + ')' : ''}`);
  }

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
    } else if (data.method === 'Runtime.consoleAPICalled') {
      if (data.params.type === 'error') {
        const text = data.params.args.map(a => a.value || a.description || '').join(' ');
        consoleErrors.push(text);
        console.warn('Browser Console Error:', text);
      }
    } else if (data.method === 'Runtime.exceptionThrown') {
      const text = data.params.exceptionDetails?.text || 'Uncaught exception';
      consoleErrors.push(text);
      console.warn('Browser Exception:', text);
    }
  };

  async function evaluate(code) {
    const res = await send('Runtime.evaluate', {
      expression: code,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'Eval error');
    }
    return res.result?.value;
  }

  ws.onopen = async () => {
    try {
      await send('Page.enable');
      await send('Runtime.enable');

      // Navigate to scene 01 cleanly
      console.log('Step 1: Navigating to base URL...');
      await send('Page.navigate', { url: 'http://localhost:5173/' });
      await new Promise(r => setTimeout(r, 2000));

      // ----------------------------------------------------
      // TEST 1: Initial Scene 1 Verification & Cat in Scene 1
      // ----------------------------------------------------
      console.log('\n--- Running Test 1: Scene 1 Validation & Cat (Нюша) in Scene 1 ---');
      const scene1Data = await evaluate(`
        (() => {
          const s = window.gameApp.sceneManager.currentScene;
          const hasCat = !!s.cat;
          const charNames = (s.characters || []).map(c => c.name);
          const hasButterfly = !!s.butterfly;
          return {
            id: s.id,
            hasCat,
            charNames,
            hasButterfly,
            toddlerWandering: s.isWandering
          };
        })()
      `);
      record('Scene 1 loaded correctly', scene1Data.id === 'scene01', `Scene ID: ${scene1Data.id}`);
      record('Cat (Нюша) is present in Scene 1', scene1Data.hasCat && scene1Data.charNames.includes('cat'), `Chars: ${scene1Data.charNames.join(', ')}`);
      record('Butterfly is present in Scene 1', scene1Data.hasButterfly);
      record('Toddler wander animation is active', scene1Data.toddlerWandering === true);

      // ----------------------------------------------------
      // TEST 2: Hitboxes & Interactions in Scene 1
      // ----------------------------------------------------
      console.log('\n--- Running Test 2: Hitbox & Interactions in Scene 1 ---');
      const s1ClickTest = await evaluate(`
        (() => {
          const s = window.gameApp.sceneManager.currentScene;
          // Click dad
          s.dad.onClick();
          const bubbleAfterDad = document.querySelector('.dialog-bubble .dialog-speaker')?.textContent;
          // Click cat
          s.cat.onClick();
          const bubbleAfterCat = document.querySelector('.dialog-bubble .dialog-speaker')?.textContent;
          // Click butterfly
          s.butterfly.burstSparkles();
          const boosted = s.butterfly.isBoosted;

          return {
            bubbleAfterDad,
            bubbleAfterCat,
            boosted,
            dadY: s.dad.bodyContainer.y,
            catY: s.cat.bodyContainer.y
          };
        })()
      `);
      record('Dad click displays dialogue', s1ClickTest.bubbleAfterDad === 'Папа', s1ClickTest.bubbleAfterDad);
      record('Cat click displays dialogue & purr', s1ClickTest.bubbleAfterCat?.includes('Нюша'), s1ClickTest.bubbleAfterCat);
      record('Butterfly burstSparkles safely boosts height', s1ClickTest.boosted === true);

      // Wait 350ms to verify jump resets to ground level
      await new Promise(r => setTimeout(r, 400));
      const s1GroundTest = await evaluate(`
        (() => {
          const s = window.gameApp.sceneManager.currentScene;
          return {
            dadGrounded: s.dad.bodyContainer.y === -s.dad.charHeight,
            catGrounded: s.cat.bodyContainer.y === -s.cat.charHeight
          };
        })()
      `);
      record('Character jump resets cleanly to ground (no floating)', s1GroundTest.dadGrounded && s1GroundTest.catGrounded);

      // ----------------------------------------------------
      // TEST 3: Stepping through all scenes (1 -> 8)
      // ----------------------------------------------------
      console.log('\n--- Running Test 3: Advancing Through All Scenes (1 to 8) ---');
      const expectedScenes = [
        'scene01', 'scene01b', 'scene02', 'scene03', 'scene04',
        'scene05', 'scene06', 'scene07', 'scene07b', 'scene08'
      ];

      for (let i = 1; i < expectedScenes.length; i++) {
        const targetSceneId = expectedScenes[i];
        await evaluate(`window.gameApp.timelineController.goForward()`);
        await new Promise(r => setTimeout(r, 1200));

        const sceneStatus = await evaluate(`
          (() => {
            const s = window.gameApp.sceneManager.currentScene;
            const idx = window.gameApp.timelineController.currentIndex;
            const bubbleVisible = !!document.querySelector('.dialog-bubble');
            const topTitle = window.gameApp.timelineBar.titleText.text;
            const is01b = s?.id === 'scene01b';
            let s01bDetails = null;
            if (is01b) {
              s01bDetails = {
                hasDad: !!s.dad,
                hasMom: !!s.mom,
                hasOlesya: !!s.olesya,
                hasSister: !!s.sister,
                hasPhotographer: !!s.photographer,
                hasFestiveStand: !!s.festiveStand
              };
            }
            return {
              id: s?.id,
              idx,
              bubbleVisible,
              charCount: (s?.characters || []).length,
              topTitle,
              s01bDetails
            };
          })()
        `);

        record(
          `Scene step to ${targetSceneId}`,
          sceneStatus.id === targetSceneId,
          `Index: ${sceneStatus.idx}, Chars: ${sceneStatus.charCount}`
        );
        record(
          `Dialogue bubble dismissed on scene transition to ${targetSceneId}`,
          sceneStatus.bubbleVisible === false
        );

        if (targetSceneId === 'scene01b') {
          record(
            'Scene 01b (1 сентября) title in top HUD is "Дорога жизни - путь к 23"',
            sceneStatus.topTitle === 'Дорога жизни - путь к 23',
            sceneStatus.topTitle
          );
          record(
            'Scene 01b family & photographer verified (Dad, Mom, Olesya, Sister, Photographer)',
            sceneStatus.s01bDetails?.hasDad &&
            sceneStatus.s01bDetails?.hasMom &&
            sceneStatus.s01bDetails?.hasOlesya &&
            sceneStatus.s01bDetails?.hasSister &&
            sceneStatus.s01bDetails?.hasPhotographer
          );
        }
      }

      // ----------------------------------------------------
      // TEST 4: Comprehensive Audit of Final Scene (Scene 8)
      // ----------------------------------------------------
      console.log('\n--- Running Test 4: Critical Audit of Scene 8 (Cat Removal & Tooth Cake) ---');
      const scene8Audit = await evaluate(`
        (() => {
          const s = window.gameApp.sceneManager.currentScene;
          const hasCatProp = 'cat' in s && s.cat !== null && s.cat !== undefined;
          const charNames = (s.characters || []).map(c => c.name);
          const hasCatInChars = charNames.some(n => n.toLowerCase().includes('cat') || n.toLowerCase().includes('кот') || n.toLowerCase().includes('нюш'));
          const childrenNames = s.children.map(c => c.name || c.constructor?.name);
          const hasTable = !!s.tableContainer;
          const hasModal = !!window.birthdayModal;
          const candleCount = s.candles?.length || 0;

          return {
            id: s.id,
            hasCatProp,
            hasCatInChars,
            charNames,
            hasTable,
            hasModal,
            candleCount
          };
        })()
      `);

      record('Scene 8 is active', scene8Audit.id === 'scene08');
      record('CAT IS COMPLETELY REMOVED from Scene 8 property', scene8Audit.hasCatProp === false);
      record('CAT IS COMPLETELY REMOVED from Scene 8 character list', scene8Audit.hasCatInChars === false);
      record('All 9 key characters are present in Scene 8', scene8Audit.charNames.length === 9, `Chars: ${scene8Audit.charNames.join(', ')}`);
      record('Tooth Cake Table exists with interactive container', scene8Audit.hasTable);
      record('Birthday candles are present on the cake', scene8Audit.candleCount === 3, `Candles: ${scene8Audit.candleCount}`);

      // ----------------------------------------------------
      // TEST 5: Interactive Birthday Modal & Blowing Candles
      // ----------------------------------------------------
      console.log('\n--- Running Test 5: Birthday Modal & Candle Blow Mechanics ---');
      const modalOpenRes = await evaluate(`
        (() => {
          // Click the cake table to trigger modal
          const s = window.gameApp.sceneManager.currentScene;
          s.tableContainer.emit('pointerdown', { stopPropagation: () => {} });
          const modalEl = document.getElementById('birthday-modal');
          const isVisible = modalEl && !modalEl.classList.contains('hidden');
          return { isVisible };
        })()
      `);
      record('Clicking Tooth Cake opens Birthday Modal', modalOpenRes.isVisible === true);

      // Blow candles
      const blowCandlesRes = await evaluate(`
        (() => {
          window.birthdayModal.blowCandles();
          const s = window.gameApp.sceneManager.currentScene;
          const wishNotice = document.getElementById('wish-notification');
          const wishVisible = wishNotice && !wishNotice.classList.contains('hidden');
          const candlesExtinguished = s.candlesExtinguished;
          const allFlamesHidden = s.candles.every(f => f.visible === false);

          return {
            wishVisible,
            candlesExtinguished,
            allFlamesHidden
          };
        })()
      `);
      record('Blowing candles shows wish notification', blowCandlesRes.wishVisible === true);
      record('Blowing candles sets scene candlesExtinguished = true', blowCandlesRes.candlesExtinguished === true);
      record('Blowing candles hides all flame sprites', blowCandlesRes.allFlamesHidden === true);

      // ----------------------------------------------------
      // TEST 6: Timeline Restart & Cat Persistence in Scene 1
      // ----------------------------------------------------
      console.log('\n--- Running Test 6: Restart Journey & Cat in Scene 1 Verification ---');
      const restartRes = await evaluate(`
        (() => {
          const restartBtn = document.getElementById('btn-restart-timeline');
          restartBtn.click();
          return {
            modalClosed: document.getElementById('birthday-modal').classList.contains('hidden')
          };
        })()
      `);
      record('Clicking Restart closes Birthday Modal', restartRes.modalClosed === true);

      // Wait for scene 1 to load
      await new Promise(r => setTimeout(r, 1500));
      const postRestartStatus = await evaluate(`
        (() => {
          const s = window.gameApp.sceneManager.currentScene;
          const hasCat = !!s.cat;
          const catCharPresent = (s.characters || []).some(c => c.name === 'cat');
          const toddlerWalking = s.isWandering;
          return {
            id: s.id,
            hasCat,
            catCharPresent,
            toddlerWalking
          };
        })()
      `);
      record('Restart successfully loaded Scene 1', postRestartStatus.id === 'scene01', `Current: ${postRestartStatus.id}`);
      record('CAT REMAINS FULLY FUNCTIONAL in Scene 1 after restart', postRestartStatus.hasCat && postRestartStatus.catCharPresent);
      record('Toddler walking safely resumed in Scene 1 without leaks', postRestartStatus.toddlerWalking === true);

      // ----------------------------------------------------
      // TEST 7: Interactive Milestone Pips Scrubbing Test
      // ----------------------------------------------------
      console.log('\n--- Running Test 7: Direct Scrubbing via Interactive Milestone Pips ---');
      // Jump directly to Dental Clinic (now index 6)
      await evaluate(`window.gameApp.timelineController.setIndex(6)`);
      await new Promise(r => setTimeout(r, 1200));

      const pipJumpRes = await evaluate(`
        (() => {
          const s = window.gameApp.sceneManager.currentScene;
          const idx = window.gameApp.timelineController.currentIndex;
          return { id: s.id, idx };
        })()
      `);
      record('Direct scrub jump to index 6 (Dental Clinic) succeeded', pipJumpRes.id === 'scene06' && pipJumpRes.idx === 6, `Scene: ${pipJumpRes.id}`);

      // Rapid back-and-forth scrub test
      console.log('\n--- Running Test 8: Rapid Scrubbing Stress Test ---');
      await evaluate(`
        (() => {
          // Rapidly call setIndex 5 times in a row
          window.gameApp.timelineController.setIndex(2);
          window.gameApp.timelineController.setIndex(4);
          window.gameApp.timelineController.setIndex(1);
          window.gameApp.timelineController.setIndex(8);
        })()
      `);
      // Wait for in-flight transitions to settle
      await new Promise(r => setTimeout(r, 1500));
      const settledStatus = await evaluate(`
        (() => {
          return {
            isTransitioning: window.gameApp.timelineController.isTransitioning,
            currentScene: window.gameApp.sceneManager.currentScene.id
          };
        })()
      `);
      record('System gracefully settled without deadlock after rapid clicks', settledStatus.isTransitioning === false, `Scene: ${settledStatus.currentScene}`);

      // ----------------------------------------------------
      // TEST 9: Console Errors & Exceptions Audit
      // ----------------------------------------------------
      console.log('\n--- Running Test 9: Browser Console Error Audit ---');
      record('Zero uncaught exceptions or errors in console', consoleErrors.length === 0, `Errors: ${consoleErrors.length}`);

      // Capture final verification screenshot
      console.log('\nCapturing final verification screenshot...');
      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(screenshot.data, 'base64');
      fs.writeFileSync('C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/qa_full_suite_verified.png', buffer);
      console.log('Saved QA verification screenshot to qa_full_suite_verified.png');

      // Summary
      const passedCount = testResults.filter(t => t.passed).length;
      const totalCount = testResults.length;
      console.log(`\n========================================`);
      console.log(`TEST SUITE FINISHED: ${passedCount}/${totalCount} TESTS PASSED`);
      console.log(`========================================\n`);

      ws.close();
      process.exit(passedCount === totalCount ? 0 : 1);
    } catch (e) {
      console.error('Test script crashed:', e);
      ws.close();
      process.exit(1);
    }
  };
}

run();
