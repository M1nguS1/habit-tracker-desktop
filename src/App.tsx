import { useState, useEffect } from 'react';
import './App.css';
import { getTodayString } from './utils/dateHelpers';

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
      getCompletionsByPeriod: (periodicity: string) => Promise<number[]>;
    };
  }
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [name, setName] = useState('');
  const [periodicity, setPeriodicity] = useState('daily');
  const [completedToday, setCompletedToday] = useState<number[]>([]);
  const [completedByPeriod, setCompletedByPeriod] = useState<number[]>([]);
  const [totalCompletions, setTotalCompletions] = useState(0);

  const [filter, setFilter] = useState('daily');

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

      if (filter !== 'all') {
        const completedInPeriod = await window.api.getCompletionsByPeriod(filter);
        setCompletedByPeriod(completedInPeriod);
      }

      await refreshStats();
    }

    loadData();
  }, [todayStr, filter]);

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
      setCompletedByPeriod(prev => prev.filter(taskId => taskId !== id));
      await refreshStats();
    }
  };

  const handleToggle = async (id: number, isCurrentCompleted: boolean) => {
    const newStatus = !isCurrentCompleted;
    const result = await window.api.toggleTask(id, todayStr, newStatus);

    if (result.success) {
      if (newStatus) {
        setCompletedToday(prev => [...prev, id]);
        setCompletedByPeriod(prev => [...prev, id]);
      } else {
        setCompletedToday(prev => prev.filter(taskId => taskId !== id));
        setCompletedByPeriod(prev => prev.filter(taskId => taskId !== id));
      }
      await refreshStats();
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.periodicity === filter;
  });

  const completionIds = filter === 'all' ? completedToday : completedByPeriod;

  const filteredCompleted = filteredTasks.filter(task => completionIds.includes(task.id));

  const progressPercentage =
    filteredTasks.length > 0 ? Math.round((filteredCompleted.length / filteredTasks.length) * 100) : 0;

  return (
    <div className="p-8 max-w-2xl mx-auto text-left bg-emerald-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-emerald-900">Habit Tracker 🌱</h1>
        <p className="text-sm text-emerald-700 opacity-90">
          Gestiona y monitoriza tus rutinas de forma clara, simple y alineada a tu día a día.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 rounded-xl text-white shadow-md">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
            Progreso ({filter === 'all' ? 'Todos' : filter === 'daily' ? 'Hoy' : filter === 'weekly' ? 'Esta Semana' : 'Este Mes'})
          </span>
          <div className="text-3xl font-bold mt-1">{progressPercentage}%</div>
          <div className="w-full bg-white/20 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-white h-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <p className="text-[11px] opacity-75 mt-2">
            {filteredCompleted.length} de {filteredTasks.length} hábitos completados
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
              Logros Históricos Totales
            </span>
            <div className="text-3xl font-bold mt-1 text-emerald-900">{totalCompletions}</div>
          </div>
          <p className="text-[11px] text-emerald-600 mt-2">
            Veces que has completado tus rutinas desde el inicio.
          </p>
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl border border-emerald-200 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-emerald-900">Crear Nuevo Hábito</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-emerald-800 opacity-80">
              Nombre del hábito
            </label>
            <input
              type="text"
              placeholder="Ej. Ir al gimnasio, Meditar..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-emerald-800 opacity-80">
              Periodicidad
            </label>
            <select
              value={periodicity}
              onChange={(e) => setPeriodicity(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-emerald-200 bg-white text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Añadir Hábito
          </button>
        </form>
      </section>

      <section>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-emerald-900">Mis Hábitos Activos</h2>

          <div className="flex bg-white p-1 rounded-lg border border-emerald-200 self-start sm:self-auto shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${filter === 'all' ? 'bg-emerald-50 text-emerald-700 shadow' : 'text-emerald-600 opacity-80'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('daily')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${filter === 'daily' ? 'bg-emerald-50 text-emerald-700 shadow' : 'text-emerald-600 opacity-80'}`}
            >
              Diarios
            </button>
            <button
              onClick={() => setFilter('weekly')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${filter === 'weekly' ? 'bg-emerald-50 text-emerald-700 shadow' : 'text-emerald-600 opacity-80'}`}
            >
              Semanales
            </button>
            <button
              onClick={() => setFilter('monthly')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${filter === 'monthly' ? 'bg-emerald-50 text-emerald-700 shadow' : 'text-emerald-600 opacity-80'}`}
            >
              Mensuales
            </button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <p className="text-sm opacity-70 italic p-4 bg-white rounded-lg border border-emerald-200">
            No hay hábitos activos bajo la categoría "{filter === 'all' ? 'Todos' : filter === 'daily' ? 'Diarios' : filter === 'weekly' ? 'Semanales' : 'Mensuales'}".
          </p>
        ) : (
          <ul className="space-y-2 p-0 list-none">
            {filteredTasks.map((task) => {
              const isCompleted = completionIds.includes(task.id);

              return (
                <li
                  key={task.id}
                  className={`flex justify-between items-center p-4 rounded-lg border shadow-sm transition-all duration-200 ${
                    isCompleted
                      ? 'bg-emerald-50 border-emerald-200 opacity-95'
                      : 'bg-white border-emerald-100 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleToggle(task.id, isCompleted)}
                      className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />

                    <div className="flex flex-col gap-1">
                      <strong
                        className={`font-medium transition-all text-emerald-900 ${
                          isCompleted ? 'line-through text-emerald-500' : ''
                        }`}
                      >
                        {task.name}
                      </strong>
                      <span className="w-max text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase tracking-wider">
                        {task.periodicity}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-200 transition-all"
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