import React, { useState, useEffect, useMemo } from 'react';
import { Save, Trash2, Download, GitCompare, X } from 'lucide-react';
import { OrganismDNA, EcosystemState, Preset, LogSeverity } from '../types';
import { DEFAULT_ECOSYSTEM, evaluateSurvival } from '../engine';

interface PresetManagerProps {
  currentDna: OrganismDNA;
  currentEcosystem: EcosystemState;
  onLoad: (dna: OrganismDNA, ecosystem: EcosystemState) => void;
  onLog: (message: string, severity?: LogSeverity) => void;
}

const STORAGE_KEY = 'allometrix_presets';

const BASE_PRESETS: Preset[] = [
  {
    id: 'stock-arctic',
    name: 'ARCTIC WASTES',
    type: 'WORLD',
    timestamp: 1716000000000,
    ecosystem: { ambientTemperatureCelsius: -20, gravityMultiplier: 1.0, oxygenPercentage: 21, fluidViscosity: 1.0, toxins: 0.05, pHLevel: 7.0, nutrientAvailability: 0.3, eventFrequency: 0.2 },
    dna: {} as any
  },
  {
    id: 'stock-hydro',
    name: 'ABYSSAL WATER',
    type: 'WORLD',
    timestamp: 1716000000000,
    ecosystem: { ambientTemperatureCelsius: 4, gravityMultiplier: 1.0, oxygenPercentage: 15, fluidViscosity: 1.0, toxins: 0.15, pHLevel: 7.8, nutrientAvailability: 0.8, eventFrequency: 0.3 },
    dna: {} as any
  },
  {
    id: 'stock-heavy',
    name: 'PROXIMA B (HEAVY)',
    type: 'WORLD',
    timestamp: 1716000000000,
    ecosystem: { ambientTemperatureCelsius: 15, gravityMultiplier: 1.8, oxygenPercentage: 18, fluidViscosity: 1.0, toxins: 0.4, pHLevel: 6.2, nutrientAvailability: 0.5, eventFrequency: 0.5 },
    dna: {} as any
  }
];

const PresetManager: React.FC<PresetManagerProps> = ({ currentDna, currentEcosystem, onLoad, onLog }) => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'DNA' | 'WORLD'>('ALL');
  const [saveType, setSaveType] = useState<'FULL' | 'DNA' | 'WORLD'>('FULL');
  const [presetName, setPresetName] = useState('');
  const [comparePreset, setComparePreset] = useState<Preset | null>(null);

  const currentResult = useMemo(() => evaluateSurvival(currentDna, currentEcosystem), [currentDna, currentEcosystem]);
  const compareResult = useMemo(() => {
    if (!comparePreset) return null;
    const dna = comparePreset.type === 'WORLD' ? currentDna : comparePreset.dna;
    const eco = comparePreset.type === 'DNA' ? currentEcosystem : comparePreset.ecosystem;
    return evaluateSurvival(dna, eco);
  }, [comparePreset, currentDna, currentEcosystem]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let loadedPresets: Preset[] = [];
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        loadedPresets = parsed.map((p: any) => ({
          ...p,
          type: p.type || 'FULL',
          dna: p.dna || {},
          ecosystem: { ...DEFAULT_ECOSYSTEM, ...p.ecosystem }
        }));
      } catch (e) {
        console.error('Failed to parse presets', e);
      }
    }

    // Merge with base presets, ensuring IDs are unique
    const merged = [...BASE_PRESETS, ...loadedPresets.filter(p => !p.id.startsWith('stock-'))];
    setPresets(merged);
  }, []);

  const savePresets = (newPresets: Preset[]) => {
    const userOnly = newPresets.filter(p => !p.id.startsWith('stock-'));
    setPresets(newPresets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly));
  };

  const handleSave = () => {
    if (!presetName.trim()) {
      onLog('PRESET NAME REQUIRED', 'warning');
      return;
    }

    const newPreset: Preset = {
      id: crypto.randomUUID(),
      name: presetName,
      type: saveType,
      dna: { ...currentDna },
      ecosystem: { ...currentEcosystem },
      timestamp: Date.now(),
    };

    const updated = [...presets, newPreset];
    savePresets(updated);
    setPresetName('');
    onLog(`PRESET [${presetName}] ARCHIVED`, 'success');
  };

  const handleDelete = (id: string, name: string) => {
    const updated = presets.filter(p => p.id !== id);
    savePresets(updated);
    onLog(`PRESET [${name}] PURGED`, 'warning');
  };

  const handleLoad = (preset: Preset) => {
    // If partial preset, use current values for the other half
    const dnaToLoad = preset.type === 'WORLD' ? currentDna : preset.dna;
    const ecosystemToLoad = preset.type === 'DNA' ? currentEcosystem : preset.ecosystem;
    
    onLoad(dnaToLoad, ecosystemToLoad);
    onLog(`RECORD [${preset.name}] SYNCED`, 'success');
  };

  const filteredPresets = presets.filter(p => activeTab === 'ALL' || p.type === activeTab);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
        <h2 className="text-[11px] font-bold tracking-[0.2em] text-emerald-400 uppercase">Archive Hub</h2>
        <div className="flex space-x-3">
          {(['ALL', 'DNA', 'WORLD'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${activeTab === tab ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Save Input & Options */}
      <div className="space-y-4">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Record handle..."
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 px-4 py-2 text-[11px] font-bold focus:border-emerald-400 outline-none transition-all placeholder:text-slate-700 uppercase tracking-tight rounded-xl text-emerald-400"
          />
          <button
            onClick={handleSave}
            className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-4 py-2 flex items-center justify-center transition-all rounded-xl shadow-lg border-b-2 border-emerald-600 active:border-b-0 active:translate-y-[1px]"
          >
            <Save size={14} className="mr-2" />
            <span className="text-[10px] uppercase font-bold tracking-tight">Store</span>
          </button>
        </div>
        
        <div className="flex space-x-2">
          {(['FULL', 'DNA', 'WORLD'] as const).map(type => (
            <button
              key={type}
              onClick={() => setSaveType(type)}
              className={`flex-1 text-[9px] font-bold py-2 border transition-all rounded-xl uppercase tracking-widest ${saveType === type ? 'bg-emerald-400/20 border-emerald-400/40 text-emerald-400 shadow-inner' : 'bg-transparent border-slate-800 text-slate-600 hover:text-slate-400'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Panel */}
      {comparePreset && compareResult && (
        <div className="bg-slate-900/40 border border-emerald-400/20 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-emerald-400/70 uppercase tracking-widest">Compare: {comparePreset.name}</span>
            <button onClick={() => setComparePreset(null)} className="text-slate-500 hover:text-red-400 transition-colors">
              <X size={12} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[8px] font-bold uppercase">
            <span className="text-slate-600">Field</span>
            <span className="text-emerald-400/60 text-center">Current</span>
            <span className="text-blue-400/60 text-center">{comparePreset.name.slice(0, 10)}</span>
          </div>
          {[
            { label: 'Mass', curr: `${currentDna.totalMassKg.toFixed(0)}kg`, comp: comparePreset.type !== 'WORLD' ? `${comparePreset.dna.totalMassKg?.toFixed(0)}kg` : '—' },
            { label: 'Env', curr: currentDna.environment, comp: comparePreset.type !== 'WORLD' ? comparePreset.dna.environment : '—' },
            { label: 'Resp', curr: currentDna.modules.respiration.type.replace(/_/g, ' '), comp: comparePreset.type !== 'WORLD' ? comparePreset.dna.modules?.respiration?.type?.replace(/_/g, ' ') || '—' : '—' },
            { label: 'Brain', curr: currentDna.modules.nervousSystem.complexity, comp: comparePreset.type !== 'WORLD' ? comparePreset.dna.modules?.nervousSystem?.complexity || '—' : '—' },
            { label: 'Trophic', curr: currentDna.modules.trophic.type, comp: comparePreset.type !== 'WORLD' ? comparePreset.dna.modules?.trophic?.type || '—' : '—' },
            { label: 'Viability', curr: `${currentResult.telemetry.viabilityScore.toFixed(0)}%`, comp: `${compareResult.telemetry.viabilityScore.toFixed(0)}%` },
          ].map(({ label, curr, comp }) => (
            <div key={label} className="grid grid-cols-3 gap-1 text-[8px] py-0.5 border-b border-slate-800/50">
              <span className="text-slate-600 font-bold uppercase">{label}</span>
              <span className={`text-center font-bold ${currentResult.isViable ? 'text-emerald-400' : 'text-red-400'}`}>{curr}</span>
              <span className={`text-center font-bold ${compareResult.isViable ? 'text-blue-400' : 'text-red-400/70'}`}>{comp}</span>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className={`text-center text-[8px] font-bold py-1 rounded-lg border ${currentResult.isViable ? 'border-emerald-400/30 text-emerald-400 bg-emerald-400/5' : 'border-red-500/30 text-red-400 bg-red-500/5'}`}>
              {currentResult.isViable ? '✓ VIABLE' : `✗ ${currentResult.failureModes.length} FAIL`}
            </div>
            <div className={`text-center text-[8px] font-bold py-1 rounded-lg border ${compareResult.isViable ? 'border-blue-400/30 text-blue-400 bg-blue-400/5' : 'border-red-500/30 text-red-400 bg-red-500/5'}`}>
              {compareResult.isViable ? '✓ VIABLE' : `✗ ${compareResult.failureModes.length} FAIL`}
            </div>
          </div>
          <button
            onClick={() => { handleLoad(comparePreset); setComparePreset(null); }}
            className="w-full text-[9px] font-bold py-1.5 border border-blue-400/30 text-blue-400 hover:bg-blue-400/10 transition-all rounded-lg uppercase tracking-widest"
          >
            Load Preset
          </button>
        </div>
      )}

      {/* List Presets */}
      <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
        {filteredPresets.length === 0 ? (
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest text-center py-6 border border-dashed border-slate-800 rounded-2xl">
            No Records
          </div>
        ) : (
          filteredPresets.map((preset) => (
            <div key={preset.id} className={`group bg-slate-900/20 border p-4 flex items-center justify-between transition-all rounded-2xl ${comparePreset?.id === preset.id ? 'border-emerald-400/40 bg-emerald-400/5' : 'border-slate-800 hover:border-emerald-400/30'}`}>
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center space-x-3">
                  <span className={`text-[8px] px-2 py-0.5 border rounded-full font-bold tracking-tighter ${
                    preset.type === 'FULL' ? 'border-emerald-400/30 text-emerald-400/60' :
                    preset.type === 'DNA' ? 'border-blue-400/30 text-blue-400/60' :
                    'border-amber-400/30 text-amber-400/60'
                  }`}>
                    {preset.type}
                  </span>
                  <div className="text-[11px] text-emerald-400 font-bold truncate tracking-tight uppercase">{preset.name}</div>
                </div>
                <div className="text-[9px] text-slate-600 font-medium mt-1.5 uppercase font-mono tracking-widest">
                  {new Date(preset.timestamp).toLocaleDateString()} | Stable
                </div>
              </div>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setComparePreset(comparePreset?.id === preset.id ? null : preset)}
                  className={`p-2 transition-colors ${comparePreset?.id === preset.id ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}
                  title="Compare"
                >
                  <GitCompare size={14} />
                </button>
                <button
                  onClick={() => handleLoad(preset)}
                  className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                  title="Restore"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => handleDelete(preset.id, preset.name)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Purge"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PresetManager;
