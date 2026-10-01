import React, { useState } from 'react';
import { Restaurant, TodoItem, TouchpointLog } from '../types';
import { evaluateServiceWindow } from '../utils/timeWindow';
import { computeFollowupCount, computeTotalAttempts } from '../utils/storage';
import {
  X,
  Clock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  CheckSquare,
  MessageSquare,
  PackageCheck,
  ChevronRight,
} from 'lucide-react';

interface RestaurantDetailModalProps {
  restaurant: Restaurant;
  logs: TouchpointLog[];
  todos: TodoItem[];
  effectiveTime: Date;
  onClose: () => void;
  onEditRestaurant: (restaurant: Restaurant) => void;
  onOpenLogModal: (restaurant: Restaurant, existingLog?: TouchpointLog | null) => void;
  onDeleteLog: (logId: string) => void;
  onAddTask: (restaurantId: string, taskText: string, dueDate: string | null) => void;
  onToggleTask: (task: TodoItem) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSample: (restaurantId: string, sampleName: string) => void;
  onRemoveSample: (restaurantId: string, sampleName: string) => void;
  onDeleteRestaurant: (restaurantId: string, name: string) => void;
}

export const RestaurantDetailModal: React.FC<RestaurantDetailModalProps> = ({
  restaurant,
  logs,
  todos,
  effectiveTime,
  onClose,
  onEditRestaurant,
  onOpenLogModal,
  onDeleteLog,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onAddSample,
  onRemoveSample,
  onDeleteRestaurant,
}) => {
  const windowEval = evaluateServiceWindow(restaurant, effectiveTime);
  const followupCount = computeFollowupCount(restaurant, logs);
  const totalAttempts = computeTotalAttempts(restaurant, logs);

  const restaurantLogs = logs
    .filter((l) => l.restaurant_id === restaurant.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const restaurantTodos = todos
    .filter((t) => t.restaurant_id === restaurant.id)
    .sort((a, b) => {
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    });

  // Fast task creation form state
  const [newTaskText, setNewTaskText] = useState('');
  const [newDueDate, setNewDueDate] = useState<string | null>(null);

  // Sample management state
  const [newSampleInput, setNewSampleInput] = useState('');
  const [showAddSample, setShowAddSample] = useState(false);

  const handleDatePreset = (daysOffset: number | null) => {
    if (daysOffset === null) {
      setNewDueDate(null);
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    setNewDueDate(d.toISOString().slice(0, 10));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(restaurant.id, newTaskText.trim(), newDueDate);
    setNewTaskText('');
    setNewDueDate(null);
  };

  const handleAddSampleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSampleInput.trim()) return;
    onAddSample(restaurant.id, newSampleInput.trim());
    setNewSampleInput('');
    setShowAddSample(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-2xl border border-neutral-200 max-w-4xl w-full overflow-hidden flex flex-col h-[94vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-white truncate">
                {restaurant.name}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-amber-400 border border-neutral-700 font-semibold">
                {restaurant.status}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 truncate">
              {restaurant.cuisine} · {restaurant.contact_name} ({restaurant.contact_role})
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onEditRestaurant(restaurant)}
              className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded transition-colors flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Account</span>
            </button>
            <button
              onClick={() => onDeleteRestaurant(restaurant.id, restaurant.name)}
              className="px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-800 border border-rose-800/80 rounded transition-colors flex items-center gap-1.5"
              title="Delete this prospect and all associated records"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete Prospect</span>
            </button>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1.5 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-neutral-700">
          {/* Rule 1 & Rule 2 Dual Metric & Window Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rule 1: Explicit Service Window Status */}
            <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Rule 1: Current Service Window</span>
                </span>

                {windowEval.status === 'in_window' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>In Window Now</span>
                  </span>
                )}
                {windowEval.status === 'in_service_or_closed' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    <span>{windowEval.isClosedToday ? 'Closed Today' : 'In Service'}</span>
                  </span>
                )}
                {windowEval.status === 'not_set' && (
                  <span className="text-xs text-neutral-500 font-medium">Window Not Set</span>
                )}
              </div>

              <div className="pt-1">
                <p className="font-semibold text-neutral-900 text-sm">{windowEval.windowDescription}</p>
                <p className="text-xs text-neutral-600 mt-0.5">{windowEval.reason}</p>
              </div>

              <div className="text-[11px] text-neutral-500 pt-1 border-t border-neutral-200/60 flex items-center justify-between">
                <span>
                  Closed Days: {restaurant.closed_days?.length ? restaurant.closed_days.join(', ') : 'None'}
                </span>
                <span className="font-mono text-neutral-600">
                  Target: {restaurant.best_window}
                </span>
              </div>
            </div>

            {/* Rule 2: Decision-Maker Dynamic Dual Counter */}
            <div className="p-4 rounded-lg border border-neutral-200 bg-neutral-50/70 space-y-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-600" />
                <span>Rule 2: Dynamic Contact Metric</span>
              </span>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] text-neutral-500 block">Verified Follow-ups</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono tabular-nums text-2xl font-bold text-neutral-900">
                      {followupCount}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      (Decision-Maker)
                    </span>
                  </div>
                </div>

                <div className="border-l border-neutral-200 pl-4">
                  <span className="text-[11px] text-neutral-500 block">Total Attempts / Drops</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono tabular-nums text-2xl font-bold text-neutral-600">
                      {totalAttempts}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      (Inc. gatekeepers)
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500 pt-1 border-t border-neutral-200/60 flex items-center justify-between">
                <span>CSV Historical Base: {restaurant.initial_followup_count || 0}</span>
                <span className="text-emerald-700 font-medium">Auto-computed from logs</span>
              </div>
            </div>
          </div>

          {/* Contact Details & Quick Communications */}
          <div className="p-4 bg-white rounded-lg border border-neutral-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-neutral-800">
                <span className="font-semibold text-neutral-900">{restaurant.contact_name}</span>
                <span className="text-neutral-400">·</span>
                <span className="text-neutral-600">{restaurant.contact_role}</span>
              </div>

              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="flex items-center gap-1 text-amber-700 hover:text-amber-800 font-medium"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{restaurant.phone}</span>
                </a>
              )}

              {restaurant.email && (
                <a
                  href={`mailto:${restaurant.email}`}
                  className="flex items-center gap-1 text-amber-700 hover:text-amber-800 font-medium"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{restaurant.email}</span>
                </a>
              )}

              {restaurant.address && (
                <div className="flex items-center gap-1 text-neutral-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{restaurant.address}</span>
                </div>
              )}
            </div>

            {restaurant.notes && (
              <p className="w-full text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded border border-neutral-100 italic">
                "{restaurant.notes}"
              </p>
            )}
          </div>

          {/* Samples Dropped Manager */}
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-neutral-900 text-xs">Food Samples Dropped at Kitchen</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSample(!showAddSample)}
                className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Sample</span>
              </button>
            </div>

            {showAddSample && (
              <form onSubmit={handleAddSampleSubmit} className="flex gap-2 mb-2.5">
                <input
                  type="text"
                  value={newSampleInput}
                  onChange={(e) => setNewSampleInput(e.target.value)}
                  placeholder="e.g. Wagyu A5 Strip, Truffle Butter, Smoked Maldon Salt..."
                  className="flex-1 px-3 py-1.5 border border-neutral-300 rounded text-xs bg-white text-neutral-900"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded text-xs"
                >
                  Save
                </button>
              </form>
            )}

            {restaurant.samples_dropped && restaurant.samples_dropped.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {restaurant.samples_dropped.map((sample) => (
                  <span
                    key={sample}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-neutral-200 text-neutral-800 text-xs shadow-2xs"
                  >
                    <span>{sample}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveSample(restaurant.id, sample)}
                      className="text-neutral-400 hover:text-rose-600 ml-0.5"
                      title="Remove sample"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400 text-[11px] italic">
                No samples dropped yet. Click 'Add Sample' after leaving tasting products.
              </p>
            )}
          </div>

          {/* Section: Rule 3 - Rep-Owned Tasks */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                  <span>Rule 3: Rep-Owned To-Do List</span>
                </h3>
                <p className="text-[11px] text-neutral-500">
                  100% Rep-owned (Owner = "Me"). Check off to trigger the follow-up prompt.
                </p>
              </div>
            </div>

            {/* Fast Task Creation Form with Date Presets */}
            <form onSubmit={handleCreateTask} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="e.g. Drop off 5lb sample of Truffle Butter, or send volume pricing"
                  className="flex-1 px-3 py-1.5 border border-neutral-300 rounded text-xs bg-white text-neutral-900 focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add Task</span>
                </button>
              </div>

              {/* Explicit Date Presets (Rule 3) */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-neutral-600">Fast Due Date:</span>
                <button
                  type="button"
                  onClick={() => handleDatePreset(0)}
                  className={`px-2 py-0.5 rounded text-[11px] border ${
                    newDueDate === new Date().toISOString().slice(0, 10)
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
                    newDueDate === null
                      ? 'bg-neutral-800 text-white border-neutral-800'
                      : 'bg-white text-neutral-700 border-neutral-300'
                  }`}
                >
                  [Needs Date]
                </button>
                {newDueDate && (
                  <span className="font-mono text-[11px] text-amber-700 font-bold ml-1">
                    Set for: {newDueDate}
                  </span>
                )}
              </div>
            </form>

            {/* Task Checklist */}
            <div className="space-y-1.5">
              {restaurantTodos.length === 0 ? (
                <p className="text-neutral-400 text-xs italic py-2">
                  No active tasks for this restaurant. Add one above to keep follow-up pipeline tight.
                </p>
              ) : (
                restaurantTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-start justify-between gap-3 p-2.5 rounded border transition-colors ${
                      todo.is_completed
                        ? 'bg-neutral-50/70 border-neutral-200 text-neutral-400'
                        : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-900'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
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
                            todo.is_completed ? 'line-through text-neutral-400' : 'font-medium'
                          }`}
                        >
                          {todo.task}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                          <span className="font-semibold text-neutral-600">Owner: Me</span>
                          <span>·</span>
                          {todo.due_date ? (
                            <span className="font-mono">Due: {todo.due_date}</span>
                          ) : (
                            <span className="italic text-neutral-400">Needs Date</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteTask(todo.id)}
                      className="text-neutral-300 hover:text-rose-600 p-1 transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Touchpoint Interaction History */}
          <div className="space-y-3 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  <span>Interaction & Touchpoint History</span>
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Official follow-ups are dynamically computed from verified decision-maker interactions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenLogModal(restaurant, null)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Record Touchpoint</span>
              </button>
            </div>

            {/* Logs List */}
            <div className="space-y-2.5">
              {restaurantLogs.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-neutral-200 rounded-lg text-neutral-400">
                  <p className="italic">No touchpoint logs recorded yet.</p>
                  <p className="text-[11px] mt-1">
                    Click "+ Record Touchpoint" above to record visit notes, phone calls, or sample drops.
                  </p>
                </div>
              ) : (
                restaurantLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Decision-Maker Badge */}
                        {log.spoke_to_decision_maker ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Decision-Maker Spoke (Official Follow-up)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3 text-neutral-500" />
                            <span>Gatekeeper / Attempt Only</span>
                          </span>
                        )}

                        <span className="text-[11px] font-semibold text-neutral-800 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">
                          {log.channel}
                        </span>

                        <span className="text-[11px] text-neutral-500">
                          with <strong className="text-neutral-700">{log.contact_person}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[11px] text-neutral-500">
                          {new Date(log.date).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })} · {new Date(log.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenLogModal(restaurant, log)}
                          className="text-neutral-400 hover:text-neutral-700 p-1"
                          title="Edit interaction note"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteLog(log.id)}
                          className="text-neutral-400 hover:text-rose-600 p-1"
                          title="Delete interaction note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-800 leading-relaxed pl-1 border-l-2 border-neutral-200">
                      {log.notes}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <div className="flex items-center gap-4">
            <span>Account created: {new Date(restaurant.created_at).toLocaleDateString()}</span>
            <button
              type="button"
              onClick={() => onDeleteRestaurant(restaurant.id, restaurant.name)}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 hover:underline transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Prospect</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
