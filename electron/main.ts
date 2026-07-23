import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import db, {
  initDatabase,
  isTaskCompletedInCurrentPeriod,
  getCompletionsByDateRange,
  getCompletionsByPeriodicity
} from './database.js'

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
  initDatabase()

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

  // Canal para ELIMINAR una tarea por ID
  ipcMain.handle('db:delete-task', (_event, id: number) => {
    try {
      const stmt = db.prepare('DELETE FROM tasks WHERE id = ?')
      stmt.run(id)
      return { success: true }
    } catch (error: any) {
      console.error('Error al eliminar de la base de datos:', error)
      return { success: false, error: error.message }
    }
  })

  // Canal para MARCAR / DESMARCAR una tarea como completada
  ipcMain.handle('db:toggle-task', (_event, { taskId, date, isCompleted }) => {
    try {
      if (isCompleted) {
        const stmt = db.prepare('INSERT INTO task_completions (task_id, completed_date) VALUES (?, ?)')
        stmt.run(taskId, date)
      } else {
        const stmt = db.prepare('DELETE FROM task_completions WHERE task_id = ? AND completed_date = ?')
        stmt.run(taskId, date)
      }
      return { success: true }
    } catch (error: any) {
      console.error('Error al modificar completado en la DB:', error)
      return { success: false, error: error.message }
    }
  })

  // Canal para OBTENER los IDs completados en una fecha específica
  ipcMain.handle('db:get-completions-date', (_event, date: string) => {
    try {
      const stmt = db.prepare('SELECT task_id FROM task_completions WHERE completed_date = ?')
      const rows = stmt.all(date) as { task_id: number }[]
      return rows.map(row => row.task_id)
    } catch (error) {
      console.error('Error al obtener completados de la DB:', error)
      return []
    }
  })

  // Canal para OBTENER estadísticas de completado
  ipcMain.handle('db:get-stats', () => {
    try {
      const stmt = db.prepare('SELECT COUNT(*) as total FROM task_completions')
      const row = stmt.get() as { total: number }

      return {
        success: true,
        totalCompletions: row.total
      }
    } catch (error: any) {
      console.error('Error al calcular estadísticas en la DB:', error)
      return { success: false, totalCompletions: 0, error: error.message }
    }
  })

  // NUEVO: Handler para obtener completadas en el ciclo actual (por periodicidad)
  ipcMain.handle('db:get-completions-by-period', (_event, periodicity: string) => {
    try {
      const completedIds = getCompletionsByPeriodicity(periodicity as any)
      return completedIds
    } catch (error) {
      console.error('Error al obtener completadas por período:', error)
      return []
    }
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