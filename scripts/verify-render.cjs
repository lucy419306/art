// 在隐藏的 Electron 渲染器内验收真实 DOM；测试加速仅存在于测试进程。
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const output = process.env.RENDER_OUTPUT || '/private/tmp/last-choice-render-v14';
ipcMain.handle('assets:list', () => []);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1280, height: 800, webPreferences: {
    offscreen: true, preload: path.join(root, 'preload.cjs'), sandbox: true, contextIsolation: true
  } });
  const errors = [];
  win.webContents.on('console-message', (_event, level, message) => { if (level === 3) errors.push(message); });
  const evaluate = code => win.webContents.executeJavaScript(code);
  const until = async expression => {
    for (let i = 0; i < 600; i++) { if (await evaluate(expression)) return; await delay(50); }
    throw Error('Timed out: ' + expression);
  };
  const capture = async name => {
    const png = await win.webContents.capturePage();
    fs.writeFileSync(path.join(output, name + '.png'), png.toPNG());
  };
  try {
    fs.mkdirSync(output, { recursive: true });
    await win.loadFile(path.join(root, 'src/index.html'));
    await until("gameStatus().phase === 'P0'");
    assert.equal(await evaluate("document.querySelectorAll('#keys .key').length"), 3);
    await capture('standby');
    await evaluate('C.speed = 0.08; C.resetTimeout = 900000; launch(() => certificate());');
    await until("gameStatus().ending === 'C'");
    await delay(900);
    assert.equal(await evaluate("document.querySelector('#certificate-status').textContent"), '交接完成');
    const bounds = await evaluate(`(() => {
      const cert = document.querySelector('.certificate').getBoundingClientRect();
      const content = document.querySelector('#certificate-content').getBoundingClientRect();
      const sign = document.querySelector('.certificate-signatures').getBoundingClientRect();
      return { top: cert.top, bottom: cert.bottom, height: innerHeight, contentBottom: content.bottom, signTop: sign.top };
    })()`);
    assert.ok(bounds.top >= 0 && bounds.bottom <= bounds.height, JSON.stringify(bounds));
    assert.ok(bounds.contentBottom <= bounds.signTop, '正文与签章区重叠: ' + JSON.stringify(bounds));
    await capture('certificate');
    await evaluate("reset(); C.speed = 1; launch(() => endingA('A1'));");
    await until("document.querySelectorAll('.timeline p').length === 3");
    await capture('guidance');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.home-scene')).display"), 'block');
    await evaluate('reset();');
    assert.deepEqual(errors, []);
    console.log('真实渲染验收通过：待机、证书、温馨结尾；输出 ' + output);
    app.exit(0);
  } catch (error) {
    console.error(error); app.exit(1);
  }
});
