import React, { useState, useRef, useEffect } from 'react';
import { useHolmev } from '../../context/useHolmev';
import { CyberCard } from '../UI/CyberCard';
import type { LogLevel } from '../../types/holmev';
import { Terminal, Trash2, Download, Search, ArrowDownCircle } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export const ExecutionLogs: React.FC = () => {
  const { logs, clearLogs, overkillMode } = useHolmev();
  const [filterLevel, setFilterLevel] = useState<'ALL' | LogLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top on new log if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
    const matchesQuery =
      searchQuery === '' ||
      log.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesQuery;
  });

  // Export logs to text file
  const handleExport = () => {
    soundFx.playClick(850);
    const content = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.source}]: ${l.text}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HOLMEV_LOGS_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelBadgeClass = (level: LogLevel) => {
    switch (level) {
      case 'warn':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'success':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      default:
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  return (
    <CyberCard
      title="EXECUTION LOGS"
      subtitle="SYSTEM BUS & KERNEL EVENT STREAM"
      icon={<Terminal className="w-4 h-4" />}
      badge={`${logs.length} EVENTS`}
      action={
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Disable Auto-scroll' : 'Enable Auto-scroll'}
            className={`p-1 rounded text-xs transition-colors ${
              autoScroll ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-500 bg-white/5'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleExport}
            title="Export Logs"
            className="p-1 rounded text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={clearLogs}
            title="Clear Logs"
            className="p-1 rounded text-red-400 hover:text-red-300 bg-white/5 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      }
    >
      {/* Filter and Search Controls */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {/* Filter Chips */}
        <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded border border-white/5 text-[10px] font-mono-tech">
          {(['ALL', 'info', 'warn', 'success'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                soundFx.playClick(900);
                setFilterLevel(lvl);
              }}
              className={`px-2 py-0.5 rounded uppercase transition-colors ${
                filterLevel === lvl
                  ? overkillMode
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-cyan-500 text-black font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-1 px-2 py-0.5 bg-black/50 border border-white/5 rounded text-[11px] font-mono-tech w-36">
          <Search className="w-3 h-3 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-cyan-300 placeholder-gray-600 w-full text-[11px]"
          />
        </div>
      </div>

      {/* Terminal Log Console */}
      <div
        ref={logContainerRef}
        className="h-56 overflow-y-auto font-code text-[11px] leading-relaxed scrollbar-thin bg-black/70 p-2.5 rounded border border-white/5 flex flex-col gap-1.5"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-gray-600 text-center py-8 font-mono-tech text-xs">
            [NO LOG EVENTS MATCHING CRITERIA]
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div
              key={log.id || `${log.timestamp}-${idx}`}
              className="flex items-start gap-2 hover:bg-white/[0.03] p-1 rounded transition-colors group select-text"
            >
              {/* Timestamp */}
              <span className="text-gray-500 font-mono text-[10px] flex-shrink-0">
                [{log.timestamp}]
              </span>

              {/* Source Tag */}
              <span
                className={`text-[9px] font-mono-tech px-1 py-0.2 rounded border flex-shrink-0 uppercase ${getLevelBadgeClass(
                  log.level
                )}`}
              >
                {log.source}
              </span>

              {/* Message text */}
              <span
                className={`flex-1 break-words ${
                  log.level === 'warn'
                    ? 'text-amber-300 font-medium'
                    : log.level === 'success'
                    ? 'text-green-300'
                    : 'text-gray-300'
                }`}
              >
                {log.text}
              </span>
            </div>
          ))
        )}
      </div>
    </CyberCard>
  );
};
