import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, CheckCircle, XCircle, Trash2, Plus, Clock, AlertCircle, Activity, Database } from 'lucide-react';
import { api } from '../lib/api';
import type { Job } from '../lib/api';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CreateJobModal } from './CreateJobModal';

export function JobDashboard() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | Job['status']>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: jobs = [], isLoading, isError } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs');
      return res.data;
    },
  });

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const eventSource = new EventSource(`${API_URL}/jobs/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const updatedJob: Job = JSON.parse(event.data);
        queryClient.setQueryData<Job[]>(['jobs'], (oldJobs) => {
          if (!oldJobs) return [updatedJob];
          const exists = oldJobs.find(j => j.id === updatedJob.id);
          if (exists) {
            return oldJobs.map(j => j.id === updatedJob.id ? updatedJob : j);
          } else {
            return [updatedJob, ...oldJobs];
          }
        });
      } catch (e) {
        console.error("Failed to parse SSE data", e);
      }
    };

    return () => eventSource.close();
  }, [queryClient]);

  const createJob = useMutation({
    mutationFn: async (newJob: { title: string; type: string }) => {
      const res = await api.post('/jobs', newJob);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setIsModalOpen(false);
    },
    onError: () => setErrorMsg('Failed to create job')
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Job['status'] }) => {
      const res = await api.patch(`/jobs/${id}/status`, { status });
      return res.data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      const previousJobs = queryClient.getQueryData<Job[]>(['jobs']);
      queryClient.setQueryData<Job[]>(['jobs'], old => 
        old?.map(job => job.id === id ? { ...job, status } : job)
      );
      return { previousJobs };
    },
    onError: (err: any, _newJob, context) => {
      queryClient.setQueryData(['jobs'], context?.previousJobs);
      if (err.response?.status === 409) {
        setErrorMsg('Conflict: Job status was modified by another user.');
      } else if (err.response?.status === 400) {
        setErrorMsg(err.response.data.message || 'Invalid state transition.');
      } else {
        setErrorMsg('Failed to update job status.');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }
  });

  const deleteJob = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: () => setErrorMsg('Failed to delete job')
  });

  const filteredJobs = jobs.filter(job => filter === 'all' || job.status === filter);
  const counts = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    running: jobs.filter(j => j.status === 'running').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <div className="text-lg font-medium text-slate-400">Initializing Core Systems...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-rose-500/20 bg-slate-900/50 p-8 text-center shadow-2xl backdrop-blur-xl">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-500" />
          <h2 className="mb-2 text-xl font-bold text-white">Connection Failed</h2>
          <p className="text-slate-400">Unable to establish connection with the backend server. Please ensure the API is running on localhost:3000.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'All Operations', count: counts.total, filterVal: 'all', icon: Database, color: 'text-indigo-400', bg: 'from-indigo-500/20 to-indigo-500/5', border: 'border-indigo-500/20' },
    { label: 'Pending', count: counts.pending, filterVal: 'pending', icon: Clock, color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/20' },
    { label: 'Active', count: counts.running, filterVal: 'running', icon: Activity, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20' },
    { label: 'Successful', count: counts.completed, filterVal: 'completed', icon: CheckCircle, color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20' },
    { label: 'Failed', count: counts.failed, filterVal: 'failed', icon: XCircle, color: 'text-rose-400', bg: 'from-rose-500/20 to-rose-500/5', border: 'border-rose-500/20' },
  ];

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-indigo-500/30">
              <img src="/logo.png" alt="Airth Logo" className="h-full w-full object-cover scale-[1.3]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">System Console</h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Connected via SSE Stream
              </p>
            </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 px-6">
            <Plus size={18} /> Deploy Job
          </Button>
        </header>

        {errorMsg && (
          <div className="mb-8 flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-200 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-rose-400" />
              <span className="font-medium">{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="rounded-lg p-1 transition-colors hover:bg-rose-500/20 hover:text-white">
              <XCircle size={20} />
            </button>
          </div>
        )}

        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-5">
          {statCards.map((stat) => {
            const isActive = filter === stat.filterVal;
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                onClick={() => setFilter(stat.filterVal as any)}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  isActive 
                    ? `bg-slate-800 ${stat.border} shadow-[0_0_20px_rgba(0,0,0,0.3)] ring-1 ring-white/10` 
                    : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${isActive ? 'opacity-100' : ''} ${stat.bg}`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-6 w-6 ${stat.color} opacity-80`} />
                    <span className="text-3xl font-bold text-white">{stat.count}</span>
                  </div>
                  <div className="mt-4 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-4 mt-8 px-2">
          <h2 className="text-xl font-bold text-white">Recent Executions</h2>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-400">Filter by Status:</label>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="appearance-none rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 pr-8 text-sm font-medium text-white shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:bg-slate-700"
              >
                <option value="all">All Jobs</option>
                <option value="pending">Pending</option>
                <option value="running">Active (Running)</option>
                <option value="completed">Successful</option>
                <option value="failed">Failed</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-[500px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
          {filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-500">
              <Database className="mb-4 h-12 w-12 opacity-20" />
              <p className="text-lg font-medium">No tasks found matching current filters.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-800/50">
              {filteredJobs.map((job) => (
                <li key={job.id} className="group flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-slate-800/50 sm:flex-row sm:items-center sm:p-6">
                  <div className="flex items-start gap-5">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 shadow-inner">
                      {job.status === 'pending' && <Clock className="text-amber-400" size={18} />}
                      {job.status === 'running' && <Activity className="animate-pulse text-blue-400" size={18} />}
                      {job.status === 'completed' && <CheckCircle className="text-emerald-400" size={18} />}
                      {job.status === 'failed' && <XCircle className="text-rose-400" size={18} />}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100 group-hover:text-white">{job.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium border border-slate-700/50">
                          {job.type}
                        </span>
                        <span className="opacity-50">•</span>
                        <span className="font-mono text-xs">{new Date(job.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
                    <Badge variant={job.status}>{job.status}</Badge>
                    
                    <div className="flex items-center gap-2 border-l border-slate-700/50 pl-4">
                      {job.status === 'pending' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: job.id, status: 'running' })} className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300">
                          <Play size={14} className="mr-1" /> Execute
                        </Button>
                      )}
                      {job.status === 'running' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: job.id, status: 'completed' })} className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
                            <CheckCircle size={14} className="mr-1" /> Resolve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: job.id, status: 'failed' })} className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300">
                            <XCircle size={14} className="mr-1" /> Abort
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => deleteJob.mutate(job.id)} className="ml-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400">
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <CreateJobModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={(title, type) => createJob.mutate({ title, type })}
        isLoading={createJob.isPending}
      />
    </div>
  );
}
