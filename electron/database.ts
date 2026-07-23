import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { getCurrentPeriodRange, isDateInPeriod, type Periodicity } from '../src/utils/dateHelpers.js';

// 1. Determinar dónde se guardará físicamente el archivo .db en tu Fedora
// Forzamos a que tanto en desarrollo como empaquetado se guarde fuera de la carpeta del proyecto
const dbPath = path.join(app.getPath('userData'), 'habits_tracker.db');

// 2. Conectar (o crear) la base de datos en esa ruta
const db = new Database(dbPath, { verbose: console.log });

// 3. Función para inicializar las tablas si no existen
export function initDatabase(): void {
  // Tabla de configuración de tareas
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      periodicity TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Tabla del historial de completado
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      completed_date TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `);

  console.log(`[Database] Inicializada correctamente en: ${dbPath}`);
}

// 4. NUEVAS FUNCIONES HELPER CON LÓGICA TEMPORAL

/**
 * Verifica si una tarea está completada en el ciclo actual (día/semana/mes)
 */
export function isTaskCompletedInCurrentPeriod(taskId: number, periodicity: Periodicity): boolean {
  const range = getCurrentPeriodRange(periodicity);
  
  const stmt = db.prepare(`
    SELECT 1 FROM task_completions
    WHERE task_id = ?
      AND completed_date BETWEEN ? AND ?
    LIMIT 1
  `);

  const result = stmt.get(taskId, range.startDate, range.endDate);
  return !!result;
}

/**
 * Obtiene todos los task_ids completados en un rango de fechas
 */
export function getCompletionsByDateRange(startDate: string, endDate: string): number[] {
  const stmt = db.prepare(`
    SELECT DISTINCT task_id FROM task_completions
    WHERE completed_date BETWEEN ? AND ?
    ORDER BY task_id
  `);

  const rows = stmt.all(startDate, endDate) as { task_id: number }[];
  return rows.map(row => row.task_id);
}

/**
 * Obtiene el rango de fechas para una periodicidad y devuelve los task_ids completados
 */
export function getCompletionsByPeriodicity(periodicity: Periodicity): number[] {
  const range = getCurrentPeriodRange(periodicity);
  return getCompletionsByDateRange(range.startDate, range.endDate);
}

export default db;