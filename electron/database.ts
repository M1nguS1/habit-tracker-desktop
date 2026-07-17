import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

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

export default db;