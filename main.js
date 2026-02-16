const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')
const AutoUpdater = require('./services/AutoUpdater')

let mainWindow = null
let autoUpdaterService = null

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.loadFile('index.html')
}

function createAppMenu() {
  const isMac = process.platform === 'darwin'

  const template = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: 'about' },
            {
              label: 'Check for Updates...',
              click: () => {
                if (autoUpdaterService) {
                  autoUpdaterService.checkForUpdatesManual()
                }
              },
            },
            { type: 'separator' },
            { role: 'quit' },
          ],
        }]
      : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    ...(!isMac
      ? [{
          label: 'Help',
          submenu: [
            {
              label: 'Check for Updates...',
              click: () => {
                if (autoUpdaterService) {
                  autoUpdaterService.checkForUpdatesManual()
                }
              },
            },
          ],
        }]
      : []),
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  createWindow()

  // Auto-updater solo funciona en app empaquetada
  if (app.isPackaged) {
    autoUpdaterService = new AutoUpdater(mainWindow)
    autoUpdaterService.startPeriodicChecks()
  }

  createAppMenu()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  if (autoUpdaterService) {
    autoUpdaterService.destroy()
    autoUpdaterService = null
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
