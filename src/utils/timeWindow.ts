import { Restaurant, ServiceWindow, WindowEvaluation } from '../types';

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export interface WindowRange {
  startMinutes: number; // minutes from midnight
  endMinutes: number;
}

export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

export function getWindowRange(
  window: ServiceWindow,
  customStart?: string,
  customEnd?: string
): WindowRange | null {
  switch (window) {
    case 'Morning Prep (9:00 - 11:00 AM)':
      return { startMinutes: 9 * 60, endMinutes: 11 * 60 }; // 09:00 - 11:00
    case 'Between Shifts (2:00 - 4:00 PM)':
      return { startMinutes: 14 * 60, endMinutes: 16 * 60 }; // 14:00 - 16:00
    case 'Late Afternoon (3:30 - 5:00 PM)':
      return { startMinutes: 15 * 60 + 30, endMinutes: 17 * 60 }; // 15:30 - 17:00
    case 'Custom':
      if (customStart && customEnd) {
        const start = parseTimeToMinutes(customStart);
        const end = parseTimeToMinutes(customEnd);
        if (start !== null && end !== null && end > start) {
          return { startMinutes: start, endMinutes: end };
        }
      }
      return null;
    default:
      return null;
  }
}

export function formatTimeFromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${ampm}`;
}

export function formatWindowLabel(restaurant: Restaurant): string {
  if (restaurant.best_window === 'Custom') {
    if (restaurant.custom_window_start && restaurant.custom_window_end) {
      const s = parseTimeToMinutes(restaurant.custom_window_start);
      const e = parseTimeToMinutes(restaurant.custom_window_end);
      if (s !== null && e !== null) {
        return `Custom (${formatTimeFromMinutes(s)} – ${formatTimeFromMinutes(e)})`;
      }
    }
    return 'Custom (Unset)';
  }
  return restaurant.best_window;
}

/**
 * Evaluates whether a restaurant is currently In Window, In Service/Closed, or Not Set.
 * Rule 1: Never guess contact timing using a generic global clock.
 */
export function evaluateServiceWindow(
  restaurant: Restaurant,
  currentTime: Date
): WindowEvaluation {
  if (!restaurant.best_window) {
    return {
      status: 'not_set',
      label: 'Window Not Set',
      reason: 'No window specified for this kitchen',
      isClosedToday: false,
      windowDescription: 'Window Not Set',
    };
  }

  const dayName = DAYS_OF_WEEK[currentTime.getDay()];
  const isClosedToday = (restaurant.closed_days || []).some(
    (d) => d.trim().toLowerCase() === dayName.toLowerCase()
  );

  const windowRange = getWindowRange(
    restaurant.best_window,
    restaurant.custom_window_start,
    restaurant.custom_window_end
  );

  const windowDesc = formatWindowLabel(restaurant);

  if (isClosedToday) {
    return {
      status: 'in_service_or_closed',
      label: 'In Service / Closed',
      reason: `Closed on ${dayName}s`,
      isClosedToday: true,
      windowDescription: windowDesc,
    };
  }

  if (!windowRange) {
    return {
      status: 'not_set',
      label: 'Window Not Set',
      reason: 'Custom window requires valid start and end times',
      isClosedToday: false,
      windowDescription: 'Custom Window Incomplete',
    };
  }

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  if (currentMinutes >= windowRange.startMinutes && currentMinutes <= windowRange.endMinutes) {
    const minutesLeft = windowRange.endMinutes - currentMinutes;
    return {
      status: 'in_window',
      label: 'In Window',
      reason: `Window open (${minutesLeft}m remaining)`,
      isClosedToday: false,
      windowDescription: windowDesc,
    };
  }

  // Outside window
  let outsideDetail = 'Rush / Closed for Service';
  if (currentMinutes < windowRange.startMinutes) {
    const minsUntil = windowRange.startMinutes - currentMinutes;
    const hours = Math.floor(minsUntil / 60);
    const mins = minsUntil % 60;
    const timeText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    outsideDetail = `Opens in ${timeText} (${formatTimeFromMinutes(windowRange.startMinutes)})`;
  } else {
    // Current time is after window
    if (currentMinutes >= 11 * 60 && currentMinutes < 14 * 60) {
      outsideDetail = 'Peak Lunch Rush (11am-2pm)';
    } else if (currentMinutes >= 17 * 60 && currentMinutes < 22 * 60) {
      outsideDetail = 'Peak Dinner Service (5pm-10pm)';
    } else {
      outsideDetail = `Window closed at ${formatTimeFromMinutes(windowRange.endMinutes)}`;
    }
  }

  return {
    status: 'in_service_or_closed',
    label: 'In Service / Closed',
    reason: outsideDetail,
    isClosedToday: false,
    windowDescription: windowDesc,
  };
}
