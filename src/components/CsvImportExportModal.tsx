import React, { useState } from 'react';
import { Restaurant, TodoItem, TouchpointLog } from '../types';
import { exportToCsv, generateSampleCsv, parseCsv } from '../utils/storage';
import { X, Upload, Download, RefreshCw, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CsvImportExportModalProps {
  restaurants: Restaurant[];
  logs: TouchpointLog[];
  todos: TodoItem[];
  onImport: (newRestaurants: Restaurant[]) => void;
  onResetDemo: () => void;
  onClose: () => void;
}

export const CsvImportExportModal: React.FC<CsvImportExportModalProps> = ({
  restaurants,
  logs,
  todos,
  onImport,
  onResetDemo,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'reset'>('import');
  const [csvRawText, setCsvRawText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Array<Partial<Restaurant>> | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setCsvRawText(text);
        tryParse(text);
      }
    };
    reader.readAsText(file);
  };

  const tryParse = (text: string) => {
    try {
      setParseError(null);
      const parsed = parseCsv(text);
      setParsedPreview(parsed);
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse CSV');
      setParsedPreview(null);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCsvRawText(val);
    if (val.trim()) {
      tryParse(val);
    } else {
      setParsedPreview(null);
      setParseError(null);
    }
  };

  const handleDownloadSample = () => {
    const sample = generateSampleCsv();
    const encoded = encodeURI('data:text/csv;charset=utf-8,' + sample);
    const a = document.createElement('a');
    a.href = encoded;
    a.download = 'kitchencadence_sample_import.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleConfirmImport = () => {
    if (!parsedPreview || parsedPreview.length === 0) return;
    onImport(parsedPreview as Restaurant[]);
    onClose();
  };

  const handleExport = () => {
    exportToCsv(restaurants, logs, todos);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl border border-neutral-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold">Data Management & CSV Ingestion</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-amber-600 text-amber-900 bg-white rounded-t'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Restaurant CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-amber-600 text-amber-900 bg-white rounded-t'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('reset')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'reset'
                ? 'border-rose-600 text-rose-900 bg-white rounded-t'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Demo Data Reset</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-neutral-600">
                  Upload or paste a spreadsheet list of restaurants. Supports custom windows, closed days, and historical follow-up counts.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="text-xs text-amber-700 hover:text-amber-800 font-semibold underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>

              {/* File Upload Zone */}
              <div className="p-4 border-2 border-dashed border-neutral-300 rounded-lg bg-neutral-50 hover:bg-neutral-100/50 transition-colors text-center cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
                <span className="font-semibold text-neutral-800 block">
                  {fileName ? fileName : 'Choose CSV file to upload'}
                </span>
                <span className="text-[11px] text-neutral-400">
                  Click to browse from your computer
                </span>
              </div>

              {/* Direct Paste Area */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Or paste CSV text directly:
                </label>
                <textarea
                  rows={4}
                  value={csvRawText}
                  onChange={handleTextChange}
                  placeholder={`name,cuisine,contact_name,best_window,closed_days,initial_followup_count\n"Osteria Bella","Handmade Pasta","Chef Marco","Morning Prep (9:00 - 11:00 AM)","Monday",1`}
                  className="w-full px-3 py-2 border border-neutral-300 rounded font-mono text-[11px] bg-white text-neutral-900"
                />
              </div>

              {/* Error Display */}
              {parseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedPreview && (
                <div className="space-y-2 pt-2 border-t border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Ready to Import: {parsedPreview.length} Restaurants</span>
                    </span>
                  </div>

                  <div className="border border-neutral-200 rounded max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-neutral-100 text-neutral-700 sticky top-0">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Cuisine</th>
                          <th className="p-2">Contact</th>
                          <th className="p-2">Service Window</th>
                          <th className="p-2">Closed</th>
                          <th className="p-2 text-right">Hist. Followups</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 bg-white">
                        {parsedPreview.map((item, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50">
                            <td className="p-2 font-medium text-neutral-900">{item.name}</td>
                            <td className="p-2 text-neutral-500">{item.cuisine}</td>
                            <td className="p-2 text-neutral-700">{item.contact_name}</td>
                            <td className="p-2 text-neutral-600">{item.best_window}</td>
                            <td className="p-2 text-neutral-500">
                              {item.closed_days?.length ? item.closed_days.join(', ') : 'None'}
                            </td>
                            <td className="p-2 text-right font-mono tabular-nums">
                              {item.initial_followup_count || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-neutral-600">
                Export your entire restaurant directory, live official follow-up counts, total attempts, and open tasks as a standard `.csv` spreadsheet file.
              </p>

              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between text-neutral-800">
                  <span>Total Restaurants:</span>
                  <span className="font-mono font-bold">{restaurants.length}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-800">
                  <span>Logged Interactions:</span>
                  <span className="font-mono font-bold">{logs.length}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-800">
                  <span>Pending Rep Tasks:</span>
                  <span className="font-mono font-bold">
                    {todos.filter((t) => !t.is_completed).length}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExport}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Download CSV Export Now</span>
              </button>
            </div>
          )}

          {activeTab === 'reset' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>Reset to Demo Data</span>
                </div>
                <p className="text-xs leading-relaxed">
                  This will reload the 9 realistic demo accounts (Trattoria Lucca, Ember & Oak, L'Étoile French, Masa Cantina, etc.) with pre-configured service windows, sample drops, decision-maker touchpoint logs, and explicit rep tasks.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to reset all data back to original demo values?')) {
                    onResetDemo();
                    onClose();
                  }
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Confirm Reset to Demo State</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-300 rounded"
          >
            Close
          </button>

          {activeTab === 'import' && parsedPreview && parsedPreview.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded transition-colors shadow-xs"
            >
              Confirm & Ingest {parsedPreview.length} Restaurants
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
