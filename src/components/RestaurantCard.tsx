import React from 'react';
import { Restaurant, TodoItem, TouchpointLog } from '../types';
import { evaluateServiceWindow } from '../utils/timeWindow';
import { computeFollowupCount, computeTotalAttempts } from '../utils/storage';
import { Phone, MapPin, Calendar, CheckSquare, Plus, Clock, UserCheck, MessageSquare, ChevronRight } from 'lucide-react';

interface RestaurantCardProps {
  restaurant: Restaurant;
  logs: TouchpointLog[];
  todos: TodoItem[];
  effectiveTime: Date;
  onOpenDetail: (restaurant: Restaurant) => void;
  onQuickLog: (restaurant: Restaurant) => void;
  onQuickAddTask: (restaurant: Restaurant) => void;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  logs,
  todos,
  effectiveTime,
  onOpenDetail,
  onQuickLog,
  onQuickAddTask,
}) => {
  const windowEval = evaluateServiceWindow(restaurant, effectiveTime);
  const followupCount = computeFollowupCount(restaurant, logs);
  const totalAttempts = computeTotalAttempts(restaurant, logs);
  const openTodos = todos.filter((t) => t.restaurant_id === restaurant.id && !t.is_completed);

  // Status color styles for Rule 1
  let statusBadge = (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500">
      <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
      <span>Window Not Set</span>
    </span>
  );

  if (windowEval.status === 'in_window') {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
        <span>In Window</span>
        <span className="text-emerald-600 font-normal">({windowEval.reason})</span>
      </span>
    );
  } else if (windowEval.status === 'in_service_or_closed') {
    statusBadge = (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        <span>{windowEval.isClosedToday ? 'Closed Today' : 'In Service'}</span>
        <span className="text-rose-600/80 font-normal">· {windowEval.reason}</span>
      </span>
    );
  }

  // Pipeline status tag styling
  const pipelineClassMap: Record<string, string> = {
    'New Lead': 'text-sky-700 bg-sky-50 border-sky-200',
    'Sample Dropped': 'text-amber-700 bg-amber-50 border-amber-200',
    'Follow-up Due': 'text-orange-700 bg-orange-50 border-orange-200 font-semibold',
    'Tasting / Meeting': 'text-purple-700 bg-purple-50 border-purple-200 font-semibold',
    'Active Customer': 'text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold',
    'Archived / Passed': 'text-neutral-600 bg-neutral-100 border-neutral-200',
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-neutral-300 transition-all flex flex-col justify-between overflow-hidden group">
      <div className="p-4 sm:p-5">
        {/* Top Header: Name and Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <button
              onClick={() => onOpenDetail(restaurant)}
              className="text-base sm:text-lg font-bold text-neutral-900 hover:text-amber-600 transition-colors text-left flex items-center gap-1.5 group/title leading-snug"
            >
              <span className="truncate">{restaurant.name}</span>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover/title:translate-x-0.5 transition-transform shrink-0" />
            </button>
            <p className="text-xs text-neutral-500 truncate mt-0.5">{restaurant.cuisine}</p>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1">
            <span
              className={`text-[11px] px-2 py-0.5 rounded border ${
                pipelineClassMap[restaurant.status] || 'text-neutral-600 bg-neutral-50 border-neutral-200'
              }`}
            >
              {restaurant.status}
            </span>
          </div>
        </div>

        {/* Rule 1 Visual Badge & Service Window Indicator */}
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-neutral-100">
          <div>{statusBadge}</div>
          <div className="text-[11px] text-neutral-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-neutral-400" />
            <span>Target: {restaurant.best_window}</span>
          </div>
        </div>

        {/* Contact & Address Row */}
        <div className="mt-3.5 space-y-1.5 text-xs text-neutral-600">
          <div className="flex items-center gap-2 text-neutral-800">
            <UserCheck className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="font-semibold text-neutral-900">{restaurant.contact_name}</span>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-600">{restaurant.contact_role}</span>
          </div>

          {restaurant.address && (
            <div className="flex items-center gap-2 text-neutral-500">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{restaurant.address}</span>
            </div>
          )}
        </div>

        {/* Samples Dropped (if any) */}
        {restaurant.samples_dropped && restaurant.samples_dropped.length > 0 && (
          <div className="mt-3 p-2 bg-neutral-50 rounded border border-neutral-100 text-xs text-neutral-600">
            <span className="font-medium text-neutral-700">Samples Dropped: </span>
            <span className="italic">{restaurant.samples_dropped.join(', ')}</span>
          </div>
        )}

        {/* Rule 2 Dual Metric Display: Follow-ups vs Total Attempts */}
        <div className="mt-4 pt-3 border-t border-neutral-100 bg-neutral-50/80 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3.5 sm:px-5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-semibold tracking-wider">
                  Verified Follow-ups
                </span>
                <span className="font-mono tabular-nums text-base font-bold text-neutral-900">
                  {followupCount}
                </span>
                <span className="text-[10px] text-neutral-500 ml-1">(Decision-Maker)</span>
              </div>
              <div className="border-l border-neutral-200 pl-3">
                <span className="text-neutral-500 block text-[10px] uppercase font-semibold tracking-wider">
                  Total Attempts
                </span>
                <span className="font-mono tabular-nums text-base font-semibold text-neutral-600">
                  {totalAttempts}
                </span>
                <span className="text-[10px] text-neutral-500 ml-1">(Inc. Gatekeepers)</span>
              </div>
            </div>

            {/* Rep Tasks Count */}
            <div className="text-right">
              <span className="text-neutral-500 block text-[10px] uppercase font-semibold tracking-wider">
                Open Tasks
              </span>
              <span
                className={`font-mono tabular-nums text-sm font-semibold ${
                  openTodos.length > 0 ? 'text-amber-600' : 'text-neutral-400'
                }`}
              >
                {openTodos.length}
              </span>
            </div>
          </div>

          {/* Next Due Task Preview (if open tasks exist) */}
          {openTodos.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-neutral-200/60 flex items-start gap-1.5 text-[11px] text-neutral-700">
              <CheckSquare className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span className="truncate flex-1 font-medium">{openTodos[0].task}</span>
              {openTodos[0].due_date && (
                <span className="text-[10px] text-neutral-500 shrink-0 font-mono">
                  Due {openTodos[0].due_date}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="border-t border-neutral-200 bg-white px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
              title={`Call ${restaurant.phone}`}
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={() => onQuickAddTask(restaurant)}
            className="text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 px-2 py-1 rounded transition-colors flex items-center gap-1 font-medium"
            title="Add a rep-owned task"
          >
            <Plus className="w-3 h-3 text-amber-600" />
            <span>Task</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onQuickLog(restaurant)}
            className="px-2.5 py-1 text-xs font-semibold text-neutral-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded transition-colors flex items-center gap-1.5"
            title="Quick log visit or call notes"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-800" />
            <span>+ Log Touch</span>
          </button>

          <button
            onClick={() => onOpenDetail(restaurant)}
            className="px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 rounded transition-colors"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};
