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
    <div className="px-0 w-full max-w-full text-left bg-emerald-50 min-h-screen" style={{ paddingTop: '1.25rem' }}>
      <header style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '2rem', paddingTop: '0.25rem' }}>
        <h1 style={{ margin: '0 auto', width: 'fit-content', textAlign: 'center' }} className="text-4xl font-bold tracking-tight mb-2 text-emerald-900">
          Habit Tracker 🌱
        </h1>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.7fr_0.9fr] mb-8 ml-0 px-4">
        <div className="bg-white p-4 pl-0 rounded-xl border border-emerald-200 shadow-sm ml-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4 justify-start w-full pl-0 ml-0">
                <label className="block flex-none text-sm text-emerald-800" style={{ width: '100px' }}>
                  <span className="block mb-2">Nuevo Hábito: </span>
                  <input
                    type="text"
                    placeholder="Ej. Meditar" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    style={{ width: '100px' }}
                  />
                </label>

                <label className="w-[180px] min-w-[180px] text-sm text-emerald-800">
                  <span className="block mb-2">Periodicidad:</span>
                  <select
                    value={periodicity}
                    onChange={e => setPeriodicity(e.target.value)}
                    className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </label>

                <button
                  type="submit"
                  aria-label="Crear hábito"
                  className="self-start inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-300/50 transition hover:bg-emerald-700 active:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                >
                  ➕
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
            Estadísticas
          </span>
          <div className="mt-5 grid gap-5">
            <div className="rounded-3xl bg-white border border-slate-300 p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-700">Progreso actual</p>
              <div className="relative mt-4 h-12 w-full rounded-full bg-slate-300 overflow-hidden border border-slate-400">
                <div
                  style={{
                    width: progressPercentage === 0 ? '10px' : `${progressPercentage}%`,
                    minWidth: '10px',
                    transition: 'width 300ms ease',
                  }}
                  className="h-full rounded-full bg-emerald-500"
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-900">
                  {progressPercentage}%
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 text-sm text-slate-600">
                <span>{filter === 'all' ? 'Todos' : filter === 'daily' ? 'Hoy' : filter === 'weekly' ? 'Esta Semana' : 'Este Mes'}</span>
                <span className="font-semibold text-slate-800">{progressPercentage}% completado</span>
              </div>
            </div>
            <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-5">
              <p className="text-sm uppercase tracking-wider text-emerald-500">Total completados</p>
              <div className="text-4xl font-bold text-emerald-900 mt-3">{totalCompletions}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-emerald-900">Mis Hábitos Activos</h2>
            <p className="text-sm text-emerald-600 mt-1">
              Filtra tus hábitos para ver su progreso.
            </p>
          </div>

          <div className="flex bg-emerald-50 p-1 rounded-xl border border-emerald-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === 'all' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-600 opacity-80'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('daily')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === 'daily' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-600 opacity-80'}`}
            >
              Diarios
            </button>
            <button
              onClick={() => setFilter('weekly')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === 'weekly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-600 opacity-80'}`}
            >
              Semanales
            </button>
            <button
              onClick={() => setFilter('monthly')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === 'monthly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-600 opacity-80'}`}
            >
              Mensuales
            </button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <p className="text-sm opacity-70 italic p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            No hay hábitos activos bajo la categoría "{filter === 'all' ? 'Todos' : filter === 'daily' ? 'Diarios' : filter === 'weekly' ? 'Semanales' : 'Mensuales'}".
          </p>
        ) : (
          <ul className="space-y-3 p-0 list-none">
            {filteredTasks.map((task) => {
              const isCompleted = completionIds.includes(task.id);

              return (
                <li
                  key={task.id}
                  className={`flex items-center justify-between gap-4 p-4 rounded-xl border shadow-sm transition-all duration-200 ${isCompleted
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-white border-emerald-100 hover:border-emerald-200'
                    }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleToggle(task.id, isCompleted)}
                      className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />

                    <div className="min-w-0">
                      <p className={`font-medium ${isCompleted ? 'line-through text-emerald-500' : 'text-emerald-900'}`}>
                        {task.name}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
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