import { useState, useEffect } from 'react';
import './App.css';

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
      deleteTask: (id: number) => Promise<{ success: boolean }>;
      toggleTask: (taskId: number, date: string, isCompleted: boolean) => Promise<{ success: boolean }>;
      getCompletionsByDate: (date: string) => Promise<number[]>;
      getStats: () => Promise<{ success: boolean; totalCompletions: number }>;
    };
  }
}

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
  const [completedToday, setCompletedToday] = useState<number[]>([]);
  const [totalCompletions, setTotalCompletions] = useState(0);
  
  // NUEVO ESTADO: Filtro de vista ('all', 'daily', 'weekly', 'monthly')
  const [filter, setFilter] = useState('daily'); // Por defecto iniciamos en 'daily' para no distorsionar el día
  
  const todayStr = getTodayString();

  const refreshStats = async () => {
    const stats = await window.api.getStats();
    if (stats.success) {
      setTotalCompletions(stats.totalCompletions);
    }
  };

  useEffect(() => {
    async function loadData() {
      const existingTasks = await window.api.getTasks();
      setTasks(existingTasks);
      
      const completedIds = await window.api.getCompletionsByDate(todayStr);
      setCompletedToday(completedIds);

      await refreshStats();
    }
    loadData();
  }, [todayStr]);

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

  const handleDelete = async (id: number) => {
    const result = await window.api.deleteTask(id);
    if (result.success) {
      const updatedTasks = await window.api.getTasks();
      setTasks(updatedTasks);
      setCompletedToday(prev => prev.filter(taskId => taskId !== id));
      await refreshStats();
    }
  };

  const handleToggle = async (id: number, isCurrentCompleted: boolean) => {
    const newStatus = !isCurrentCompleted;
    const result = await window.api.toggleTask(id, todayStr, newStatus);
    
    if (result.success) {
      if (newStatus) {
        setCompletedToday(prev => [...prev, id]);
      } else {
        setCompletedToday(prev => prev.filter(taskId => taskId !== id));
      }
      await refreshStats();
    }
  };

  // 1. FILTRADO DE TAREAS EN TIEMPO REAL
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.periodicity === filter;
  });

  // 2. CÁLCULO DE PROGRESO CORREGIDO (Solo evalúa los hábitos que pasan el filtro)
  const filteredCompletedToday = filteredTasks.filter(task => completedToday.includes(task.id));
  
  const todayPercentage = filteredTasks.length > 0 
    ? Math.round((filteredCompletedToday.length / filteredTasks.length) * 100) 
    : 0;

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

      {/* PANEL DE ESTADÍSTICAS VISUALES DINÁMICAS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Tarjeta 1: Progreso Basado en el Filtro */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-5 rounded-xl text-white shadow-md">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
            Progreso de Hoy ({filter === 'all' ? 'Todos' : filter === 'daily' ? 'Diarios' : filter === 'weekly' ? 'Semanales' : 'Mensuales'})
          </span>
          <div className="text-3xl font-bold mt-1">{todayPercentage}%</div>
          <div className="w-full bg-white/20 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-300" 
              style={{ width: `${todayPercentage}%` }}
            ></div>
          </div>
          <p className="text-[11px] opacity-75 mt-2">
            {filteredCompletedToday.length} de {filteredTasks.length} hábitos evaluados
          </p>
        </div>

        {/* Tarjeta 2: Historial Global Inalterado */}
        <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Logros Históricos Totales
            </span>
            <div className="text-3xl font-bold mt-1 text-slate-900 dark:text-slate-100">
              {totalCompletions}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Veces que has completado tus rutinas desde el inicio.
          </p>
        </div>
      </section>

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

      {/* SECCIÓN DE HÁBITOS CON FILTRO INTERACTIVO */}
      <section>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Mis Hábitos Activos
          </h2>
          
          {/* Selector de filtros con diseño encapsulado */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${filter === 'all' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-xs' : 'text-slate-600 dark:text-slate-400 opacity-80'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilter('daily')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${filter === 'daily' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-xs' : 'text-slate-600 dark:text-slate-400 opacity-80'}`}
            >
              Diarios
            </button>
            <button 
              onClick={() => setFilter('weekly')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${filter === 'weekly' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-xs' : 'text-slate-600 dark:text-slate-400 opacity-80'}`}
            >
              Semanales
            </button>
            <button 
              onClick={() => setFilter('monthly')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${filter === 'monthly' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-xs' : 'text-slate-600 dark:text-slate-400 opacity-80'}`}
            >
              Mensuales
            </button>
          </div>
        </div>
        
        {filteredTasks.length === 0 ? (
          <p className="text-sm opacity-60 italic p-4 bg-slate-100/50 dark:bg-slate-100/30 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
            No hay hábitos activos bajo la categoría "{filter === 'all' ? 'Todos' : filter === 'daily' ? 'Diarios' : filter === 'weekly' ? 'Semanales' : 'Mensuales'}".
          </p>
        ) : (
          <ul className="space-y-2 p-0 list-none">
            {filteredTasks.map((task) => {
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
                    <input 
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleToggle(task.id, isCompleted)}
                      className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                    />

                    <div className="flex flex-col gap-1">
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
                    className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-200 transition-all cursor-pointer"
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