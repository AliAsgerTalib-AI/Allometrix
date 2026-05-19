import React, { useState, useRef, useEffect } from 'react';
import { History, Dna, RotateCcw } from 'lucide-react';
import { OrganismDNA } from '../types';

interface Snapshot {
  epoch: number;
  dna: OrganismDNA;
  hasMutation: boolean;
}

interface MutationScrubberProps {
  snapshots: Snapshot[];
  currentEpoch: number;
  onRestore: (dna: OrganismDNA) => void;
}

const MutationScrubber: React.FC<MutationScrubberProps> = ({ snapshots, currentEpoch, onRestore }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to end when new snapshots arrive
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [snapshots.length, isOpen]);

  if (snapshots.length === 0) return null;

  const selected = selectedIdx !== null ? snapshots[selectedIdx] : null;
  const mutationCount = snapshots.filter(s => s.hasMutation).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-[11px] font-bold tracking-[0.2em] text-emerald-400 uppercase flex items-center">
          <History size={12} className="mr-2" />
          Lineage Scrubber
        </h2>
        <button
          onClick={() => { setIsOpen(v => !v); setSelectedIdx(null); }}
          className="text-[9px] text-slate-500 hover:text-emerald-400 font-bold uppercase tracking-widest transition-colors flex items-center space-x-2"
        >
          {mutationCount > 0 && (
            <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded-full text-[8px] font-bold">
              {mutationCount}M
            </span>
          )}
          <span>{isOpen ? 'Collapse' : `${snapshots.length} States`}</span>
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3">
          {/* Epoch bubble timeline */}
          <div
            ref={scrollRef}
            className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar"
            style={{ scrollbarWidth: 'thin' }}
          >
            {snapshots.map((snap, i) => (
              <button
                key={`${snap.epoch}-${i}`}
                onClick={() => setSelectedIdx(i === selectedIdx ? null : i)}
                title={`Epoch ${snap.epoch}${snap.hasMutation ? ' — mutation occurred' : ''}`}
                className={`shrink-0 w-8 h-8 rounded-lg text-[9px] font-bold border transition-all ${
                  i === selectedIdx
                    ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                    : snap.hasMutation
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:border-amber-400'
                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-emerald-400/40 hover:text-emerald-400/60'
                }`}
              >
                {snap.epoch}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex space-x-4 text-[8px] text-slate-600 font-bold uppercase tracking-widest">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-sm bg-slate-900 border border-slate-700 inline-block" />
              <span>Normal</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-sm bg-amber-500/10 border border-amber-500/40 inline-block" />
              <span>Mutation</span>
            </span>
          </div>

          {/* Selected snapshot detail */}
          {selected && (
            <div className="bg-slate-900/60 border border-slate-700 p-3 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Dna size={10} className="text-emerald-400" />
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                    Epoch {selected.epoch}
                  </span>
                </div>
                {selected.hasMutation && (
                  <span className="text-[8px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                    MUTATION
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[9px] font-mono">
                <div className="text-slate-500">Mass <span className="text-emerald-400 float-right">{selected.dna.totalMassKg.toFixed(1)}kg</span></div>
                <div className="text-slate-500">Env <span className="text-emerald-400 float-right">{selected.dna.environment}</span></div>
                <div className="text-slate-500">Resp <span className="text-emerald-400 float-right">{selected.dna.modules.respiration.type.replace(/_/g, ' ')}</span></div>
                <div className="text-slate-500">Brain <span className="text-emerald-400 float-right">{selected.dna.modules.nervousSystem.complexity}</span></div>
                <div className="text-slate-500">Trophic <span className="text-emerald-400 float-right">{selected.dna.modules.trophic.type}</span></div>
                <div className="text-slate-500">Sensory <span className="text-emerald-400 float-right">{selected.dna.modules.sensory.type}</span></div>
              </div>

              <button
                onClick={() => { onRestore(selected.dna); setSelectedIdx(null); }}
                className="w-full text-[9px] font-bold py-2 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 active:bg-emerald-400/20 transition-all rounded-lg uppercase tracking-widest flex items-center justify-center space-x-1.5"
              >
                <RotateCcw size={10} />
                <span>Restore This State</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MutationScrubber;
