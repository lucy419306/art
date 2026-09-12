const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('localAssets', {
  list: () => ipcRenderer.invoke('assets:list')
});
