const {app,BrowserWindow,Menu,ipcMain}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
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
ipcMain.on('window:fullscreen-request',(event,on)=>{
 const win=BrowserWindow.fromWebContents(event.sender);
 if(win&&!win.isDestroyed()) win.setFullScreen(!!on);
});
const dev=process.argv.includes('--dev');
function create(){
 const win=new BrowserWindow({width:1440,height:900,minWidth:900,minHeight:650,backgroundColor:'#070a0d',title:'最后一次选择',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:app.name,submenu:[{role:'quit'}]},{label:'显示',submenu:[{label:'进入全屏',click:()=>win.setFullScreen(true)},{label:'退出全屏',click:()=>win.setFullScreen(false)},{role:'reload'},{role:'toggleDevTools'}]}]));
 win.loadFile(path.join(__dirname,'src/index.html'),dev?{query:{dev:'1'}}:{});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',e=>e.preventDefault());
}
app.whenReady().then(()=>{create();app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)create();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
