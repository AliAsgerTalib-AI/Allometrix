import React from 'react';
import { EcosystemState } from '../types';

interface EnvironmentControllerProps {
  ecosystem: EcosystemState;
  onChange: (updates: Partial<EcosystemState>) => void;
}

const EnvironmentController: React.FC<EnvironmentControllerProps> = ({ ecosystem, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
        <h2 className="text-[11px] font-bold tracking-[0.2em] text-emerald-400 uppercase">Environment Matrix</h2>
        <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Simulation Parameters</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-7 gap-6">
        {/* Temperature */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="tui-input-label mb-0">Temp</label>
            <span className="text-[11px] text-emerald-400 font-bold">{ecosystem.ambientTemperatureCelsius}°C</span>
          </div>
          <input
            type="range"
            min="-50"
            max="120"
            step="1"
            value={ecosystem.ambientTemperatureCelsius}
            onChange={(e) => onChange({ ambientTemperatureCelsius: parseInt(e.target.value) })}
            className="tui-slider"
          />
        </div>

        {/* Gravity */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="tui-input-label mb-0">Gravity</label>
            <span className="text-[11px] text-emerald-400 font-bold">{ecosystem.gravityMultiplier.toFixed(2)}G</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="8.0"
            step="0.05"
            value={ecosystem.gravityMultiplier}
            onChange={(e) => onChange({ gravityMultiplier: parseFloat(e.target.value) })}
            className="tui-slider"
          />
        </div>

        {/* Oxygen */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="tui-input-label mb-0">O2 Level</label>
            <span className="text-[11px] text-emerald-400 font-bold">{ecosystem.oxygenPercentage}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={ecosystem.oxygenPercentage}
            onChange={(e) => onChange({ oxygenPercentage: parseInt(e.target.value) })}
            className="tui-slider"
          />
        </div>

        {/* Toxins */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="tui-input-label mb-0">Toxicity</label>
            <span className="text-[11px] text-emerald-400 font-bold">{(ecosystem.toxins * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={ecosystem.toxins}
            onChange={(e) => onChange({ toxins: parseFloat(e.target.value) })}
            className="tui-slider"
          />
        </div>

        {/* Nutrients */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="tui-input-label mb-0">Nutrients</label>
            <span className="text-[11px] text-emerald-400 font-bold">{(ecosystem.nutrientAvailability * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={ecosystem.nutrientAvailability}
            onChange={(e) => onChange({ nutrientAvailability: parseFloat(e.target.value) })}
            className="tui-slider"
          />
        </div>

        {/* Event Frequency */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="tui-input-label mb-0">Anomalies</label>
            <span className="text-[11px] text-emerald-400 font-bold">{(ecosystem.eventFrequency * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={ecosystem.eventFrequency}
            onChange={(e) => onChange({ eventFrequency: parseFloat(e.target.value) })}
            className="tui-slider"
          />
        </div>

        {/* Fluid Viscosity */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="tui-input-label mb-0">Viscosity</label>
            <span className="text-[11px] text-emerald-400 font-bold">{ecosystem.fluidViscosity.toFixed(2)}η</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="5.0"
            step="0.1"
            value={ecosystem.fluidViscosity}
            onChange={(e) => onChange({ fluidViscosity: parseFloat(e.target.value) })}
            className="tui-slider"
          />
        </div>

        {/* pH Level */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="tui-input-label mb-0">pH Level</label>
            <span className="text-[11px] text-emerald-400 font-bold">{(ecosystem.pHLevel || 7.0).toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="14.0"
            step="0.1"
            value={ecosystem.pHLevel || 7.0}
            onChange={(e) => onChange({ pHLevel: parseFloat(e.target.value) })}
            className="tui-slider"
          />
        </div>
      </div>
    </div>
  );
};

export default EnvironmentController;
