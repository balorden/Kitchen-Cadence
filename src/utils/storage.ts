import { Restaurant, TodoItem, TouchpointLog, ServiceWindow, PipelineStatus, ContactRole } from '../types';
import { INITIAL_LOGS, INITIAL_RESTAURANTS, INITIAL_TODOS } from './demoData';

const STORAGE_KEYS = {
  RESTAURANTS: 'kitchencadence_restaurants_v1',
  LOGS: 'kitchencadence_logs_v1',
  TODOS: 'kitchencadence_todos_v1',
};

export function loadRestaurants(): Restaurant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESTAURANTS);
    if (!raw) {
      saveRestaurants(INITIAL_RESTAURANTS);
      return INITIAL_RESTAURANTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load restaurants from localStorage:', err);
    return INITIAL_RESTAURANTS;
  }
}

export function saveRestaurants(data: Restaurant[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RESTAURANTS, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save restaurants to localStorage:', err);
  }
}

export function loadLogs(): TouchpointLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      saveLogs(INITIAL_LOGS);
      return INITIAL_LOGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load logs from localStorage:', err);
    return INITIAL_LOGS;
  }
}

export function saveLogs(data: TouchpointLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save logs to localStorage:', err);
  }
}

export function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TODOS);
    if (!raw) {
      saveTodos(INITIAL_TODOS);
      return INITIAL_TODOS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load todos from localStorage:', err);
    return INITIAL_TODOS;
  }
}

export function saveTodos(data: TodoItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save todos to localStorage:', err);
  }
}

export function resetToDemoData(): {
  restaurants: Restaurant[];
  logs: TouchpointLog[];
  todos: TodoItem[];
} {
  saveRestaurants(INITIAL_RESTAURANTS);
  saveLogs(INITIAL_LOGS);
  saveTodos(INITIAL_TODOS);
  return {
    restaurants: INITIAL_RESTAURANTS,
    logs: INITIAL_LOGS,
    todos: INITIAL_TODOS,
  };
}

/**
 * Rule 2: The Decision-Maker Contact Dynamic Counter Rule
 * followup_count = count(logs where spoke_to_decision_maker === true) + (restaurant.initial_followup_count || 0)
 */
export function computeFollowupCount(restaurant: Restaurant, logs: TouchpointLog[]): number {
  const matchingLogs = logs.filter(
    (l) => l.restaurant_id === restaurant.id && l.spoke_to_decision_maker === true
  );
  return matchingLogs.length + (restaurant.initial_followup_count || 0);
}

/**
 * Total attempts/visits
 * total_attempts = logs.length + (restaurant.initial_followup_count || 0)
 */
export function computeTotalAttempts(restaurant: Restaurant, logs: TouchpointLog[]): number {
  const restaurantLogs = logs.filter((l) => l.restaurant_id === restaurant.id);
  return restaurantLogs.length + (restaurant.initial_followup_count || 0);
}

/**
 * CSV Export
 */
export function exportToCsv(
  restaurants: Restaurant[],
  logs: TouchpointLog[],
  todos: TodoItem[]
): void {
  const headers = [
    'Name',
    'Cuisine',
    'Address',
    'Contact Name',
    'Contact Role',
    'Phone',
    'Email',
    'Best Window',
    'Custom Window Start',
    'Custom Window End',
    'Closed Days',
    'Pipeline Status',
    'Historical Follow-up Count',
    'Official Follow-up Count (Live)',
    'Total Attempts (Live)',
    'Open Tasks Count',
    'Notes',
  ];

  const rows = restaurants.map((r) => {
    const followupCount = computeFollowupCount(r, logs);
    const totalAttempts = computeTotalAttempts(r, logs);
    const openTasks = todos.filter((t) => t.restaurant_id === r.id && !t.is_completed).length;

    return [
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.cuisine || '').replace(/"/g, '""')}"`,
      `"${(r.address || '').replace(/"/g, '""')}"`,
      `"${(r.contact_name || '').replace(/"/g, '""')}"`,
      `"${(r.contact_role || '').replace(/"/g, '""')}"`,
      `"${(r.phone || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${(r.best_window || '').replace(/"/g, '""')}"`,
      `"${(r.custom_window_start || '').replace(/"/g, '""')}"`,
      `"${(r.custom_window_end || '').replace(/"/g, '""')}"`,
      `"${(r.closed_days || []).join('; ')}"`,
      `"${(r.status || '').replace(/"/g, '""')}"`,
      r.initial_followup_count ?? 0,
      followupCount,
      totalAttempts,
      openTasks,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `kitchencadence_export_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Sample CSV template for user download
 */
export function generateSampleCsv(): string {
  const headers = [
    'name',
    'cuisine',
    'address',
    'contact_name',
    'contact_role',
    'phone',
    'email',
    'best_window',
    'closed_days',
    'status',
    'initial_followup_count',
    'notes',
  ];

  const sampleRows = [
    [
      '"Osteria Bella"',
      '"Handmade Pasta & Woodfired"',
      '"104 Market Street"',
      '"Chef Giancarlo"',
      '"Executive Chef"',
      '"(555) 302-1144"',
      '"giancarlo@osteriabella.com"',
      '"Morning Prep (9:00 - 11:00 AM)"',
      '"Monday; Tuesday"',
      '"Sample Dropped"',
      '1',
      '"Needs samples of cold-pressed EVOO and San Marzano DOP tomatoes."',
    ].join(','),
    [
      '"Prime Cut Steakhouse"',
      '"Dry-Aged Steaks & Chops"',
      '"720 Executive Drive"',
      '"Marcus Vance"',
      '"General Manager"',
      '"(555) 441-9988"',
      '"marcus@primecut.com"',
      '"Between Shifts (2:00 - 4:00 PM)"',
      '""',
      '"New Lead"',
      '0',
      '"Looking for alternative Wagyu ribeye purveyor."',
    ].join(','),
  ];

  return [headers.join(','), ...sampleRows].join('\n');
}

/**
 * Robust CSV parser that handles quotes and multiple formats
 */
export function parseCsv(csvText: string): Array<Partial<Restaurant>> {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' && nextChar === '\n') || char === '\n') {
      if (inQuotes) {
        currentLine += ' ';
      } else {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = '';
        if (char === '\r') i++;
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());

  if (lines.length < 2) {
    throw new Error('CSV must contain at least a header row and one data row.');
  }

  // Parse header
  const parseRow = (line: string): string[] => {
    const tokens: string[] = [];
    let token = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const nc = line[i + 1];
      if (c === '"') {
        if (insideQuotes && nc === '"') {
          token += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (c === ',' && !insideQuotes) {
        tokens.push(token.trim());
        token = '';
      } else {
        token += c;
      }
    }
    tokens.push(token.trim());
    return tokens;
  };

  const rawHeaders = parseRow(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9_]/g, '')
  );

  const parsedResults: Array<Partial<Restaurant>> = [];

  for (let r = 1; r < lines.length; r++) {
    const values = parseRow(lines[r]);
    if (values.length === 0 || (values.length === 1 && !values[0])) continue;

    const rowObj: Record<string, string> = {};
    rawHeaders.forEach((h, idx) => {
      rowObj[h] = values[idx] || '';
    });

    const name = rowObj['name'] || rowObj['restaurantname'] || values[0] || 'Unnamed Restaurant';
    const cuisine = rowObj['cuisine'] || rowObj['type'] || 'American Contemporary';
    const address = rowObj['address'] || rowObj['street'] || '';
    const contactName = rowObj['contactname'] || rowObj['contact'] || rowObj['chef'] || '';
    
    // Contact role normalization
    let contactRole: ContactRole = 'Executive Chef';
    const rawRole = (rowObj['contactrole'] || rowObj['role'] || '').toLowerCase();
    if (rawRole.includes('owner') || rawRole.includes('operator')) contactRole = 'Owner / Operator';
    else if (rawRole.includes('general') || rawRole.includes('gm')) contactRole = 'General Manager';
    else if (rawRole.includes('kitchen')) contactRole = 'Kitchen Manager';
    else if (rawRole.includes('bar')) contactRole = 'Bar Manager';
    else if (rawRole.includes('other')) contactRole = 'Other';

    // Best window normalization
    let bestWindow: ServiceWindow = 'Between Shifts (2:00 - 4:00 PM)';
    const rawWindow = (rowObj['bestwindow'] || rowObj['window'] || '').toLowerCase();
    if (rawWindow.includes('morning') || rawWindow.includes('prep') || rawWindow.includes('9:00') || rawWindow.includes('9')) {
      bestWindow = 'Morning Prep (9:00 - 11:00 AM)';
    } else if (rawWindow.includes('late') || rawWindow.includes('3:30') || rawWindow.includes('afternoon')) {
      bestWindow = 'Late Afternoon (3:30 - 5:00 PM)';
    } else if (rawWindow.includes('custom')) {
      bestWindow = 'Custom';
    }

    // Closed days normalization (supports comma, semicolon, or slash separation)
    const rawClosed = rowObj['closeddays'] || rowObj['closed'] || '';
    const closedDays = rawClosed
      ? rawClosed
          .split(/[,;/]/)
          .map((d) => d.trim())
          .filter(Boolean)
          .map((d) => {
            const lower = d.toLowerCase();
            if (lower.startsWith('mon')) return 'Monday';
            if (lower.startsWith('tue')) return 'Tuesday';
            if (lower.startsWith('wed')) return 'Wednesday';
            if (lower.startsWith('thu')) return 'Thursday';
            if (lower.startsWith('fri')) return 'Friday';
            if (lower.startsWith('sat')) return 'Saturday';
            if (lower.startsWith('sun')) return 'Sunday';
            return d;
          })
      : [];

    // Pipeline status normalization
    let status: PipelineStatus = 'New Lead';
    const rawStatus = (rowObj['status'] || rowObj['pipelinestatus'] || '').toLowerCase();
    if (rawStatus.includes('sample')) status = 'Sample Dropped';
    else if (rawStatus.includes('follow') || rawStatus.includes('due')) status = 'Follow-up Due';
    else if (rawStatus.includes('tasting') || rawStatus.includes('meeting')) status = 'Tasting / Meeting';
    else if (rawStatus.includes('active') || rawStatus.includes('customer')) status = 'Active Customer';
    else if (rawStatus.includes('archive') || rawStatus.includes('pass') || rawStatus.includes('lost')) status = 'Archived / Passed';

    const initialFollowups = parseInt(rowObj['initialfollowupcount'] || rowObj['followupcount'] || rowObj['historicalcount'] || '0', 10) || 0;

    parsedResults.push({
      id: `rest-import-${Date.now()}-${r}`,
      name,
      cuisine,
      address,
      contact_name: contactName,
      contact_role: contactRole,
      phone: rowObj['phone'] || '',
      email: rowObj['email'] || '',
      best_window: bestWindow,
      custom_window_start: rowObj['customwindowstart'] || undefined,
      custom_window_end: rowObj['customwindowend'] || undefined,
      closed_days: closedDays,
      status,
      initial_followup_count: initialFollowups,
      created_at: new Date().toISOString(),
      notes: rowObj['notes'] || '',
      samples_dropped: [],
    });
  }

  return parsedResults;
}
