import React from 'react';
import { EcosystemState } from '../types';

interface EnvironmentControllerProps {
  ecosystem: EcosystemState;
  onChange: (updates: Partial<EcosystemState>) => void;
}

const CAT = {
  thermal:  { dot: 'bg-amber-400',  label: 'text-amber-400/70',  value: 'text-amber-400',  color: '#fbbf24' },
  physics:  { dot: 'bg-blue-400',   label: 'text-blue-400/70',   value: 'text-blue-400',   color: '#60a5fa' },
  chemical: { dot: 'bg-purple-400', label: 'text-purple-400/70', value: 'text-purple-400', color: '#c084fc' },
  ecology:  { dot: 'bg-teal-400',   label: 'text-teal-400/70',   value: 'text-teal-400',   color: '#2dd4bf' },
} as const;
type Category = keyof typeof CAT;

interface SliderDef {
  field: keyof EcosystemState;
  label: string;
  min: number; max: number; step: number;
  category: Category;
  format: (v: number) => string;
  parse: (s: string) => number;
  isDanger?: (v: number) => boolean;
}

const SLIDERS: SliderDef[] = [
  { field: 'ambientTemperatureCelsius', label: 'Temp',      min: -50,  max: 120, step: 1,    category: 'thermal',  format: v => `${v}°C`,               parse: parseInt,   isDanger: v => v > 80 || v < -30 },
  { field: 'oxygenPercentage',          label: 'O2',        min: 1,    max: 100, step: 1,    category: 'thermal',  format: v => `${v}%`,                parse: parseInt,   isDanger: v => v < 5 || v > 90 },
  { field: 'gravityMultiplier',         label: 'Gravity',   min: 0.1,  max: 8,   step: 0.05, category: 'physics',  format: v => `${v.toFixed(2)}G`,     parse: parseFloat, isDanger: v => v > 6 || v < 0.2 },
  { field: 'fluidViscosity',            label: 'Viscosity', min: 1.0,  max: 5,   step: 0.1,  category: 'physics',  format: v => `${v.toFixed(2)}η`,     parse: parseFloat, isDanger: v => v > 4 },
  { field: 'toxins',                    label: 'Toxicity',  min: 0,    max: 1,   step: 0.01, category: 'chemical', format: v => `${(v * 100).toFixed(0)}%`, parse: parseFloat, isDanger: v => v > 0.7 },
  { field: 'pHLevel',                   label: 'pH',        min: 1.0,  max: 14,  step: 0.1,  category: 'chemical', format: v => `${v.toFixed(1)}`,      parse: parseFloat, isDanger: v => v < 3 || v > 11 },
  { field: 'nutrientAvailability',      label: 'Nutrients', min: 0.01, max: 1,   step: 0.01, category: 'ecology',  format: v => `${(v * 100).toFixed(0)}%`, parse: parseFloat, isDanger: v => v < 0.05 },
  { field: 'eventFrequency',            label: 'Anomalies', min: 0,    max: 1,   step: 0.05, category: 'ecology',  format: v => `${(v * 100).toFixed(0)}%`, parse: parseFloat, isDanger: v => v > 0.8 },
];

const EnvironmentController: React.FC<EnvironmentControllerProps> = ({ ecosystem, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
        <h2 className="text-[11px] font-bold tracking-[0.2em] text-emerald-400 uppercase">Environment Matrix</h2>
        <div className="hidden lg:flex items-center space-x-3 text-[8px] font-bold uppercase tracking-widest">
          {(Object.entries(CAT) as [Category, typeof CAT[Category]][]).map(([key, c]) => (
            <span key={key} className="flex items-center space-x-1">
              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
              <span className={c.label}>{key}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-5">
        {SLIDERS.map((s) => {
          const c = CAT[s.category];
          const rawVal = ecosystem[s.field] as number;
          const fillPct = ((rawVal - s.min) / (s.max - s.min)) * 100;
          const danger = s.isDanger?.(rawVal) ?? false;
          const trackColor = danger ? '#ef4444' : c.color;
          return (
            <div key={s.field}>
              <div className="flex justify-between items-center mb-2">
                <label className={`flex items-center space-x-1.5 ${danger ? 'animate-pulse' : ''}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${danger ? 'bg-red-500' : c.dot}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${danger ? 'text-red-400' : c.label}`}>{s.label}</span>
                </label>
                <span className={`text-[11px] font-bold tabular-nums ${danger ? 'text-red-400 animate-pulse' : c.value}`}>{s.format(rawVal)}</span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={rawVal}
                onChange={(e) => onChange({ [s.field]: s.parse(e.target.value) } as Partial<EcosystemState>)}
                className="tui-slider"
                style={{ '--track-fill': trackColor, '--track-pct': `${fillPct}%` } as React.CSSProperties}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnvironmentController;
