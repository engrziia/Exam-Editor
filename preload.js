// === File: preload.js ===
// The preload script is used to securely expose a limited API to the renderer process.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('examAPI', {
  // Use ipcRenderer.invoke for two-way communication with the main process.
  // The submit function will send the exam data and wait for a response.
  submit: (data) => ipcRenderer.invoke('submit-exam', data),

  // Use ipcRenderer.send for one-way communication to the main process.
  // This will instruct the main process to exit the application.
  exitApp: () => ipcRenderer.send('exit-app'),
});