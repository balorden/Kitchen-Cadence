/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Restaurant,
  TouchpointLog,
  TodoItem,
  PipelineStatus,
  WindowStatusType,
} from './types';
import {
  loadRestaurants,
  saveRestaurants,
  loadLogs,
  saveLogs,
  loadTodos,
  saveTodos,
  resetToDemoData,
  computeFollowupCount,
  computeTotalAttempts,
} from './utils/storage';
import { evaluateServiceWindow } from './utils/timeWindow';

import { Header, ActiveTab } from './components/Header';
import { TimeBar } from './components/TimeBar';
import { RestaurantCard } from './components/RestaurantCard';
import { RestaurantDetailModal } from './components/RestaurantDetailModal';
import { LogTouchpointModal } from './components/LogTouchpointModal';
import { AddEditRestaurantModal } from './components/AddEditRestaurantModal';
import { TaskCompletionModal } from './components/TaskCompletionModal';
import { CsvImportExportModal } from './components/CsvImportExportModal';
import { RouteRunView } from './components/RouteRunView';
import { AllTasksView } from './components/AllTasksView';
import { PipelineKanbanView } from './components/PipelineKanbanView';
import { ConfirmModal } from './components/ConfirmModal';

import {
  Search,
  SlidersHorizontal,
  Plus,
  UtensilsCrossed,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
} from 'lucide-react';

export default function App() {
  // Persistence state
  const [restaurants, setRestaurants] = useState<Restaurant[]>(loadRestaurants);
  const [logs, setLogs] = useState<TouchpointLog[]>(loadLogs);
  const [todos, setTodos] = useState<TodoItem[]>(loadTodos);

  // Time & Simulation state
  const [liveTime, setLiveTime] = useState<Date>(new Date());
  const [simulatedTime, setSimulatedTime] = useState<Date | null>(null);

  // Keep live clock fresh
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const effectiveTime = useMemo(() => {
    return simulatedTime || liveTime;
  }, [simulatedTime, liveTime]);

  // Sync to localStorage
  useEffect(() => {
    saveRestaurants(restaurants);
  }, [restaurants]);

  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('directory');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [windowFilter, setWindowFilter] = useState<'all' | 'in_window' | 'in_service'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PipelineStatus>('all');
  const [sortBy, setSortBy] = useState<'window' | 'followups' | 'name' | 'recent'>('window');

  // Modals state
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  // In-app Confirmation Dialog state (Bypasses iframe window.confirm blocking)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Delete',
    isDestructive: true,
    onConfirm: () => {},
  });

  // Quick Log modal state
  const [logModalTarget, setLogModalTarget] = useState<{
    restaurant: Restaurant;
    existingLog?: TouchpointLog | null;
    taskNote?: string;
  } | null>(null);

  // Rule 3 Workflow Hook state
  const [taskCompletionPrompt, setTaskCompletionPrompt] = useState<{
    task: TodoItem;
    restaurant: Restaurant;
  } | null>(null);

  // CSV modal state
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Toast feedback notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Rule 1 Counts for header and time bar
  const { inWindowCount, inServiceCount } = useMemo(() => {
    let inWindow = 0;
    let inService = 0;
    restaurants.forEach((r) => {
      const evalRes = evaluateServiceWindow(r, effectiveTime);
      if (evalRes.status === 'in_window') inWindow++;
      else inService++;
    });
    return { inWindowCount: inWindow, inServiceCount: inService };
  }, [restaurants, effectiveTime]);

  const openTaskCount = useMemo(() => {
    return todos.filter((t) => !t.is_completed).length;
  }, [todos]);

  // Handlers for Restaurants
  const handleSaveRestaurant = (updated: Restaurant) => {
    const finalRecord: Restaurant = {
      ...updated,
      id: updated.id || `rest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setRestaurants((prev) => {
      const exists = prev.some((r) => r.id === finalRecord.id);
      if (exists) {
        return prev.map((r) => (r.id === finalRecord.id ? finalRecord : r));
      }
      return [finalRecord, ...prev];
    });
    if (selectedRestaurant?.id === finalRecord.id) {
      setSelectedRestaurant(finalRecord);
    }
    showToast(`Saved account: ${finalRecord.name}`);
  };

  const handleDeleteRestaurant = (restaurantId: string, restaurantName?: string) => {
    const target = restaurants.find((r) => r.id === restaurantId);
    const name = restaurantName || target?.name || 'this prospect';

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Prospect',
      message: `Are you sure you want to delete "${name}"? This will remove the prospect from all views, along with all their touchpoint interaction logs and open tasks.`,
      confirmLabel: 'Delete Prospect',
      isDestructive: true,
      onConfirm: () => {
        setRestaurants((prev) => prev.filter((r) => r.id !== restaurantId));
        setLogs((prev) => prev.filter((l) => l.restaurant_id !== restaurantId));
        setTodos((prev) => prev.filter((t) => t.restaurant_id !== restaurantId));
        if (selectedRestaurant?.id === restaurantId) {
          setSelectedRestaurant(null);
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(`Deleted prospect: ${name}`);
      },
    });
  };

  const handleClearAllRestaurants = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Clear All Prospects & Start Fresh',
      message: 'Are you sure you want to delete ALL prospects, logs, and tasks? You will be starting with an empty territory so you can create new prospects from scratch.',
      confirmLabel: 'Delete All Prospects',
      isDestructive: true,
      onConfirm: () => {
        setRestaurants([]);
        setLogs([]);
        setTodos([]);
        setSelectedRestaurant(null);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast('All prospects deleted. Ready to create from scratch.');
      },
    });
  };

  // Handlers for Logs (Rule 2)
  const handleSaveLog = (
    newLog: Omit<TouchpointLog, 'id'>,
    followupTask?: { task: string; dueDate: string | null }
  ) => {
    const createdLog: TouchpointLog = {
      ...newLog,
      id: `log-${Date.now()}`,
    };
    setLogs((prev) => [createdLog, ...prev]);

    // If rep also checked "create follow-up task"
    if (followupTask) {
      const newTodo: TodoItem = {
        id: `todo-${Date.now()}`,
        restaurant_id: newLog.restaurant_id,
        task: followupTask.task,
        owner: 'Me', // Rule 3: 100% Rep-owned
        due_date: followupTask.dueDate,
        is_completed: false,
        created_at: new Date().toISOString(),
      };
      setTodos((prev) => [newTodo, ...prev]);
    }

    const typeMsg = createdLog.spoke_to_decision_maker
      ? 'Verified follow-up recorded (+1 official follow-up)'
      : 'Attempt recorded (total attempts updated, official follow-up preserved)';
    showToast(typeMsg);
  };

  const handleUpdateLog = (id: string, updated: Omit<TouchpointLog, 'id'>) => {
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...updated, id } : l))
    );
    showToast('Updated touchpoint log');
  };

  const handleDeleteLog = (logId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Touchpoint Note',
      message: 'Are you sure you want to delete this interaction log? Your official follow-up count and attempts will update dynamically.',
      confirmLabel: 'Delete Note',
      isDestructive: true,
      onConfirm: () => {
        setLogs((prev) => prev.filter((l) => l.id !== logId));
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast('Deleted interaction log');
      },
    });
  };

  // Handlers for Tasks (Rule 3)
  const handleAddTask = (restaurantId: string, taskText: string, dueDate: string | null) => {
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      restaurant_id: restaurantId,
      task: taskText,
      owner: 'Me', // Rule 3
      due_date: dueDate,
      is_completed: false,
      created_at: new Date().toISOString(),
    };
    setTodos((prev) => [newTodo, ...prev]);
    showToast('Added rep-owned task');
  };

  const handleToggleTask = (task: TodoItem) => {
    if (task.is_completed) {
      // Unchecking task
      setTodos((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_completed: false } : t))
      );
      showToast('Task marked incomplete');
    } else {
      // Rule 3 Workflow Hook: checking complete triggers prompt
      const rest = restaurants.find((r) => r.id === task.restaurant_id);
      if (rest) {
        setTaskCompletionPrompt({ task, restaurant: rest });
      } else {
        setTodos((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, is_completed: true } : t))
        );
      }
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== taskId));
    showToast('Task removed');
  };

  // Rule 3 Hook actions
  const handleLogAsFollowupFromTask = (task: TodoItem, restaurant: Restaurant) => {
    // Mark task completed
    setTodos((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_completed: true } : t))
    );
    setTaskCompletionPrompt(null);
    // Open log modal with task notes pre-filled
    setLogModalTarget({
      restaurant,
      existingLog: null,
      taskNote: task.task,
    });
  };

  const handleJustMarkComplete = (task: TodoItem) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, is_completed: true } : t))
    );
    setTaskCompletionPrompt(null);
    showToast('Task marked complete');
  };

  // Sample management handlers
  const handleAddSample = (restaurantId: string, sampleName: string) => {
    setRestaurants((prev) =>
      prev.map((r) => {
        if (r.id !== restaurantId) return r;
        const current = r.samples_dropped || [];
        if (current.includes(sampleName)) return r;
        return { ...r, samples_dropped: [...current, sampleName] };
      })
    );
    if (selectedRestaurant?.id === restaurantId) {
      setSelectedRestaurant((prev) =>
        prev
          ? {
              ...prev,
              samples_dropped: [...(prev.samples_dropped || []), sampleName],
            }
          : null
      );
    }
    showToast(`Added sample: ${sampleName}`);
  };

  const handleRemoveSample = (restaurantId: string, sampleName: string) => {
    setRestaurants((prev) =>
      prev.map((r) => {
        if (r.id !== restaurantId) return r;
        return {
          ...r,
          samples_dropped: (r.samples_dropped || []).filter((s) => s !== sampleName),
        };
      })
    );
    if (selectedRestaurant?.id === restaurantId) {
      setSelectedRestaurant((prev) =>
        prev
          ? {
              ...prev,
              samples_dropped: (prev.samples_dropped || []).filter((s) => s !== sampleName),
            }
          : null
      );
    }
  };

  // CSV Import & Reset
  const handleImportRestaurants = (newRests: Restaurant[]) => {
    setRestaurants((prev) => [...newRests, ...prev]);
    showToast(`Successfully ingested ${newRests.length} restaurant accounts`);
  };

  const handleResetDemo = () => {
    const data = resetToDemoData();
    setRestaurants(data.restaurants);
    setLogs(data.logs);
    setTodos(data.todos);
    setSelectedRestaurant(null);
    showToast('Reset to demo outside sales dataset');
  };

  // Filtered & Sorted Restaurants
  const filteredRestaurants = useMemo(() => {
    return restaurants
      .filter((r) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            r.name.toLowerCase().includes(q) ||
            r.cuisine.toLowerCase().includes(q) ||
            r.contact_name.toLowerCase().includes(q) ||
            r.address.toLowerCase().includes(q) ||
            (r.notes || '').toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Window filter
        if (windowFilter !== 'all') {
          const evalRes = evaluateServiceWindow(r, effectiveTime);
          if (windowFilter === 'in_window' && evalRes.status !== 'in_window') return false;
          if (windowFilter === 'in_service' && evalRes.status !== 'in_service_or_closed') return false;
        }

        // Pipeline status filter
        if (statusFilter !== 'all' && r.status !== statusFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'window') {
          const aEval = evaluateServiceWindow(a, effectiveTime);
          const bEval = evaluateServiceWindow(b, effectiveTime);
          if (aEval.status === 'in_window' && bEval.status !== 'in_window') return -1;
          if (bEval.status === 'in_window' && aEval.status !== 'in_window') return 1;
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'followups') {
          const aCount = computeFollowupCount(a, logs);
          const bCount = computeFollowupCount(b, logs);
          return bCount - aCount;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        // recent
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [restaurants, searchQuery, windowFilter, statusFilter, sortBy, effectiveTime, logs]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 text-neutral-900">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingRestaurant(null);
          setIsAddEditOpen(true);
        }}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        openTaskCount={openTaskCount}
        inWindowCount={inWindowCount}
      />

      {/* Rep Clock & Window Simulator Bar */}
      <TimeBar
        effectiveTime={effectiveTime}
        isSimulated={simulatedTime !== null}
        onSetSimulatedTime={setSimulatedTime}
        inWindowCount={inWindowCount}
        inServiceCount={inServiceCount}
        totalCount={restaurants.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* TAB 1: ACCOUNTS DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            {/* Search & Filter Tooling Bar */}
            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-2xs space-y-3">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search accounts by restaurant name, chef, cuisine, or street address..."
                    className="w-full pl-9 pr-4 py-2 border border-neutral-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Service Window Filter (Segmented control) */}
                <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded text-xs shrink-0">
                  <button
                    onClick={() => setWindowFilter('all')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      windowFilter === 'all'
                        ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    All Accounts
                  </button>
                  <button
                    onClick={() => setWindowFilter('in_window')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                      windowFilter === 'in_window'
                        ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>In Window ({inWindowCount})</span>
                  </button>
                  <button
                    onClick={() => setWindowFilter('in_service')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${
                      windowFilter === 'in_service'
                        ? 'bg-rose-600 text-white shadow-2xs font-bold'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    In Rush / Closed ({inServiceCount})
                  </button>
                </div>
              </div>

              {/* Secondary Filters: Pipeline Status & Sort */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-neutral-500 font-medium flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Pipeline:</span>
                  </span>
                  {(
                    [
                      'all',
                      'New Lead',
                      'Sample Dropped',
                      'Follow-up Due',
                      'Tasting / Meeting',
                      'Active Customer',
                      'Archived / Passed',
                    ] as const
                  ).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                        statusFilter === st
                          ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                      }`}
                    >
                      {st === 'all' ? 'All Stages' : st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 font-medium flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Sort:</span>
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="px-2 py-1 border border-neutral-300 rounded text-xs bg-white text-neutral-800"
                  >
                    <option value="window">Window (In Window First)</option>
                    <option value="followups">Most Follow-ups (Decision-Maker)</option>
                    <option value="name">Alphabetical (A-Z)</option>
                    <option value="recent">Recently Added</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Count Banner */}
            <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
              <div className="flex items-center gap-3">
                <span>
                  Showing <strong className="text-neutral-800 font-mono">{filteredRestaurants.length}</strong> of{' '}
                  <strong className="text-neutral-800 font-mono">{restaurants.length}</strong> restaurant accounts
                </span>
                {restaurants.length > 0 && (
                  <button
                    onClick={handleClearAllRestaurants}
                    className="text-[11px] text-neutral-400 hover:text-rose-600 transition-colors flex items-center gap-1 font-medium ml-2"
                    title="Delete all prospects and start from a clean slate"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
              {windowFilter === 'in_window' && (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Filtered to kitchens safe for visit or call right now</span>
                </span>
              )}
            </div>

            {/* Restaurant Cards Grid */}
            {filteredRestaurants.length === 0 ? (
              restaurants.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-neutral-300 rounded-lg p-12 text-center space-y-3">
                  <UtensilsCrossed className="w-10 h-10 text-neutral-400 mx-auto" />
                  <h3 className="text-base font-bold text-neutral-900">Your Prospect List is Empty</h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto">
                    You are working with a completely clean slate. Add your restaurant accounts from scratch, or import a list from CSV.
                  </p>
                  <div className="pt-3 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setEditingRestaurant(null);
                        setIsAddEditOpen(true);
                      }}
                      className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded shadow-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Create Prospect from Scratch</span>
                    </button>
                    <button
                      onClick={() => setIsCsvModalOpen(true)}
                      className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded"
                    >
                      Import CSV List
                    </button>
                    <button
                      onClick={handleResetDemo}
                      className="px-4 py-2 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded border border-neutral-200"
                    >
                      Restore Demo Territory
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center space-y-3">
                  <UtensilsCrossed className="w-10 h-10 text-neutral-300 mx-auto" />
                  <h3 className="text-sm font-bold text-neutral-800">No restaurants match your filters</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Try changing your search terms, clearing the window filter, or importing a restaurant list via CSV.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setWindowFilter('all');
                        setStatusFilter('all');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded"
                    >
                      Reset Filters
                    </button>
                    <button
                      onClick={() => {
                        setEditingRestaurant(null);
                        setIsAddEditOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded shadow-xs"
                    >
                      + Add New Account
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    logs={logs}
                    todos={todos}
                    effectiveTime={effectiveTime}
                    onOpenDetail={setSelectedRestaurant}
                    onQuickLog={(r) =>
                      setLogModalTarget({ restaurant: r, existingLog: null })
                    }
                    onQuickAddTask={(r) => {
                      setSelectedRestaurant(r);
                    }}
                    onDeleteRestaurant={handleDeleteRestaurant}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TODAY'S SERVICE WINDOWS & ROUTE RUN */}
        {activeTab === 'windows' && (
          <RouteRunView
            restaurants={restaurants}
            logs={logs}
            todos={todos}
            effectiveTime={effectiveTime}
            onOpenDetail={setSelectedRestaurant}
            onQuickLog={(r) =>
              setLogModalTarget({ restaurant: r, existingLog: null })
            }
            onQuickAddTask={(r) => setSelectedRestaurant(r)}
            onDeleteRestaurant={handleDeleteRestaurant}
          />
        )}

        {/* TAB 3: REP TASKS */}
        {activeTab === 'tasks' && (
          <AllTasksView
            todos={todos}
            restaurants={restaurants}
            effectiveTime={effectiveTime}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onAddTask={handleAddTask}
            onOpenDetail={setSelectedRestaurant}
            onOpenAddRestaurant={() => {
              setEditingRestaurant(null);
              setIsAddEditOpen(true);
            }}
          />
        )}

        {/* TAB 4: PIPELINE KANBAN */}
        {activeTab === 'pipeline' && (
          <PipelineKanbanView
            restaurants={restaurants}
            logs={logs}
            todos={todos}
            effectiveTime={effectiveTime}
            onOpenDetail={setSelectedRestaurant}
            onQuickLog={(r) =>
              setLogModalTarget({ restaurant: r, existingLog: null })
            }
            onUpdateStatus={(restId, newStatus) => {
              setRestaurants((prev) =>
                prev.map((r) => (r.id === restId ? { ...r, status: newStatus } : r))
              );
              showToast(`Advanced account stage to ${newStatus}`);
            }}
            onDeleteRestaurant={handleDeleteRestaurant}
          />
        )}
      </main>

      {/* Restaurant Detail Modal */}
      {selectedRestaurant && (
        <RestaurantDetailModal
          restaurant={selectedRestaurant}
          logs={logs}
          todos={todos}
          effectiveTime={effectiveTime}
          onClose={() => setSelectedRestaurant(null)}
          onEditRestaurant={(r) => {
            setEditingRestaurant(r);
            setIsAddEditOpen(true);
          }}
          onOpenLogModal={(r, existingLog) =>
            setLogModalTarget({ restaurant: r, existingLog })
          }
          onDeleteLog={handleDeleteLog}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onAddSample={handleAddSample}
          onRemoveSample={handleRemoveSample}
          onDeleteRestaurant={handleDeleteRestaurant}
        />
      )}

      {/* Quick Log Touchpoint Modal */}
      {logModalTarget && (
        <LogTouchpointModal
          restaurant={logModalTarget.restaurant}
          existingLog={logModalTarget.existingLog}
          initialTaskNote={logModalTarget.taskNote}
          onSaveLog={handleSaveLog}
          onUpdateLog={handleUpdateLog}
          onClose={() => setLogModalTarget(null)}
        />
      )}

      {/* Add / Edit Restaurant Modal */}
      {isAddEditOpen && (
        <AddEditRestaurantModal
          restaurant={editingRestaurant}
          onSave={handleSaveRestaurant}
          onClose={() => {
            setIsAddEditOpen(false);
            setEditingRestaurant(null);
          }}
          onDelete={handleDeleteRestaurant}
        />
      )}

      {/* Rule 3 Task Completion Workflow Hook Modal */}
      {taskCompletionPrompt && (
        <TaskCompletionModal
          task={taskCompletionPrompt.task}
          restaurant={taskCompletionPrompt.restaurant}
          onLogAsFollowup={handleLogAsFollowupFromTask}
          onJustComplete={handleJustMarkComplete}
          onCancel={() => setTaskCompletionPrompt(null)}
        />
      )}

      {/* CSV Ingestion & Export Modal */}
      {isCsvModalOpen && (
        <CsvImportExportModal
          restaurants={restaurants}
          logs={logs}
          todos={todos}
          onImport={handleImportRestaurants}
          onResetDemo={handleResetDemo}
          onClearAll={handleClearAllRestaurants}
          onClose={() => setIsCsvModalOpen(false)}
        />
      )}

      {/* In-app Confirmation Dialog (Never blocked by iframe sandbox) */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-xl border border-neutral-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
