import React, { useState } from 'react';
import { Button } from './ui/button';
import { Cpu } from 'lucide-react';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, type: string) => void;
  isLoading: boolean;
}

export function CreateJobModal({ isOpen, onClose, onSubmit, isLoading }: CreateJobModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Build');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title, type);
    setTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm transition-all">
      <div className="w-full max-w-md scale-100 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-indigo-500/10">
        <div className="border-b border-slate-800 bg-slate-800/50 px-6 py-4 flex items-center gap-3">
            <Cpu className="text-indigo-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Initialize New Task</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Task Identifier</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="e.g. Data Pipeline Sync"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Operation Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
              >
                <option value="Build">Build</option>
                <option value="Deploy">Deploy</option>
                <option value="Data Sync">Data Sync</option>
                <option value="Report Generation">Report Generation</option>
                <option value="Cleanup">Cleanup</option>
              </select>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()} className="min-w-[120px]">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                  Initializing...
                </div>
              ) : 'Execute Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
