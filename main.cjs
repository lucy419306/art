const {app,BrowserWindow,Menu,ipcMain}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
ipcMain.handle('assets:list', async () => {
 const result=[];
 async function walk(relative) {
  const entries=await fs.readdir(path.join(__dirname,relative),{withFileTypes:true});
  for(const entry of entries) {
   const child=relative+'/'+entry.name;
   if(entry.isDirectory()) await walk(child);
   else if(entry.isFile() && /\.(mp3|mp4)$/i.test(entry.name)) result.push('../'+child);
  }
 }
 await walk('assets');
 return result;
});
const dev = process.argv.includes('--dev');
const both = process.argv.includes('--both');

function createWindow(isDev, x, y) {
  const options = {
    width: 1300,
    height: 820,
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
    { label: '显示', submenu: [{ role: 'togglefullscreen', accelerator: 'F11' }, { role: 'reload' }, { role: 'toggleDevTools' }] }
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
