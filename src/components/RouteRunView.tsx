import React from 'react';
import { Restaurant, TodoItem, TouchpointLog } from '../types';
import { evaluateServiceWindow, getWindowRange } from '../utils/timeWindow';
import { computeFollowupCount, computeTotalAttempts } from '../utils/storage';
import { Clock, Phone, MapPin, MessageSquare, Plus, AlertOctagon, CheckCircle2, ChevronRight } from 'lucide-react';

interface RouteRunViewProps {
  restaurants: Restaurant[];
  logs: TouchpointLog[];
  todos: TodoItem[];
  effectiveTime: Date;
  onOpenDetail: (restaurant: Restaurant) => void;
  onQuickLog: (restaurant: Restaurant) => void;
  onQuickAddTask: (restaurant: Restaurant) => void;
}

export const RouteRunView: React.FC<RouteRunViewProps> = ({
  restaurants,
  logs,
  todos,
  effectiveTime,
  onOpenDetail,
  onQuickLog,
  onQuickAddTask,
}) => {
  const currentMinutes = effectiveTime.getHours() * 60 + effectiveTime.getMinutes();

  // Evaluate each restaurant
  const categorized = {
    inWindow: [] as Array<{ rest: Restaurant; reason: string; windowDesc: string }>,
    upcomingToday: [] as Array<{ rest: Restaurant; opensIn: string; windowDesc: string }>,
    inRush: [] as Array<{ rest: Restaurant; reason: string; windowDesc: string }>,
    closedToday: [] as Array<{ rest: Restaurant; reason: string; windowDesc: string }>,
  };

  restaurants.forEach((rest) => {
    const evalResult = evaluateServiceWindow(rest, effectiveTime);
    if (evalResult.isClosedToday) {
      categorized.closedToday.push({
        rest,
        reason: evalResult.reason,
        windowDesc: evalResult.windowDescription,
      });
      return;
    }

    if (evalResult.status === 'in_window') {
      categorized.inWindow.push({
        rest,
        reason: evalResult.reason,
        windowDesc: evalResult.windowDescription,
      });
      return;
    }

    // Check if it's upcoming today
    const range = getWindowRange(rest.best_window, rest.custom_window_start, rest.custom_window_end);
    if (range && currentMinutes < range.startMinutes) {
      const minsUntil = range.startMinutes - currentMinutes;
      const h = Math.floor(minsUntil / 60);
      const m = minsUntil % 60;
      const opensIn = h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
      categorized.upcomingToday.push({
        rest,
        opensIn,
        windowDesc: evalResult.windowDescription,
      });
      return;
    }

    // Otherwise it is currently in rush or finished for the day
    categorized.inRush.push({
      rest,
      reason: evalResult.reason,
      windowDesc: evalResult.windowDescription,
    });
  });

  return (
    <div className="space-y-6">
      {/* Route Run Header */}
      <div className="bg-white border border-neutral-200 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>Today's Kitchen Windows & Field Route</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Rule 1 Radar: Optimized for outside reps in transit. Drop by kitchens only during prep and shift lulls—never interrupt service.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>{categorized.inWindow.length} Open Right Now</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-600">
            <span>{categorized.upcomingToday.length} Upcoming</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-50 border border-rose-200 text-rose-800">
            <span>{categorized.inRush.length} Rush / Done</span>
          </div>
        </div>
      </div>

      {/* Group 1: 🟢 IN WINDOW RIGHT NOW */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            In Window Right Now ({categorized.inWindow.length})
          </h3>
          <span className="text-xs text-emerald-700 font-medium">
            — Safe to drop in or call chef immediately
          </span>
        </div>

        {categorized.inWindow.length === 0 ? (
          <div className="p-6 bg-white border border-dashed border-neutral-200 rounded-lg text-center text-neutral-500 text-xs">
            No kitchens in window at this exact time. Check "Upcoming Later Today" or use the top Simulate Time bar to test 10:00 AM Prep or 2:45 PM Shift Lull.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorized.inWindow.map(({ rest, reason, windowDesc }) => {
              const followups = computeFollowupCount(rest, logs);
              const attempts = computeTotalAttempts(rest, logs);
              return (
                <div
                  key={rest.id}
                  className="bg-white border-2 border-emerald-500 rounded-lg p-4 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => onOpenDetail(rest)}
                        className="text-base font-bold text-neutral-900 hover:text-emerald-700 text-left truncate flex-1"
                      >
                        {rest.name}
                      </button>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                        OPEN
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 truncate mt-0.5">{rest.cuisine}</p>

                    <div className="mt-2.5 p-2 bg-emerald-50/70 border border-emerald-100 rounded text-xs text-emerald-800">
                      <div className="font-semibold">{windowDesc}</div>
                      <div className="text-[11px] text-emerald-700/90">{reason}</div>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-neutral-700">
                      <div className="font-medium text-neutral-900">
                        {rest.contact_name} ({rest.contact_role})
                      </div>
                      <div className="text-neutral-500 truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                        <span>{rest.address}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-mono">
                      <span className="text-neutral-500">
                        Follow-ups: <strong className="text-neutral-900">{followups}</strong>
                      </span>
                      <span className="text-neutral-400">
                        Attempts: <strong className="text-neutral-600">{attempts}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between gap-2">
                    {rest.phone && (
                      <a
                        href={`tel:${rest.phone}`}
                        className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded"
                        title={`Call ${rest.phone}`}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => onQuickAddTask(rest)}
                      className="text-xs text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded border border-neutral-200"
                    >
                      + Task
                    </button>
                    <button
                      onClick={() => onQuickLog(rest)}
                      className="px-3 py-1.5 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded flex items-center gap-1 shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Log Touch</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Group 2: ⏳ UPCOMING LATER TODAY */}
      {categorized.upcomingToday.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Opening Later Today ({categorized.upcomingToday.length})
            </h3>
            <span className="text-xs text-neutral-500">
              — Target these for your afternoon field circuit
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorized.upcomingToday.map(({ rest, opensIn, windowDesc }) => {
              const followups = computeFollowupCount(rest, logs);
              return (
                <div
                  key={rest.id}
                  className="bg-white border border-neutral-200 rounded-lg p-4 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => onOpenDetail(rest)}
                        className="text-base font-bold text-neutral-900 hover:text-amber-600 text-left truncate flex-1"
                      >
                        {rest.name}
                      </button>
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        Opens {opensIn}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500 truncate mt-0.5">{rest.cuisine}</p>

                    <div className="mt-2 text-xs text-neutral-600">
                      <span className="font-semibold text-neutral-800">Target:</span> {windowDesc}
                    </div>

                    <div className="mt-2 text-xs text-neutral-500 truncate flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                      <span>{rest.address}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-neutral-600">Follow-ups: {followups}</span>
                    <button
                      onClick={() => onOpenDetail(rest)}
                      className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                    >
                      <span>View Account</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Group 3: 🔴 IN RUSH / CLOSED TODAY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* In Rush */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              In Service / Rush Hour ({categorized.inRush.length})
            </h3>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100 text-xs">
            {categorized.inRush.length === 0 ? (
              <p className="p-4 text-neutral-400 italic">No kitchens in peak rush right now.</p>
            ) : (
              categorized.inRush.map(({ rest, reason, windowDesc }) => (
                <div
                  key={rest.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className="min-w-0">
                    <button
                      onClick={() => onOpenDetail(rest)}
                      className="font-bold text-neutral-900 hover:text-amber-600 truncate block text-left"
                    >
                      {rest.name}
                    </button>
                    <span className="text-[11px] text-rose-600 block">{reason}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 shrink-0 font-mono">
                    Window: {windowDesc}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Closed Today */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-400"></span>
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Closed Today ({categorized.closedToday.length})
            </h3>
          </div>

          <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100 text-xs">
            {categorized.closedToday.length === 0 ? (
              <p className="p-4 text-neutral-400 italic">All kitchens operating today.</p>
            ) : (
              categorized.closedToday.map(({ rest, reason }) => (
                <div
                  key={rest.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className="min-w-0">
                    <button
                      onClick={() => onOpenDetail(rest)}
                      className="font-bold text-neutral-900 hover:text-amber-600 truncate block text-left"
                    >
                      {rest.name}
                    </button>
                    <span className="text-[11px] text-neutral-500 block">{rest.cuisine}</span>
                  </div>
                  <span className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-medium shrink-0">
                    {reason}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
