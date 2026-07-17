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

  // 2. Cargar las tareas existentes al iniciar la app desde SQLite
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
    <div className="p-8 max-w-2xl mx-auto text-left">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-slate-900 dark:text-slate-100">
          Habit Tracker 🚀
        </h1>
        <p className="text-sm opacity-80">
          Gestiona y monitoriza tus rutinas diarias conectadas a tu base de datos local.
        </p>
      </header>

      {/* Formulario de Creación */}
      <section className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
          Crear Nuevo Hábito
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 opacity-75">
              Nombre del hábito
            </label>
            <input 
              type="text" 
              placeholder="Ej. Ir al gimnasio, Meditar..." 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 opacity-75">
              Periodicidad
            </label>
            <select 
              value={periodicity} 
              onChange={(e) => setPeriodicity(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>

          <button 
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
          >
            Añadir Hábito
          </button>
        </form>
      </section>

      {/* Listado de Tareas */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
          Mis Hábitos Activos
        </h2>
        
        {tasks.length === 0 ? (
          <p className="text-sm opacity-60 italic p-4 bg-slate-100/50 dark:bg-slate-900/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
            No hay hábitos creados aún. ¡Empieza uno nuevo arriba!
          </p>
        ) : (
          <ul className="space-y-2 p-0 list-none">
            {tasks.map((task) => (
              <li 
                key={task.id} 
                className="flex justify-between items-center p-4 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <strong className="font-medium text-slate-900 dark:text-slate-100">
                  {task.name}
                </strong> 
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium capitalize">
                  {task.periodicity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;