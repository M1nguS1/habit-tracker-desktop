import { contextBridge, ipcRenderer } from 'electron'

// Exponer APIs seguras al proceso de renderizado (React)
contextBridge.exposeInMainWorld('electronAPI', {
  // Aquí añadiremos los canales de comunicación más adelante
})