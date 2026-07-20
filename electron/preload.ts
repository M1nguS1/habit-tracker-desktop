const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al proceso de renderizado (React)
contextBridge.exposeInMainWorld('api', {
  // Enviar una nueva tarea al proceso principal de Electron
  createTask: (name: string, periodicity: string) =>
    ipcRenderer.invoke('db:create-task', { name, periodicity }),

  // Solicitar todas las tareas de la base de datos
  getTasks: () => ipcRenderer.invoke('db:get-tasks'),

  // Borrar una tarea por su ID
  deleteTask: (id: number) => ipcRenderer.invoke('db:delete-task', id),

  // Marcar o desmarcar una tarea como completada para una fecha específica
  toggleTask: (taskId: number, date: string, isCompleted: boolean) =>
    ipcRenderer.invoke('db:toggle-task', { taskId, date, isCompleted }),

  // Solicitar la lista de IDs de tareas completadas en una fecha específica
  getCompletionsByDate: (date: string) =>
    ipcRenderer.invoke('db:get-completions-date', date),
});