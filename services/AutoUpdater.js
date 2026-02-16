const { dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

class AutoUpdater {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.checkInterval = null;
    this.isManualCheck = false;

    // CRITICO: nunca descargar ni instalar automáticamente
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.logger = console;

    this._setupEvents();
    this._setupIpcHandlers();
  }

  _setupEvents() {
    // Update disponible → notificar al renderer (banner)
    autoUpdater.on('update-available', (info) => {
      console.log('[AutoUpdater] Update available:', info.version);
      this.isManualCheck = false;
      this._sendToRenderer('update:available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    });

    // No hay update → solo mostrar dialog si fue check manual
    autoUpdater.on('update-not-available', (info) => {
      console.log('[AutoUpdater] Up to date:', info.version);
      if (this.isManualCheck) {
        this.isManualCheck = false;
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'No Updates Available',
          message: 'You\'re up to date!',
          detail: `Version ${info.version} is the latest version.`,
          buttons: ['OK'],
        });
      }
    });

    // Progreso de descarga → enviar al renderer (progress bar)
    autoUpdater.on('download-progress', (progress) => {
      console.log('[AutoUpdater] Download progress:', `${progress.percent.toFixed(1)}%`);
      this._sendToRenderer('update:download-progress', {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      });
    });

    // Descarga completa → notificar al renderer
    autoUpdater.on('update-downloaded', (info) => {
      console.log('[AutoUpdater] Update downloaded:', info.version);
      this._sendToRenderer('update:downloaded', { version: info.version });
    });

    // Error → dialog solo si fue check manual
    autoUpdater.on('error', (error) => {
      console.error('[AutoUpdater] Error:', error.message);
      if (this.isManualCheck) {
        this.isManualCheck = false;
        dialog.showMessageBox(this.mainWindow, {
          type: 'error',
          title: 'Update Error',
          message: 'Could not check for updates',
          detail: error.message,
          buttons: ['OK'],
        });
      }
      this._sendToRenderer('update:error', { message: error.message });
    });
  }

  _setupIpcHandlers() {
    // El renderer puede pedir check, download e install via IPC invoke
    ipcMain.handle('update:check', async () => {
      try {
        const result = await autoUpdater.checkForUpdates();
        return { success: true, version: result?.updateInfo?.version };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('update:download', async () => {
      try {
        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('update:install', () => {
      // quitAndInstall(isSilent, isForceRunAfter)
      autoUpdater.quitAndInstall(false, true);
    });
  }

  _sendToRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  // Check silencioso (periódico) — no muestra nada si no hay update
  checkForUpdates() {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[AutoUpdater] Scheduled check failed:', err.message);
    });
  }

  // Check manual (menú) — muestra dialog si no hay update o si hay error
  checkForUpdatesManual() {
    this.isManualCheck = true;
    autoUpdater.checkForUpdates().catch((err) => {
      this.isManualCheck = false;
      dialog.showMessageBox(this.mainWindow, {
        type: 'error',
        title: 'Update Error',
        message: 'Could not check for updates',
        detail: err.message,
        buttons: ['OK'],
      });
    });
  }

  // Inicia checks periódicos (default: cada 6 horas)
  startPeriodicChecks(intervalMs = 6 * 60 * 60 * 1000) {
    this.checkForUpdates();
    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, intervalMs);
  }

  stopPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  destroy() {
    this.stopPeriodicChecks();
    ipcMain.removeHandler('update:check');
    ipcMain.removeHandler('update:download');
    ipcMain.removeHandler('update:install');
  }
}

module.exports = AutoUpdater;
