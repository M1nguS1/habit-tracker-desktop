import { useState, useEffect } from 'react';
import './App.css';

interface Task {
  id: number;
  name: string;
  periodicity: string;
}

// 1. Declaración de tipos actualizada para el puente IPC
declare global {
  interface Window {
    api: {
      createTask: (name: string, periodicity: string) => Promise<{ id: number; success: boolean }>;
      getTasks: () => Promise<Task[]>;
      deleteTask: (id: number) => Promise<{ success: boolean }>;
      toggleTask: (taskId: number, date: string, isCompleted: boolean) => Promise<{ success: boolean }>;
      getCompletionsByDate: (date: string) => Promise<number[]>;
    };
  }
}

// Helper para obtener la fecha de hoy en formato local YYYY-MM-DD
const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [name, setName] = useState('');
  const [periodicity, setPeriodicity] = useState('daily');

  // 2. Nuevo Estado: Almacena los IDs de las tareas que ya se hicieron HOY
  const [completedToday, setCompletedToday] = useState<number[]>([]);
  
  // Guardamos el string de la fecha de hoy de forma estática
  const todayStr = getTodayString();

  // 3. Efecto de carga inicial modificado: trae tareas y sus estados de hoy
  useEffect(() => {
    async function loadData() {
      const existingTasks = await window.api.getTasks();
      setTasks(existingTasks);
      
      const completedIds = await window.api.getCompletionsByDate(todayStr);
      setCompletedToday(completedIds);
    }
    loadData();
  }, [todayStr]);

  // Manejar el envío del formulario hacia SQLite
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const result = await window.api.createTask(name, periodicity);
    if (result.success) {
      const updatedTasks = await window.api.getTasks();
      setTasks(updatedTasks);
      setName('');
    }
  };

  // Ejecutar la eliminación del hábito por su ID
  const handleDelete = async (id: number) => {
    const result = await window.api.deleteTask(id);
    if (result.success) {
      const updatedTasks = await window.api.getTasks();
      setTasks(updatedTasks);
      // Limpiamos también el ID del estado diario por si se borra estando completada hoy
      setCompletedToday(prev => prev.filter(taskId => taskId !== id));
    }
  };

  // 4. NUEVA FUNCIÓN: Gestionar el cambio del checkbox en la base de datos y UI
  const handleToggle = async (id: number, isCurrentCompleted: boolean) => {
    const newStatus = !isCurrentCompleted;
    const result = await window.api.toggleTask(id, todayStr, newStatus);
    
    if (result.success) {
      if (newStatus) {
        // Añadir ID al array si se marcó
        setCompletedToday(prev => [...prev, id]);
      } else {
        // Remover ID del array si se desmarcó
        setCompletedToday(prev => prev.filter(taskId => taskId !== id));
      }
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
            {tasks.map((task) => {
              // Comprobamos si el ID del hábito está en nuestra lista de completados de hoy
              const isCompleted = completedToday.includes(task.id);

              return (
                <li 
                  key={task.id} 
                  className={`flex justify-between items-center p-4 rounded-lg border shadow-sm transition-all duration-200 ${
                    isCompleted 
                      ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75' 
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox Interactiva */}
                    <input 
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleToggle(task.id, isCompleted)}
                      className="w-5 height-5 rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                    />

                    <div className="flex flex-col gap-1">
                      {/* Texto dinámico: añade un tachado si está hecho */}
                      <strong className={`font-medium transition-all text-slate-900 dark:text-slate-100 ${
                        isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}>
                        {task.name}
                      </strong> 
                      <span className="w-max text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold uppercase tracking-wider">
                        {task.periodicity}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-all cursor-pointer"
                    title="Eliminar hábito"
                  >
                    Eliminar
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;