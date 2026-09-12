const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('localAssets', {
  list: () => ipcRenderer.invoke('assets:list'),
  read: rel => ipcRenderer.invoke('assets:read', rel)
});
