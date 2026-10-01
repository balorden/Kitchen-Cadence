import React, { useState } from 'react';
import { ContactRole, PipelineStatus, Restaurant, ServiceWindow } from '../types';
import { DAYS_OF_WEEK } from '../utils/timeWindow';
import { X, Building2, Clock, Calendar, CheckSquare } from 'lucide-react';

interface AddEditRestaurantModalProps {
  restaurant?: Restaurant | null;
  onSave: (restaurant: Restaurant) => void;
  onClose: () => void;
}

export const AddEditRestaurantModal: React.FC<AddEditRestaurantModalProps> = ({
  restaurant,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(restaurant ? restaurant.name : '');
  const [cuisine, setCuisine] = useState(restaurant ? restaurant.cuisine : '');
  const [address, setAddress] = useState(restaurant ? restaurant.address : '');
  const [contactName, setContactName] = useState(restaurant ? restaurant.contact_name : '');
  const [contactRole, setContactRole] = useState<ContactRole>(
    restaurant ? restaurant.contact_role : 'Executive Chef'
  );
  const [phone, setPhone] = useState(restaurant ? restaurant.phone : '');
  const [email, setEmail] = useState(restaurant ? restaurant.email : '');
  
  // Rule 1: Service Window presets
  const [bestWindow, setBestWindow] = useState<ServiceWindow>(
    restaurant ? restaurant.best_window : 'Morning Prep (9:00 - 11:00 AM)'
  );
  const [customStart, setCustomStart] = useState(
    restaurant?.custom_window_start || '10:00'
  );
  const [customEnd, setCustomEnd] = useState(
    restaurant?.custom_window_end || '12:00'
  );

  // Closed days multi-select
  const [closedDays, setClosedDays] = useState<string[]>(
    restaurant ? restaurant.closed_days || [] : []
  );

  // Pipeline Status
  const [status, setStatus] = useState<PipelineStatus>(
    restaurant ? restaurant.status : 'New Lead'
  );

  // Initial Historical Follow-up Count (Rule 2 historical baseline)
  const [initialFollowupCount, setInitialFollowupCount] = useState<number>(
    restaurant ? restaurant.initial_followup_count || 0 : 0
  );

  const [notes, setNotes] = useState(restaurant?.notes || '');
  const [samplesText, setSamplesText] = useState(
    (restaurant?.samples_dropped || []).join(', ')
  );

  const toggleClosedDay = (day: string) => {
    if (closedDays.includes(day)) {
      setClosedDays(closedDays.filter((d) => d !== day));
    } else {
      setClosedDays([...closedDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const samples = samplesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const savedRecord: Restaurant = {
      id: restaurant ? restaurant.id : `rest-${Date.now()}`,
      name: name.trim(),
      cuisine: cuisine.trim() || 'Restaurant',
      address: address.trim(),
      contact_name: contactName.trim() || 'Kitchen Lead',
      contact_role: contactRole,
      phone: phone.trim(),
      email: email.trim(),
      best_window: bestWindow,
      custom_window_start: bestWindow === 'Custom' ? customStart : undefined,
      custom_window_end: bestWindow === 'Custom' ? customEnd : undefined,
      closed_days: closedDays,
      status,
      initial_followup_count: Math.max(0, initialFollowupCount),
      created_at: restaurant ? restaurant.created_at : new Date().toISOString(),
      notes: notes.trim(),
      samples_dropped: samples,
    };

    onSave(savedRecord);
    onClose();
  };

  const contactRoles: ContactRole[] = [
    'Executive Chef',
    'Owner / Operator',
    'General Manager',
    'Kitchen Manager',
    'Bar Manager',
    'Other',
  ];

  const pipelineStatuses: PipelineStatus[] = [
    'New Lead',
    'Sample Dropped',
    'Follow-up Due',
    'Tasting / Meeting',
    'Active Customer',
    'Archived / Passed',
  ];

  const windowPresets: ServiceWindow[] = [
    'Morning Prep (9:00 - 11:00 AM)',
    'Between Shifts (2:00 - 4:00 PM)',
    'Late Afternoon (3:30 - 5:00 PM)',
    'Custom',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl border border-neutral-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">
              {restaurant ? `Edit ${restaurant.name}` : 'Add New Restaurant Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Section 1: Core Kitchen Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Restaurant Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Trattoria Lucca"
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-neutral-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Cuisine / Concept
              </label>
              <input
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="e.g. Northern Italian & Handmade Pasta"
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Physical Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 412 Bell Street, Suite A, Downtown"
              className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-neutral-900"
            />
          </div>

          {/* Section 2: Contact & Key Decision-Maker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-200">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Contact Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Marco Bellini"
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-neutral-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Role / Title
              </label>
              <select
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value as ContactRole)}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-neutral-900 bg-white"
              >
                {contactRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. (555) 234-8910"
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-neutral-900"
              />
            </div>
          </div>

          {/* Section 3: Rule 1 - Explicit Service Window Rule */}
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <label className="font-bold text-neutral-900 text-xs">
                Rule 1: Explicit Service Window Presets
              </label>
            </div>
            <p className="text-[11px] text-neutral-500">
              Never guess contact timing. Pick the kitchen's exact prep or shift lull window so you never interrupt dinner or lunch rushes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {windowPresets.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setBestWindow(w)}
                  className={`p-2 rounded text-left border transition-colors ${
                    bestWindow === w
                      ? 'border-amber-600 bg-amber-50 text-neutral-900 font-semibold'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{w}</span>
                    {bestWindow === w && (
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Window Times */}
            {bestWindow === 'Custom' && (
              <div className="pt-2 flex items-center gap-3 bg-white p-2.5 rounded border border-neutral-200">
                <span className="text-neutral-600 font-medium">Custom Window Hours:</span>
                <input
                  type="time"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2 py-1 border border-neutral-300 rounded font-mono text-xs"
                />
                <span className="text-neutral-400">to</span>
                <input
                  type="time"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2 py-1 border border-neutral-300 rounded font-mono text-xs"
                />
              </div>
            )}

            {/* Closed Days Multi-Select */}
            <div className="pt-2 border-t border-neutral-200">
              <label className="block font-semibold text-neutral-800 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>Closed Days (Restaurant will show as Closed on these days):</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const isClosed = closedDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleClosedDay(d)}
                      className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                        isClosed
                          ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {d.slice(0, 3)} {isClosed ? '✕' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Pipeline Status & Initial Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Sales Pipeline Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PipelineStatus)}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-neutral-900 bg-white"
              >
                {pipelineStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Historical Follow-up Count (Rule 2)
              </label>
              <input
                type="number"
                min="0"
                value={initialFollowupCount}
                onChange={(e) => setInitialFollowupCount(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-neutral-900 font-mono"
              />
              <span className="text-[10px] text-neutral-500 mt-0.5 block">
                Preserves prior CRM/CSV history before logging touches in this app.
              </span>
            </div>
          </div>

          {/* Samples Dropped & General Notes */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Samples Dropped (comma-separated)
            </label>
            <input
              type="text"
              value={samplesText}
              onChange={(e) => setSamplesText(e.target.value)}
              placeholder="e.g. 24-Month Parmigiano-Reggiano, Tipo 00 Flour, Black Truffle Glaze"
              className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-neutral-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Account Strategy & Kitchen Preferences
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key notes: Chef takes deliveries at back alley dock, strict on grass-fed certifications, avoids calls during prep lineup..."
              className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-neutral-900 text-xs"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-300 rounded hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded transition-colors shadow-xs"
            >
              {restaurant ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
