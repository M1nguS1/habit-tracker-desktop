import { app, BrowserWindow, ipcMain } from 'electron' // 1. Añadimos 'ipcMain' aquí
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import db, { initDatabase } from './database.js' // 2. Importamos tu base de datos (.js por ES Modules)

// Crear el equivalente a _dirname de forma segura para ES Modules dentro de Electron
const _filename = fileURLToPath(import.meta.url)
const _dirname = path.dirname(_filename)

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Ahora _dirname apuntará correctamente a la carpeta dist-electron en ejecución
      preload: path.join(_dirname, 'preload.js'),
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(_dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  // 3. Inicializar la base de datos al arrancar la app
  initDatabase()

  // 4. Escuchar las peticiones del Frontend (React)
  
  // Canal para GUARDAR una tarea nueva
  ipcMain.handle('db:create-task', (_event, { name, periodicity }) => {
    const stmt = db.prepare('INSERT INTO tasks (name, periodicity) VALUES (?, ?)')
    const info = stmt.run(name, periodicity)
    return { id: info.lastInsertRowid, success: true }
  })

  // Canal para LEER todas las tareas
  ipcMain.handle('db:get-tasks', () => {
    const stmt = db.prepare('SELECT * FROM tasks')
    return stmt.all()
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})