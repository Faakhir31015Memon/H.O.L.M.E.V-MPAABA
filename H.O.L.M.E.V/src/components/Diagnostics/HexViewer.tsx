import React, { useState, useEffect, useRef } from 'react';
import { useHolmev } from '../../context/useHolmev';
import { CyberCard } from '../UI/CyberCard';
import { Binary, Play, Pause, RefreshCw, Search } from 'lucide-react';
import { generateHexDump } from '../../utils/mockData';

export const HexViewer: React.FC = () => {
  const { overkillMode } = useHolmev();
  const [hexRows, setHexRows] = useState(() => generateHexDump(0x7fff80, 16));
  const [isPaused, setIsPaused] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Live scrolling memory offset update loop
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setHexRows((prev) => {
        const nextOffset = parseInt(prev[0].offset, 16) + 16;
        const newDump = generateHexDump(nextOffset, 16);
        return newDump;
      });
    }, overkillMode ? 400 : 1200);

    return () => clearInterval(interval);
  }, [isPaused, overkillMode]);

  const filteredRows = hexRows.filter(
    (row) =>
      row.offset.toLowerCase().includes(searchFilter.toLowerCase()) ||
      row.bytesGroup1.toLowerCase().includes(searchFilter.toLowerCase()) ||
      row.bytesGroup2.toLowerCase().includes(searchFilter.toLowerCase()) ||
      row.ascii.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <CyberCard
      title="HEX MEMORY DUMP"
      subtitle="REAL-TIME RAM BUFFER & REGISTERS"
      icon={<Binary className="w-4 h-4" />}
      badge="LIVE-STREAM"
      action={
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume Hex Stream' : 'Pause Hex Stream'}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
          >
            {isPaused ? <Play className="w-3 h-3 text-cyan-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
          </button>
          <button
            type="button"
            onClick={() => setHexRows(generateHexDump(0x8a0000, 16))}
            title="Randomize Offset"
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-blue-400" />
          </button>
        </div>
      }
    >
      {/* Mini Filter Input */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-black/50 border border-white/5 rounded text-[11px] font-mono-tech mb-2">
        <Search className="w-3 h-3 text-gray-500" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filter hex or ASCII..."
          className="bg-transparent border-none outline-none text-cyan-300 placeholder-gray-600 w-full text-xs"
        />
        {searchFilter && (
          <button
            type="button"
            onClick={() => setSearchFilter('')}
            className="text-gray-500 hover:text-white"
          >
            ×
          </button>
        )}
      </div>

      {/* Hex Data Table Container */}
      <div
        ref={containerRef}
        className="h-44 overflow-y-auto font-code text-[10px] leading-tight select-text scrollbar-thin bg-black/60 p-2 rounded border border-white/5 flex flex-col gap-1"
      >
        <div className="flex items-center justify-between text-gray-500 border-b border-white/10 pb-1 font-mono-tech uppercase text-[9px]">
          <span>OFFSET</span>
          <span>HEX BYTES [00-07 | 08-0F]</span>
          <span>ASCII</span>
        </div>

        {filteredRows.map((row, idx) => (
          <div
            key={`${row.offset}-${idx}`}
            className="flex items-center justify-between hover:bg-white/[0.04] px-1 py-0.5 rounded transition-colors group"
          >
            {/* Memory Offset */}
            <span className="text-cyan-500 font-semibold">{row.offset}</span>

            {/* Byte groups */}
            <div className="flex items-center gap-2">
              <span className="text-gray-300 group-hover:text-cyan-200 transition-colors">
                {row.bytesGroup1}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400 group-hover:text-blue-200 transition-colors">
                {row.bytesGroup2}
              </span>
            </div>

            {/* Decoded ASCII Column */}
            <span className="text-amber-300/80 font-mono tracking-widest pl-2">
              {row.ascii}
            </span>
          </div>
        ))}
      </div>
    </CyberCard>
  );
};
