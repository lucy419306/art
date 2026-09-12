// 用真实 Electron 渲染器验证普通模式和 --dev 模式共享配音清单，且开发倍速不改变音频速度。
const { app, BrowserWindow, ipcMain } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const fullscreenRequests = [];

ipcMain.handle('assets:list', async () => {
  const result = [];
  async function walk(relative) {
    for (const entry of await fs.readdir(path.join(root, relative), { withFileTypes: true })) {
      const child = relative + '/' + entry.name;
      if (entry.isDirectory()) await walk(child);
      else if (entry.isFile() && /\.(mp3|mp4)$/i.test(entry.name)) result.push('../' + child);
    }
  }
  await walk('assets');
  return result;
});
ipcMain.on('window:fullscreen-request', (event, on) => {
  fullscreenRequests.push(!!on);
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) win.setFullScreen(!!on);
});

async function inspect(win, dev) {
  const errors = [];
  win.webContents.on('console-message', (_event, level, message) => { if (level === 3) errors.push(message); });
  const evaluate = code => win.webContents.executeJavaScript(code);
  const until = async expression => {
    for (let i = 0; i < 200; i++) {
      if (await evaluate(expression)) return;
      await delay(25);
    }
    throw new Error('Timed out: ' + expression);
  };

  await win.loadFile(path.join(root, 'src/index.html'), dev ? { query: { dev: '1' } } : {});
  await until("gameStatus().phase === 'P0'");
  assert.equal(await evaluate("Object.keys(GAME_VOICE_CUES).length"), 79);
  assert.equal(await evaluate("!!document.querySelector('#dev-panel')"), dev);
  assert.equal(await evaluate("typeof windowControls.setFullScreen"), 'function');
  assert.ok(await evaluate("!!media.path('voice', 'p4.meaning')"));

  const requestStart = fullscreenRequests.length;
  await evaluate("window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit9', key: '9' }))");
  await evaluate("window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit0', key: '0' }))");
  for (let i = 0; i < 80 && fullscreenRequests.length < requestStart + 2; i++) await delay(25);
  assert.deepEqual(fullscreenRequests.slice(requestStart), [true, false]);

  await evaluate(`(() => {
    window.__modeSmoke = new AbortController();
    media.play('voice', 'p4.meaning', 1000, window.__modeSmoke.signal).catch(() => {});
    return true;
  })()`);
  await until('media.playing.size > 0');
  await evaluate('setDevSpeed(4)');
  assert.equal(await evaluate('C.speed'), 0.25);
  assert.ok(await evaluate('[...media.playing].every(audio => audio.playbackRate === 1)'));
  await evaluate('window.__modeSmoke.abort(); reset();');
  assert.deepEqual(errors, []);
}

app.whenReady().then(async () => {
  try {
    const win = new BrowserWindow({ show: false, webPreferences: {
      offscreen: true, preload: path.join(root, 'preload.cjs'), sandbox: true, contextIsolation: true
    } });
    await inspect(win, false);
    await inspect(win, true);
    win.destroy();
    console.log('模式验收通过：普通模式与 --dev 模式均加载配音；开发倍速下音频保持 1×。');
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
