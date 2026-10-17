const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  login: (key) => ipcRenderer.invoke('login', { key }),
  heartbeat: (key) => ipcRenderer.invoke('heartbeat', { key })
});
