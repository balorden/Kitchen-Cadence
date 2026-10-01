import React, { useState } from 'react';
import { Clock, RefreshCw, Zap, SlidersHorizontal, Sun, Utensils, Coffee, Moon } from 'lucide-react';
import { DAYS_OF_WEEK } from '../utils/timeWindow';

interface TimeBarProps {
  effectiveTime: Date;
  isSimulated: boolean;
  onSetSimulatedTime: (time: Date | null) => void;
  inWindowCount: number;
  inServiceCount: number;
  totalCount: number;
}

export const TimeBar: React.FC<TimeBarProps> = ({
  effectiveTime,
  isSimulated,
  onSetSimulatedTime,
  inWindowCount,
  inServiceCount,
  totalCount,
}) => {
  const [showControls, setShowControls] = useState(false);

  // Formatting
  const dayName = DAYS_OF_WEEK[effectiveTime.getDay()];
  const timeFormatted = effectiveTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateFormatted = effectiveTime.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  const handlePreset = (hours: number, minutes: number, dayOffset = 0) => {
    const d = new Date();
    // adjust day if needed
    if (dayOffset !== 0) {
      d.setDate(d.getDate() + dayOffset);
    }
    d.setHours(hours, minutes, 0, 0);
    onSetSimulatedTime(d);
  };

  const handleCustomDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetDayIndex = parseInt(e.target.value, 10);
    const d = new Date(effectiveTime);
    const currentDayIndex = d.getDay();
    const diff = targetDayIndex - currentDayIndex;
    d.setDate(d.getDate() + diff);
    onSetSimulatedTime(d);
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // "HH:MM"
    if (!val) return;
    const [h, m] = val.split(':').map((n) => parseInt(n, 10));
    const d = new Date(effectiveTime);
    d.setHours(h, m, 0, 0);
    onSetSimulatedTime(d);
  };

  const padZero = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const currentTimeInputVal = `${padZero(effectiveTime.getHours())}:${padZero(
    effectiveTime.getMinutes()
  )}`;

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 text-neutral-300 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Clock display & Status breakdown */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${isSimulated ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span className="font-medium text-white">
              {dayName}, {dateFormatted} ·{' '}
              <span className="font-mono text-amber-400 font-semibold text-sm">
                {timeFormatted}
              </span>
            </span>
            {isSimulated ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold uppercase tracking-wider">
                Simulated
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider">
                Live Clock
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-neutral-400 border-l border-neutral-800 pl-3">
            <span className="inline-flex items-center gap-1.5 text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-emerald-400 font-bold">{inWindowCount}</span> In Window
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5 text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="font-mono text-neutral-300">{inServiceCount}</span> In Service/Closed
            </span>
          </div>
        </div>

        {/* Right: Quick Window Presets & Simulation Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden lg:flex items-center gap-1 bg-neutral-950 p-0.5 rounded border border-neutral-800">
            <button
              onClick={() => handlePreset(10, 0)}
              className="px-2 py-1 rounded text-[11px] hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 text-neutral-300"
              title="Test Morning Prep (9:00 - 11:00 AM)"
            >
              <Coffee className="w-3 h-3 text-amber-400" />
              <span>Prep 10 AM</span>
            </button>
            <button
              onClick={() => handlePreset(12, 30)}
              className="px-2 py-1 rounded text-[11px] hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 text-neutral-300"
              title="Test Peak Lunch Rush (11:00 AM - 2:00 PM)"
            >
              <Utensils className="w-3 h-3 text-rose-400" />
              <span>Rush 12:30 PM</span>
            </button>
            <button
              onClick={() => handlePreset(14, 45)}
              className="px-2 py-1 rounded text-[11px] hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 text-neutral-300"
              title="Test Between Shifts Lull (2:00 - 4:00 PM)"
            >
              <Sun className="w-3 h-3 text-emerald-400" />
              <span>Shift Lull 2:45 PM</span>
            </button>
            <button
              onClick={() => handlePreset(16, 15)}
              className="px-2 py-1 rounded text-[11px] hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 text-neutral-300"
              title="Test Late Afternoon Window (3:30 - 5:00 PM)"
            >
              <Moon className="w-3 h-3 text-sky-400" />
              <span>Afternoon 4:15 PM</span>
            </button>
          </div>

          {isSimulated && (
            <button
              onClick={() => onSetSimulatedTime(null)}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-medium transition-colors flex items-center gap-1"
              title="Reset to your device's live current clock"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              <span>Reset to Live</span>
            </button>
          )}

          <button
            onClick={() => setShowControls(!showControls)}
            className={`px-2.5 py-1 rounded border transition-colors flex items-center gap-1 font-medium ${
              showControls
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Simulate Time</span>
          </button>
        </div>
      </div>

      {/* Expanded Custom Simulation Controls */}
      {showControls && (
        <div className="bg-neutral-950 border-t border-neutral-800 px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-neutral-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-white">Rule 1 Service Window Tester:</span>
              <span className="text-neutral-400">
                Override rep laptop time to preview restaurant access during morning prep, lunch rushes, shift lulls, or closed days.
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label className="text-neutral-400 font-medium">Day:</label>
                <select
                  value={effectiveTime.getDay()}
                  onChange={handleCustomDayChange}
                  className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  {DAYS_OF_WEEK.map((d, idx) => (
                    <option key={d} value={idx}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="text-neutral-400 font-medium">Time:</label>
                <input
                  type="time"
                  value={currentTimeInputVal}
                  onChange={handleCustomTimeChange}
                  className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePreset(10, 0)}
                  className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800"
                >
                  10:00 AM (Prep)
                </button>
                <button
                  onClick={() => handlePreset(12, 30)}
                  className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800"
                >
                  12:30 PM (Rush)
                </button>
                <button
                  onClick={() => handlePreset(15, 0)}
                  className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800"
                >
                  3:00 PM (Lull)
                </button>
                <button
                  onClick={() => handlePreset(18, 30)}
                  className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800"
                >
                  6:30 PM (Rush)
                </button>
              </div>

              <button
                onClick={() => {
                  onSetSimulatedTime(null);
                  setShowControls(false);
                }}
                className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-medium ml-auto"
              >
                Close & Use Live Clock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
