import { useState, useEffect } from 'react';
import './App.css';

// 1. Definimos los tipos de la API expuesta en el preload
interface Task {
  id: number;
  name: string;
  periodicity: string;
}

declare global {
  interface Window {
    api: {
      createTask: (name: string, periodicity: string) => Promise<{ id: number; success: boolean }>;
      getTasks: () => Promise<Task[]>;
    };
  }
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [name, setName] = useState('');
  const [periodicity, setPeriodicity] = useState('daily');

  // 2. Cargar las tareas existentes al iniciar la app
  useEffect(() => {
    async function loadTasks() {
      const existingTasks = await window.api.getTasks();
      setTasks(existingTasks);
    }
    loadTasks();
  }, []);

  // 3. Manejar el envío del formulario hacia SQLite
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const result = await window.api.createTask(name, periodicity);
    if (result.success) {
      // Refrescar la lista de tareas tras guardar localmente
      const updatedTasks = await window.api.getTasks();
      setTasks(updatedTasks);
      setName(''); // Limpiar el input
    }
  };

  return (
    <div className="container">
      <h1>Habit Tracker 🚀</h1>
      
      {/* Formulario de Creación */}
      <form onSubmit={handleSubmit} className="task-form">
        <input 
          type="text" 
          placeholder="Nombre del hábito (ej. Ir al gimnasio)" 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        
        <select value={periodicity} onChange={(e) => setPeriodicity(e.target.value)}>
          <option value="daily">Diario</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensual</option>
        </select>
        
        <button type="submit">Añadir Hábito</button>
      </form>

      {/* Listado de Tareas */}
      <h2>Mis Hábitos</h2>
      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className="task-item">
            <strong>{task.name}</strong> 
            <span className="badge">{task.periodicity}</span>
          </li>
        ))}
        {tasks.length === 0 && <p className="empty-state">No hay hábitos creados aún. ¡Empieza uno nuevo arriba!</p>}
      </ul>
    </div>
  );
}

export default App;