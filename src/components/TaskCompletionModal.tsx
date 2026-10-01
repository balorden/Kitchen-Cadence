import React from 'react';
import { Restaurant, TodoItem } from '../types';
import { CheckCircle2, MessageSquare, ArrowRight, X } from 'lucide-react';

interface TaskCompletionModalProps {
  task: TodoItem;
  restaurant: Restaurant;
  onLogAsFollowup: (task: TodoItem, restaurant: Restaurant) => void;
  onJustComplete: (task: TodoItem) => void;
  onCancel: () => void;
}

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
  task,
  restaurant,
  onLogAsFollowup,
  onJustComplete,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-xl border border-neutral-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold">Rule 3 Workflow Hook</span>
          </div>
          <button
            onClick={onCancel}
            className="text-neutral-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-xs text-neutral-700 space-y-4">
          <div>
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
              Completed Task:
            </span>
            <p className="text-sm font-semibold text-neutral-900 mt-1">
              "{task.task}"
            </p>
            <p className="text-neutral-500 mt-1">
              Account: <span className="font-medium text-neutral-800">{restaurant.name}</span>
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
            <p className="font-semibold text-xs mb-1">Did this involve a touchpoint with the kitchen?</p>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              If you spoke with the chef, dropped samples, or called, log it now so your verified follow-up and attempt counts stay 100% synchronized.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onLogAsFollowup(task, restaurant)}
              className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Log as Follow-Up</span>
            </button>

            <button
              onClick={() => onJustComplete(task)}
              className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-medium text-xs rounded transition-colors"
            >
              Just Mark Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
