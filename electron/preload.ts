import { contextBridge, ipcRenderer } from 'electron';

// Exponer APIs seguras al proceso de renderizado (React)
contextBridge.exposeInMainWorld('api', {
  // Enviar una nueva tarea al proceso principal de Electron
  createTask: (name: string, periodicity: string) => 
    ipcRenderer.invoke('db:create-task', { name, periodicity }),
    
  // Solicitar todas las tareas de la base de datos
  getTasks: () => ipcRenderer.invoke('db:get-tasks'),
});