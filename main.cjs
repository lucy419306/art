const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

ipcMain.handle('assets:list', async () => {
  const result = [];
  async function walk(relative) {
    const entries = await fs.readdir(path.join(__dirname, relative), { withFileTypes: true });
    for (const entry of entries) {
      const child = relative + '/' + entry.name;
      if (entry.isDirectory()) await walk(child);
      else if (entry.isFile() && /\.(mp3|mp4)$/i.test(entry.name)) result.push('../' + child);
    }
  }
  await walk('assets');
  return result;
});

ipcMain.handle('assets:read', async (_, relative) => {
  try {
    const cleanRel = String(relative || '').replace(/^\.\.\//, '');
    const buf = await fs.readFile(path.join(__dirname, cleanRel));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch (e) {
    return null;
  }
});

ipcMain.on('window:fullscreen-request', (event, on) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) win.setFullScreen(!!on);
});

const dev = process.argv.includes('--dev');
const both = process.argv.includes('--both');

function createWindow(isDev, x, y) {
  const options = {
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: '#070a0d',
    title: isDev ? '最后一次选择 · 管理者模式' : '最后一次选择 · 观众端',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  };
  if (typeof x === 'number' && typeof y === 'number') {
    options.x = x;
    options.y = y;
  }
  const win = new BrowserWindow(options);
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: app.name, submenu: [{ role: 'quit' }] },
    {
      label: '显示',
      submenu: [
        { label: '进入全屏', click: () => win.setFullScreen(true) },
        { label: '退出全屏', click: () => win.setFullScreen(false) },
        { role: 'togglefullscreen', accelerator: 'F11' },
        { role: 'reload' },
        { role: 'toggleDevTools' }
      ]
    }
  ]));
  win.loadFile(path.join(__dirname, 'src/index.html'), isDev ? { query: { dev: '1' } } : {});
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
  return win;
}

app.whenReady().then(() => {
  if (both) {
    createWindow(false, 60, 60);
    createWindow(true, 200, 120);
  } else {
    createWindow(dev);
  }
  app.on('activate', () => {
    if (!BrowserWindow.getAllWindows().length) createWindow(dev);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
