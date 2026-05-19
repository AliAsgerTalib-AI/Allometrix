import React, { useEffect, useRef, useState } from 'react';
import { LogEntry, LogSeverity } from '../types';
import { Filter, Info, AlertTriangle, CheckCircle, ShieldAlert, Terminal } from 'lucide-react';

interface EventLogProps {
  logs: LogEntry[];
  onClear?: () => void;
}

const EventLog: React.FC<EventLogProps> = ({ logs, onClear }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<LogSeverity | 'all'>('all');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = logs.filter(log => filter === 'all' || log.severity === filter);

  const counts: Record<LogSeverity, number> = {
    info:     logs.filter(l => l.severity === 'info').length,
    success:  logs.filter(l => l.severity === 'success').length,
    warning:  logs.filter(l => l.severity === 'warning').length,
    critical: logs.filter(l => l.severity === 'critical').length,
  };

  const severityConfig: Record<LogSeverity, { icon: React.ReactNode, color: string, bg: string, border: string }> = {
    info: { icon: <Info size={12} />, color: 'text-slate-400', bg: 'bg-slate-900/40', border: 'border-slate-800' },
    success: { icon: <CheckCircle size={12} />, color: 'text-emerald-400', bg: 'bg-emerald-400/5', border: 'border-emerald-400/20' },
    warning: { icon: <AlertTriangle size={12} />, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/20' },
    critical: { icon: <ShieldAlert size={12} />, color: 'text-red-500', bg: 'bg-red-500/5', border: 'border-red-500/20' },
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-6 pt-4 pb-2 mb-1 flex justify-between items-center border-b border-slate-800">
        <h2 className="text-[11px] font-bold tracking-[0.2em] text-slate-500 uppercase flex items-center">
          <Terminal size={12} className="mr-3 text-emerald-400" />
          Terminal Feedback
        </h2>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {(['all', 'info', 'success', 'warning', 'critical'] as const).map((sev) => {
              const count = sev === 'all' ? logs.length : counts[sev];
              return (
                <button
                  key={sev}
                  onClick={() => setFilter(sev)}
                  className={`text-[9px] px-2 py-0.5 rounded-full border transition-all uppercase font-bold tracking-tight flex items-center space-x-1 ${
                    filter === sev
                      ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                      : 'border-slate-800 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/5'
                  }`}
                >
                  <span>{sev}</span>
                  {count > 0 && (
                    <span className={`${filter === sev ? 'opacity-60' : 'opacity-50'} tabular-nums`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {onClear && (
            <button 
              onClick={onClear}
              className="text-[9px] px-2 py-0.5 rounded-full border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase font-bold"
            >
              Flush
            </button>
          )}
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 p-6 font-mono text-[11px] leading-relaxed overflow-y-auto space-y-3 custom-scrollbar"
      >
        {filteredLogs.map((log) => {
          const config = severityConfig[log.severity];
          return (
            <div key={log.id} className="group flex flex-col space-y-1 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex items-center justify-between text-[9px] text-slate-600 font-bold uppercase tracking-tight pl-2">
                <div className="flex items-center space-x-3">
                  <span className="text-slate-500">{log.timestamp}</span>
                  <span className="opacity-20">|</span>
                  <span className={config.color}>{log.severity}</span>
                </div>
              </div>
              <div className={`flex space-x-4 p-3 rounded-xl ${config.bg} border ${config.border}`}>
                <div className={`mt-0.5 shrink-0 ${config.color} opacity-80`}>
                  {config.icon}
                </div>
                <span className={`${config.color} font-medium tracking-tight mt-0.5`}>
                  {log.text}
                </span>
              </div>
            </div>
          );
        })}
        {filteredLogs.length === 0 && (
          <div className="text-slate-600 font-bold uppercase text-[10px] tracking-widest text-center py-12 border border-dashed border-slate-800 rounded-2xl">
            Buffer Empty
          </div>
        )}
      </div>
    </div>
  );
};

export default EventLog;
