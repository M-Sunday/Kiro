const { app, BrowserWindow, Menu, ipcMain, dialog, session } = require('electron')
const path = require('path')
const http = require('http')
const fs = require('fs')

const PORT = process.env.KIRO_PORT || 3001

// Local HTTP server so ES modules work (file:// blocks type="module")
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
}
function serveFile(req, res) {
  let file = req.url === '/' ? '/index.html' : req.url.split('?')[0]
  const filePath = path.join(__dirname, file)
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return }
    const ext = path.extname(file)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
    res.end(data)
  })
}
const server = http.createServer(serveFile).listen(PORT, () => {
  console.log(`[Kiro] Dev server on http://localhost:${PORT}`)
})

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  })
  win.loadURL('http://localhost:' + PORT + '/index.html')

  const template = [
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    {
      label: 'Debug',
      submenu: [
    {
      label: 'Toggle Colors',
      accelerator: 'CmdOrCtrl+D',
          click: () => win.webContents.executeJavaScript('toggleDebug()')
        },
        {
          label: 'Show Hierarchy',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => win.webContents.executeJavaScript('toggleDebugHierarchy()')
        },
        { type: 'separator' },
        {
          label: 'Online',
          click: () => win.webContents.executeJavaScript(`
            Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
            window.dispatchEvent(new Event('online'));
          `)
        },
        {
          label: 'Bad Signal (2G)',
          click: () => win.webContents.executeJavaScript(`
            Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
            if (navigator.connection) {
              Object.defineProperty(navigator.connection, 'effectiveType', { configurable: true, get: () => '2g' });
              navigator.connection.dispatchEvent(new Event('change'));
            }
            window.dispatchEvent(new Event('online'));
          `)
        },
        {
          label: 'Offline',
          click: () => win.webContents.executeJavaScript(`
            Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
            window.dispatchEvent(new Event('offline'));
          `)
        },
        { type: 'separator' },
        {
          label: 'Start Over',
          click: () => {
            var fresh = new BrowserWindow({
              width: 800, height: 600,
              webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                webSecurity: false,
                partition: 'temp'
              }
            })
            fresh.loadURL('http://localhost:' + PORT + '/index.html')
          }
        }
      ]
    },
    { role: 'helpMenu' }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  ipcMain.handle('pick-folder', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: 'Choose download location'
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      title: 'Import File'
    })
    return result
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  server.close()
})
