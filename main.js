const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')
const AutoUpdater = require('./services/AutoUpdater')

let mainWindow = null
let autoUpdaterService = null
let updateMenuItem = null

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

function updateMenuItemState({ label, enabled, click }) {
  if (!updateMenuItem) return
  updateMenuItem.label = label
  updateMenuItem.enabled = enabled
  if (click) {
    updateMenuItem.click = click
  } else {
    updateMenuItem.click = () => {
      if (autoUpdaterService) {
        autoUpdaterService.checkForUpdatesManual()
      }
    }
  }
}

function createAppMenu() {
  const isMac = process.platform === 'darwin'

  const updateItem = {
    label: 'Check for Updates...',
    click: () => {
      if (autoUpdaterService) {
        autoUpdaterService.checkForUpdatesManual()
      }
    },
  }

  const template = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: 'about' },
            updateItem,
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
            updateItem,
          ],
        }]
      : []),
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  // Guardar referencia al menu item para actualizarlo dinámicamente
  if (isMac) {
    updateMenuItem = menu.items[0].submenu.items[1]
  } else {
    const helpMenu = menu.items[menu.items.length - 1]
    updateMenuItem = helpMenu.submenu.items[0]
  }
}

app.whenReady().then(() => {
  createWindow()
  createAppMenu()

  // Auto-updater solo funciona en app empaquetada
  if (app.isPackaged) {
    autoUpdaterService = new AutoUpdater(mainWindow, {
      onMenuUpdate: updateMenuItemState,
      releaseUrl: 'https://github.com/Sharmaz/electron-sample-app/releases',
    })
    autoUpdaterService.startPeriodicChecks()
  }

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
