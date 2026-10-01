import React, { useState } from 'react';
import { Restaurant, TodoItem } from '../types';
import { CheckSquare, Plus, CheckCircle2, Calendar, AlertCircle, Trash2, ArrowUpRight } from 'lucide-react';

interface AllTasksViewProps {
  todos: TodoItem[];
  restaurants: Restaurant[];
  effectiveTime: Date;
  onToggleTask: (task: TodoItem) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (restaurantId: string, task: string, dueDate: string | null) => void;
  onOpenDetail: (restaurant: Restaurant) => void;
}

export const AllTasksView: React.FC<AllTasksViewProps> = ({
  todos,
  restaurants,
  effectiveTime,
  onToggleTask,
  onDeleteTask,
  onAddTask,
  onOpenDetail,
}) => {
  const [filter, setFilter] = useState<'all' | 'due_today' | 'overdue' | 'completed'>('all');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(
    restaurants[0]?.id || ''
  );
  const [newTaskText, setNewTaskText] = useState('');
  const [taskDueDate, setTaskDueDate] = useState<string | null>(null);

  const todayStr = effectiveTime.toISOString().slice(0, 10);

  const handleDatePreset = (daysOffset: number | null) => {
    if (daysOffset === null) {
      setTaskDueDate(null);
      return;
    }
    const d = new Date(effectiveTime);
    d.setDate(d.getDate() + daysOffset);
    setTaskDueDate(d.toISOString().slice(0, 10));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !selectedRestaurantId) return;
    onAddTask(selectedRestaurantId, newTaskText.trim(), taskDueDate);
    setNewTaskText('');
    setTaskDueDate(null);
  };

  const restMap = new Map(restaurants.map((r) => [r.id, r]));

  // Filter tasks
  const filteredTodos = todos.filter((todo) => {
    if (filter === 'completed') return todo.is_completed;
    if (todo.is_completed) return false;
    if (filter === 'due_today') {
      return todo.due_date === todayStr;
    }
    if (filter === 'overdue') {
      return todo.due_date && todo.due_date < todayStr;
    }
    return true;
  });

  const overdueCount = todos.filter((t) => !t.is_completed && t.due_date && t.due_date < todayStr).length;
  const dueTodayCount = todos.filter((t) => !t.is_completed && t.due_date === todayStr).length;
  const openCount = todos.filter((t) => !t.is_completed).length;

  return (
    <div className="space-y-6">
      {/* Header & Quick Stats */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-600" />
            <span>Rep-Owned Pipeline Tasks</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Rule 3 Discipline: The sales rep owns 100% of pipeline tasks (Owner = "Me"). Completing a task prompts to record a touchpoint.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-semibold font-mono">
            {openCount} Open Tasks
          </div>
          {dueTodayCount > 0 && (
            <div className="px-3 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold font-mono">
              {dueTodayCount} Due Today
            </div>
          )}
          {overdueCount > 0 && (
            <div className="px-3 py-1.5 rounded bg-rose-50 border border-rose-200 text-rose-800 font-semibold font-mono">
              {overdueCount} Overdue
            </div>
          )}
        </div>
      </div>

      {/* Fast Task Creation Bar */}
      <form onSubmit={handleCreateTask} className="bg-white border border-neutral-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-800">Fast Add Rep Task</span>
          <span className="text-[11px] text-neutral-500 font-medium">Owner: <strong className="text-neutral-900">Me</strong></span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded text-xs bg-white text-neutral-900 focus:ring-1 focus:ring-amber-500"
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            required
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="e.g. Bring spec sheet for 00 Flour & quote for 2 Parmigiano wheels"
            className="sm:col-span-2 px-3 py-2 border border-neutral-300 rounded text-xs bg-white text-neutral-900 focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Date presets */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-neutral-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-neutral-500">Explicit Due Date (Rule 3):</span>
            <button
              type="button"
              onClick={() => handleDatePreset(0)}
              className={`px-2 py-0.5 rounded text-[11px] border ${
                taskDueDate === todayStr
                  ? 'bg-amber-600 text-white border-amber-600 font-bold'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              [Today]
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset(1)}
              className="px-2 py-0.5 rounded text-[11px] bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100"
            >
              [Tomorrow]
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset(3)}
              className="px-2 py-0.5 rounded text-[11px] bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100"
            >
              [+3 Days]
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset(7)}
              className="px-2 py-0.5 rounded text-[11px] bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100"
            >
              [+1 Week]
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset(14)}
              className="px-2 py-0.5 rounded text-[11px] bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100"
            >
              [+2 Weeks]
            </button>
            <button
              type="button"
              onClick={() => handleDatePreset(null)}
              className={`px-2 py-0.5 rounded text-[11px] border ${
                taskDueDate === null
                  ? 'bg-neutral-800 text-white border-neutral-800'
                  : 'bg-white text-neutral-700 border-neutral-300'
              }`}
            >
              [Needs Date]
            </button>
            {taskDueDate && (
              <span className="font-mono text-[11px] text-amber-700 font-bold ml-1">
                Due: {taskDueDate}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Rep Task</span>
          </button>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-200/80 rounded-lg max-w-fit text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 font-medium rounded transition-colors ${
            filter === 'all'
              ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Active Tasks ({openCount})
        </button>
        <button
          onClick={() => setFilter('due_today')}
          className={`px-3 py-1.5 font-medium rounded transition-colors ${
            filter === 'due_today'
              ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Due Today ({dueTodayCount})
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`px-3 py-1.5 font-medium rounded transition-colors ${
            filter === 'overdue'
              ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Overdue ({overdueCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 font-medium rounded transition-colors ${
            filter === 'completed'
              ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Task List */}
      <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100 text-xs overflow-hidden">
        {filteredTodos.length === 0 ? (
          <div className="p-8 text-center text-neutral-400 italic">
            No tasks found in this view.
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const rest = restMap.get(todo.restaurant_id);
            const isOverdue = !todo.is_completed && todo.due_date && todo.due_date < todayStr;
            const isToday = !todo.is_completed && todo.due_date === todayStr;

            return (
              <div
                key={todo.id}
                className="p-3.5 flex items-start justify-between gap-3 hover:bg-neutral-50/80 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleTask(todo)}
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      todo.is_completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-neutral-300 hover:border-amber-600 bg-white'
                    }`}
                    title={
                      todo.is_completed
                        ? 'Mark incomplete'
                        : 'Mark complete (will trigger follow-up hook)'
                    }
                  >
                    {todo.is_completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs ${
                        todo.is_completed ? 'line-through text-neutral-400' : 'font-semibold text-neutral-900'
                      }`}
                    >
                      {todo.task}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-1 flex-wrap">
                      {rest && (
                        <button
                          onClick={() => onOpenDetail(rest)}
                          className="font-bold text-neutral-700 hover:text-amber-700 flex items-center gap-0.5"
                        >
                          <span>{rest.name}</span>
                          <ArrowUpRight className="w-3 h-3 text-neutral-400" />
                        </button>
                      )}
                      <span>·</span>
                      <span className="font-medium text-neutral-600">Owner: Me</span>
                      <span>·</span>
                      {todo.due_date ? (
                        <span
                          className={`font-mono font-medium ${
                            isOverdue
                              ? 'text-rose-600 font-bold'
                              : isToday
                              ? 'text-emerald-700 font-bold'
                              : 'text-neutral-600'
                          }`}
                        >
                          Due: {todo.due_date} {isOverdue && '(Overdue)'} {isToday && '(Today)'}
                        </span>
                      ) : (
                        <span className="italic text-neutral-400">Needs Date</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteTask(todo.id)}
                  className="text-neutral-300 hover:text-rose-600 p-1 transition-colors shrink-0"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
