import React, { useState } from 'react';
import { Restaurant, TouchChannel, TouchpointLog } from '../types';
import { X, CheckCircle2, AlertCircle, Calendar, Plus, MessageSquare, Clock } from 'lucide-react';

interface LogTouchpointModalProps {
  restaurant: Restaurant;
  existingLog?: TouchpointLog | null;
  initialTaskNote?: string;
  onSaveLog: (log: Omit<TouchpointLog, 'id'>, newFollowupTask?: { task: string; dueDate: string | null }) => void;
  onUpdateLog?: (id: string, log: Omit<TouchpointLog, 'id'>) => void;
  onClose: () => void;
}

export const LogTouchpointModal: React.FC<LogTouchpointModalProps> = ({
  restaurant,
  existingLog,
  initialTaskNote,
  onSaveLog,
  onUpdateLog,
  onClose,
}) => {
  const [channel, setChannel] = useState<TouchChannel>(
    existingLog ? existingLog.channel : 'In-Person Drop-in'
  );
  const [spokeToDecisionMaker, setSpokeToDecisionMaker] = useState<boolean>(
    existingLog ? existingLog.spoke_to_decision_maker : true
  );
  const [contactPerson, setContactPerson] = useState<string>(
    existingLog
      ? existingLog.contact_person
      : `${restaurant.contact_name} (${restaurant.contact_role})`
  );
  const [notes, setNotes] = useState<string>(
    existingLog ? existingLog.notes : initialTaskNote ? `Follow-up completed: ${initialTaskNote}` : ''
  );
  const [date, setDate] = useState<string>(
    existingLog ? existingLog.date.slice(0, 16) : new Date().toISOString().slice(0, 16)
  );

  // Quick next follow-up task creation
  const [createFollowupTask, setCreateFollowupTask] = useState<boolean>(false);
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [taskDueDate, setTaskDueDate] = useState<string | null>(null);

  const channels: TouchChannel[] = [
    'In-Person Drop-in',
    'Phone Call',
    'SMS / WhatsApp',
    'Email',
  ];

  const handleDatePreset = (daysOffset: number | null) => {
    if (daysOffset === null) {
      setTaskDueDate(null);
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    setTaskDueDate(d.toISOString().slice(0, 10));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    const payload: Omit<TouchpointLog, 'id'> = {
      restaurant_id: restaurant.id,
      date: new Date(date).toISOString(),
      channel,
      spoke_to_decision_maker: spokeToDecisionMaker,
      contact_person: contactPerson.trim() || 'Kitchen Staff',
      notes: notes.trim(),
    };

    if (existingLog && onUpdateLog) {
      onUpdateLog(existingLog.id, payload);
    } else {
      const followUpTask = createFollowupTask && taskDescription.trim()
        ? { task: taskDescription.trim(), dueDate: taskDueDate }
        : undefined;
      onSaveLog(payload, followUpTask);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl border border-neutral-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>{existingLog ? 'Edit Touchpoint Log' : 'Record Touchpoint / Visit'}</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Account: <span className="text-white font-medium">{restaurant.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Rule 2: Ironclad Decision-Maker Toggle Banner */}
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-900 block">
                  Rule 2: Spoke to Decision-Maker?
                </label>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Does this interaction count as an official follow-up?
                </p>
              </div>

              {/* Segmented Toggle Control */}
              <div className="flex items-center bg-neutral-200 p-0.5 rounded-md shrink-0">
                <button
                  type="button"
                  onClick={() => setSpokeToDecisionMaker(true)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                    spokeToDecisionMaker
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>YES (+1 Follow-up)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSpokeToDecisionMaker(false)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                    !spokeToDecisionMaker
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>NO (Attempt Only)</span>
                </button>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-neutral-200 text-[11px] text-neutral-600">
              {spokeToDecisionMaker ? (
                <span className="text-emerald-700 font-medium">
                  ✓ Verified: Spoke with Chef, Owner, or Buyer. Will increment your official Follow-Up count.
                </span>
              ) : (
                <span className="text-amber-800 font-medium">
                  ⚠ Gatekeeper / Drop-in only: Spoke to hostess, left card, or missed call. Increments Total Attempts without inflating official follow-ups.
                </span>
              )}
            </div>
          </div>

          {/* Channel Selector */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1.5">
              Contact Channel <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {channels.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  className={`px-2.5 py-2 rounded text-xs font-medium border text-center transition-colors ${
                    channel === c
                      ? 'border-amber-600 bg-amber-50 text-amber-900 font-semibold'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Person & Timestamp Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Person Spoken With
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Marco Bellini (Executive Chef)"
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-neutral-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-neutral-900 font-mono text-xs"
              />
            </div>
          </div>

          {/* Detailed Interaction Notes */}
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              Visit / Conversation Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Tasted the Parmigiano sample during morning prep. Chef loved the finish, asked for volume tier quote for 2 wheels/mo. Next check-in on flour samples."
              className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-neutral-900 text-xs leading-relaxed"
            />
          </div>

          {/* Rule 3 Option: Add Next Follow-Up Task Immediately */}
          {!existingLog && (
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-neutral-900">
                <input
                  type="checkbox"
                  checked={createFollowupTask}
                  onChange={(e) => setCreateFollowupTask(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Also create a rep-owned follow-up task for this kitchen</span>
              </label>

              {createFollowupTask && (
                <div className="space-y-2 pt-2 border-t border-neutral-200">
                  <input
                    type="text"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="e.g. Bring spec sheet for 00 Flour & quote for 2 Parmigiano wheels"
                    className="w-full px-3 py-1.5 border border-neutral-300 rounded bg-white text-neutral-900 text-xs"
                  />

                  <div>
                    <span className="block text-[11px] text-neutral-500 mb-1 font-medium">
                      Fast Date Preset (Rule 3 Explicit Dates):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => handleDatePreset(0)}
                        className={`px-2 py-0.5 rounded text-[11px] border ${
                          taskDueDate === new Date().toISOString().slice(0, 10)
                            ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                            : 'bg-white text-neutral-700 border-neutral-300'
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
                          taskDueDate === null
                            ? 'bg-neutral-800 text-white border-neutral-800'
                            : 'bg-white text-neutral-700 border-neutral-300'
                        }`}
                      >
                        [Needs Date]
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200">
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
              {existingLog ? 'Update Touchpoint' : 'Save Touchpoint Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
