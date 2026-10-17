const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { machineIdSync } = require('node-machine-id');
const crypto = require('crypto');

// LINK RENDER CỦA BẠN
const API = 'https://tiktok-key-system-v1.onrender.com';

function getDeviceId() {
  const raw = machineIdSync(true);
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1100, height: 700,
    title: "TikTok Live Finder",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
}

ipcMain.handle('login', async (_e, { key }) => {
  const deviceId = getDeviceId();
  const res = await fetch(API + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, deviceId })
  });
  return await res.json();
});

ipcMain.handle('heartbeat', async (_e, { key }) => {
  const deviceId = getDeviceId();
  const res = await fetch(API + '/api/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, deviceId })
  });
  return await res.json();
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
