import React from 'react';
import { PipelineStatus, Restaurant, TodoItem, TouchpointLog } from '../types';
import { evaluateServiceWindow } from '../utils/timeWindow';
import { computeFollowupCount, computeTotalAttempts } from '../utils/storage';
import { Kanban, Clock, ChevronRight, MessageSquare } from 'lucide-react';

interface PipelineKanbanViewProps {
  restaurants: Restaurant[];
  logs: TouchpointLog[];
  todos: TodoItem[];
  effectiveTime: Date;
  onOpenDetail: (restaurant: Restaurant) => void;
  onQuickLog: (restaurant: Restaurant) => void;
  onUpdateStatus: (restaurantId: string, newStatus: PipelineStatus) => void;
}

export const PipelineKanbanView: React.FC<PipelineKanbanViewProps> = ({
  restaurants,
  logs,
  todos,
  effectiveTime,
  onOpenDetail,
  onQuickLog,
  onUpdateStatus,
}) => {
  const stages: Array<{ status: PipelineStatus; color: string }> = [
    { status: 'New Lead', color: 'border-sky-500 text-sky-700 bg-sky-50' },
    { status: 'Sample Dropped', color: 'border-amber-500 text-amber-700 bg-amber-50' },
    { status: 'Follow-up Due', color: 'border-orange-500 text-orange-700 bg-orange-50' },
    { status: 'Tasting / Meeting', color: 'border-purple-500 text-purple-700 bg-purple-50' },
    { status: 'Active Customer', color: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
    { status: 'Archived / Passed', color: 'border-neutral-400 text-neutral-600 bg-neutral-100' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Kanban className="w-5 h-5 text-amber-600" />
            <span>Outside Food Sales Pipeline Board</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Track kitchen stages from initial lead and sample drops to tastings and standing weekly customer orders.
          </p>
        </div>

        <span className="text-xs font-mono text-neutral-500">
          Total Accounts: <strong className="text-neutral-900">{restaurants.length}</strong>
        </span>
      </div>

      {/* Kanban Board Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(({ status, color }) => {
          const colRestaurants = restaurants.filter((r) => r.status === status);

          return (
            <div
              key={status}
              className="w-80 shrink-0 bg-neutral-100/70 border border-neutral-200 rounded-lg flex flex-col max-h-[75vh]"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-neutral-200 bg-white rounded-t-lg flex items-center justify-between">
                <span className="font-bold text-xs text-neutral-900">{status}</span>
                <span className="font-mono text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded font-semibold">
                  {colRestaurants.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1">
                {colRestaurants.length === 0 ? (
                  <p className="text-[11px] text-neutral-400 italic text-center py-6">
                    No accounts in {status}
                  </p>
                ) : (
                  colRestaurants.map((rest) => {
                    const windowEval = evaluateServiceWindow(rest, effectiveTime);
                    const followups = computeFollowupCount(rest, logs);
                    const attempts = computeTotalAttempts(rest, logs);
                    const openTasks = todos.filter(
                      (t) => t.restaurant_id === rest.id && !t.is_completed
                    ).length;

                    return (
                      <div
                        key={rest.id}
                        className="bg-white border border-neutral-200 rounded-md p-3 shadow-2xs hover:border-neutral-300 transition-all space-y-2"
                      >
                        {/* Name and Window badge */}
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => onOpenDetail(rest)}
                            className="font-bold text-xs text-neutral-900 hover:text-amber-600 text-left truncate flex-1"
                          >
                            {rest.name}
                          </button>

                          {/* Rule 1 Badge */}
                          {windowEval.status === 'in_window' ? (
                            <span
                              className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0"
                              title="In Window Now"
                            ></span>
                          ) : (
                            <span
                              className="w-2 h-2 rounded-full bg-rose-500 shrink-0"
                              title="In Service or Closed"
                            ></span>
                          )}
                        </div>

                        <p className="text-[11px] text-neutral-500 truncate">{rest.cuisine}</p>

                        <div className="text-[11px] text-neutral-700">
                          <span className="font-medium">{rest.contact_name}</span>
                          <span className="text-neutral-400"> · </span>
                          <span className="text-neutral-500">{rest.contact_role}</span>
                        </div>

                        {/* Rule 2 Dual Metric */}
                        <div className="pt-1.5 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-neutral-600">
                            Follow-ups: <strong className="text-neutral-900">{followups}</strong>
                          </span>
                          <span className="text-neutral-400">
                            Att: <strong className="text-neutral-600">{attempts}</strong>
                          </span>
                        </div>

                        {/* Move Stage Selector */}
                        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-1">
                          <select
                            value={rest.status}
                            onChange={(e) =>
                              onUpdateStatus(rest.id, e.target.value as PipelineStatus)
                            }
                            className="text-[10px] bg-neutral-50 border border-neutral-200 rounded px-1.5 py-0.5 text-neutral-700 max-w-[130px] truncate"
                          >
                            {stages.map((s) => (
                              <option key={s.status} value={s.status}>
                                Move: {s.status}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => onQuickLog(rest)}
                            className="p-1 text-neutral-600 hover:text-amber-700 hover:bg-neutral-50 rounded"
                            title="Quick Log Touchpoint"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenDetail(rest)}
                            className="p-1 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded"
                            title="View Full Profile"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
