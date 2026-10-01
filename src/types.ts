export type ServiceWindow = 
  | 'Morning Prep (9:00 - 11:00 AM)'
  | 'Between Shifts (2:00 - 4:00 PM)'
  | 'Late Afternoon (3:30 - 5:00 PM)'
  | 'Custom';

export type PipelineStatus = 
  | 'New Lead'
  | 'Sample Dropped'
  | 'Follow-up Due'
  | 'Tasting / Meeting'
  | 'Active Customer'
  | 'Archived / Passed';

export type TouchChannel = 'In-Person Drop-in' | 'Phone Call' | 'SMS / WhatsApp' | 'Email';

export interface TouchpointLog {
  id: string;
  restaurant_id: string;
  date: string; // ISO String
  channel: TouchChannel;
  spoke_to_decision_maker: boolean; // Rule 2: Controls whether this counts as an official follow-up
  contact_person: string; // e.g. "Chef Marco", "Sous Chef", "Hostess"
  notes: string;
}

export interface TodoItem {
  id: string;
  restaurant_id: string;
  task: string; // e.g. "Drop off 5lb sample of Truffle Butter"
  owner: 'Me' | 'Restaurant'; // Rule 3: Defaults to 'Me'
  due_date: string | null; // YYYY-MM-DD or null
  is_completed: boolean;
  created_at: string;
}

export type ContactRole = 
  | 'Executive Chef' 
  | 'Owner / Operator' 
  | 'General Manager' 
  | 'Kitchen Manager' 
  | 'Bar Manager' 
  | 'Other';

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string; // e.g., "Artisan Pizza", "French Bistro", "Farm-to-Table"
  address: string;
  contact_name: string;
  contact_role: ContactRole;
  phone: string;
  email: string;
  best_window: ServiceWindow;
  custom_window_start?: string; // e.g. "14:30" (24h format)
  custom_window_end?: string;   // e.g. "16:00"
  closed_days: string[]; // e.g., ["Monday", "Tuesday"]
  status: PipelineStatus;
  initial_followup_count: number; // Historical count from CSV imports
  created_at: string;
  notes?: string;
  samples_dropped?: string[]; // e.g. ["Wagyu A5 Chuck", "Truffle Olive Oil"]
}

export type WindowStatusType = 'in_window' | 'in_service_or_closed' | 'not_set';

export interface WindowEvaluation {
  status: WindowStatusType;
  label: string;
  reason: string;
  isClosedToday: boolean;
  windowDescription: string;
}
