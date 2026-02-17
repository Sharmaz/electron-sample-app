const { contextBridge, ipcRenderer } = require('electron');

const INVOKE_CHANNELS = [
  'update:install',
  'update:open-release',
];

const RECEIVE_CHANNELS = [
  'update:available',
  'update:downloaded',
];

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
  },
  ipc: {
    invoke: (channel, ...args) => {
      if (INVOKE_CHANNELS.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error(`Invalid channel: ${channel}`));
    },
    on: (channel, callback) => {
      if (RECEIVE_CHANNELS.includes(channel)) {
        ipcRenderer.on(channel, (_event, ...args) => callback(...args));
      }
    },
    removeListener: (channel, callback) => {
      if (RECEIVE_CHANNELS.includes(channel)) {
        ipcRenderer.removeListener(channel, callback);
      }
    },
  },
});
