import React from 'react';
import { motion } from 'motion/react';
import { Check, Target, Zap, Waves, Wind, Thermometer, FlaskConical, Component, History, ChevronDown, Activity, Eye, Radio, Lock } from 'lucide-react';
import { OrganismDNA, DNAHistoryEntry } from '../types';

interface DNAModifierProps {
  dna: OrganismDNA;
  onChange: (updates: Partial<OrganismDNA>) => void;
  dnaHistory?: DNAHistoryEntry[];
}

type Domain = "bacteria" | "archaea" | "eukaryota";

const formatMicrobialMass = (kg: number): string => {
  const fg = kg * 1e18;
  if (fg < 1000) return `${fg.toFixed(1)} fg`;
  const pg = kg * 1e15;
  if (pg < 1000) return `${pg.toFixed(1)} pg`;
  const ng = kg * 1e12;
  if (ng < 1000) return `${ng.toFixed(1)} ng`;
  const ug = kg * 1e9;
  return `${ug.toFixed(2)} µg`;
};

const DOMAIN_DESCRIPTIONS: Record<Domain, string> = {
  bacteria: 'Prokaryote. Membrane diffusion only. Binary fission. Antibiotic-sensitive.',
  archaea:  'Extremophile prokaryote. Thrives at pH/temp extremes. Chemolithotrophy default.',
  eukaryota:'Complex cellular organization. Full module access. Kleiber metabolic scaling.',
};

const DNAModifier: React.FC<DNAModifierProps> = ({ dna, onChange, dnaHistory = [] }) => {
  const [showHistory, setShowHistory] = React.useState(false);
  const [historyFilter, setHistoryFilter] = React.useState<'all' | 'USER' | 'MUTATION'>('all');

  const domain: Domain = dna.domain ?? "eukaryota";
  const isMicrobial = domain === "bacteria" || domain === "archaea";
  const filteredHistory = dnaHistory.filter(h => historyFilter === 'all' || h.changeType === historyFilter);

  const handleDomainSwitch = (newDomain: Domain) => {
    if (newDomain === domain) return;
    if (newDomain === "bacteria") {
      onChange({
        domain: "bacteria",
        totalMassKg: isMicrobial ? dna.totalMassKg : 1e-12,
        structuralMaterial: "peptidoglycan",
        modules: {
          ...dna.modules,
          respiration: { type: "membrane_diffusion", efficiency: dna.modules.respiration.efficiency },
          nervousSystem: { complexity: "none" },
          reproduction: { strategy: "binary_fission", clutchSize: 2 },
          locomotion: { type: "none" },
          thermal: { type: "none", scale: 1.0 },
        }
      });
    } else if (newDomain === "archaea") {
      onChange({
        domain: "archaea",
        totalMassKg: isMicrobial ? dna.totalMassKg : 1e-12,
        structuralMaterial: "archaeal_s_layer",
        modules: {
          ...dna.modules,
          respiration: { type: "membrane_diffusion", efficiency: dna.modules.respiration.efficiency },
          nervousSystem: { complexity: "none" },
          reproduction: { strategy: "binary_fission", clutchSize: 2 },
          locomotion: { type: "none" },
          thermal: { type: "none", scale: 1.0 },
          trophic: { type: "chemoautotroph", efficiency: dna.modules.trophic.efficiency },
        }
      });
    } else {
      onChange({
        domain: "eukaryota",
        totalMassKg: isMicrobial ? 0.5 : dna.totalMassKg,
        structuralMaterial: (dna.structuralMaterial === "peptidoglycan" || dna.structuralMaterial === "archaeal_s_layer")
          ? "standard_bone" : dna.structuralMaterial,
        modules: {
          ...dna.modules,
          respiration: (dna.modules.respiration.type === "membrane_diffusion")
            ? { type: "mammalian_lung", efficiency: dna.modules.respiration.efficiency }
            : dna.modules.respiration,
          nervousSystem: (dna.modules.nervousSystem.complexity === "none")
            ? { complexity: "standard" }
            : dna.modules.nervousSystem,
          reproduction: (dna.modules.reproduction.strategy === "binary_fission")
            ? { strategy: "r_selection", clutchSize: 10 }
            : dna.modules.reproduction,
          locomotion: (dna.modules.locomotion.type === "flagella")
            ? { type: "none" }
            : dna.modules.locomotion,
        }
      });
    }
  };

  const updateRespiration = (updates: Partial<OrganismDNA['modules']['respiration']>) => {
    onChange({ modules: { ...dna.modules, respiration: { ...dna.modules.respiration, ...updates } } });
  };
  const updateLocomotion = (updates: Partial<OrganismDNA['modules']['locomotion']>) => {
    onChange({ modules: { ...dna.modules, locomotion: { ...dna.modules.locomotion, ...updates } } });
  };
  const updateThermal = (updates: Partial<OrganismDNA['modules']['thermal']>) => {
    onChange({ modules: { ...dna.modules, thermal: { ...dna.modules.thermal, ...updates } } });
  };
  const updateTrophic = (updates: Partial<OrganismDNA['modules']['trophic']>) => {
    onChange({ modules: { ...dna.modules, trophic: { ...dna.modules.trophic, ...updates } } });
  };
  const updateNervousSystem = (updates: Partial<OrganismDNA['modules']['nervousSystem']>) => {
    onChange({ modules: { ...dna.modules, nervousSystem: { ...dna.modules.nervousSystem, ...updates } } });
  };
  const updateReproduction = (updates: Partial<OrganismDNA['modules']['reproduction']>) => {
    onChange({ modules: { ...dna.modules, reproduction: { ...dna.modules.reproduction, ...updates } } });
  };
  const updateHydrodynamics = (updates: Partial<OrganismDNA['modules']['hydrodynamics']>) => {
    onChange({ modules: { ...dna.modules, hydrodynamics: { ...dna.modules.hydrodynamics, ...updates } } });
  };
  const updateSensory = (updates: Partial<OrganismDNA['modules']['sensory']>) => {
    onChange({ modules: { ...dna.modules, sensory: { ...dna.modules.sensory, ...updates } } });
  };
  const updateChemicalTolerance = (updates: Partial<OrganismDNA['modules']['chemicalTolerance']>) => {
    onChange({ modules: { ...dna.modules, chemicalTolerance: { ...dna.modules.chemicalTolerance, ...updates } } });
  };

  const SliderWithMutation = ({
    label, value, min, max, step, onChange: onSliderChange, displayValue, mutationSpan, unitLabel
  }: {
    label: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void; displayValue: string | number; mutationSpan: number; unitLabel?: string;
  }) => {
    const range = max - min;
    const mMin = Math.max(min, value - mutationSpan / 2);
    const mMax = Math.min(max, value + mutationSpan / 2);
    const left = ((mMin - min) / range) * 100;
    const width = ((mMax - mMin) / range) * 100;
    return (
      <div>
        <div className="flex justify-between items-end mb-1">
          <label className="tui-input-label flex items-center">
            {label}
            {unitLabel && <span className="ml-2 px-1 bg-slate-800 rounded-full text-[7px] text-slate-500 border border-slate-700">{unitLabel}</span>}
          </label>
          <span className="text-xs text-emerald-400 font-mono font-bold tracking-tighter">{displayValue}</span>
        </div>
        <div className="relative pt-1 pb-2">
          <div className="absolute h-[2px] bg-amber-500/40 bottom-1.5 pointer-events-none rounded-full z-10"
            style={{ left: `${left}%`, width: `${width}%` }} />
          <input type="range" min={min} max={max} step={step} value={value}
            onChange={(e) => onSliderChange(parseFloat(e.target.value))}
            className="tui-slider relative z-20" />
        </div>
      </div>
    );
  };

  // Log-scale mass slider for microbials
  const MicrobialMassSlider = () => {
    const logVal = Math.log10(Math.max(1e-15, dna.totalMassKg));
    return (
      <div>
        <div className="flex justify-between items-end mb-1">
          <label className="tui-input-label">Cell Mass</label>
          <span className="text-xs text-emerald-400 font-mono font-bold">{formatMicrobialMass(dna.totalMassKg)}</span>
        </div>
        <div className="relative pt-1 pb-2">
          <input type="range" min={-15} max={-6} step={0.1}
            value={logVal}
            onChange={(e) => onChange({ totalMassKg: Math.pow(10, parseFloat(e.target.value)) })}
            className="tui-slider" />
        </div>
        <div className="flex justify-between text-[8px] text-slate-600">
          <span>1 fg</span><span>1 µg</span>
        </div>
      </div>
    );
  };

  const LockedBadge = () => (
    <span className="inline-flex items-center ml-1.5 px-1 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[7px] text-amber-500 uppercase">
      <Lock size={7} className="mr-0.5" />locked
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 mb-6">
        <h2 className="text-[11px] font-bold tracking-[0.2em] text-emerald-400 flex items-center justify-between uppercase">
          Biomapping Core
          <span className="text-[10px] text-slate-500 font-medium">v7.4-Pro</span>
        </h2>
      </div>

      {/* ── DOMAIN SELECTOR ─────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <label className="tui-input-label mb-3 block tracking-[0.15em]">Domain of Life</label>
        <div className="grid grid-cols-3 gap-1">
          {(['bacteria', 'archaea', 'eukaryota'] as const).map((dom) => (
            <div
              key={dom}
              onClick={() => handleDomainSwitch(dom)}
              className={`tui-toggle-item text-[9px] py-2 flex flex-col items-center gap-1 ${domain === dom ? 'tui-toggle-item-active' : ''}`}
            >
              <span className="text-[8px] font-black uppercase tracking-widest">{
                dom === 'bacteria' ? 'BAC' : dom === 'archaea' ? 'ARC' : 'EUK'
              }</span>
              <span className="uppercase text-[8px]">{dom}</span>
            </div>
          ))}
        </div>
        <p className="text-[8px] text-slate-500 mt-2 italic leading-tight">{DOMAIN_DESCRIPTIONS[domain]}</p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="tui-input-label tracking-tighter">Specimen Identifier</label>
          <input type="text" value={dna.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 px-3 py-2 text-xs focus:border-emerald-400 outline-none transition-all uppercase font-bold tracking-tight text-emerald-400 rounded-lg"
            placeholder="ENTER UNIT ID..." />
        </div>

        {/* Mass */}
        {isMicrobial
          ? <MicrobialMassSlider />
          : (
            <SliderWithMutation
              label="Total Biomass" value={dna.totalMassKg} min={0.1} max={10000} step={0.1}
              onChange={(v) => onChange({ totalMassKg: v })}
              displayValue={`${dna.totalMassKg.toLocaleString()}kg`}
              mutationSpan={dna.totalMassKg * 0.1} unitLabel="KG" />
          )
        }

        {/* Morphology */}
        <div className="space-y-4">
          <div className="space-y-1">
            <SliderWithMutation label="Morphological Geometry" value={dna.geometryFactor}
              min={1.0} max={5.0} step={0.05}
              onChange={(v) => onChange({ geometryFactor: v })}
              displayValue={`${dna.geometryFactor.toFixed(2)} φ`} mutationSpan={0.2} />
            <div className="flex justify-between text-[8px] text-slate-600">
              <span>{isMicrobial ? 'COCCUS' : 'COMPACT (Low Drag)'}</span>
              <span>{isMicrobial ? 'SPIRAL' : 'ELONGATED (High Drag)'}</span>
            </div>
          </div>
          <div className="space-y-1">
            <SliderWithMutation label="Structural Complexity" value={dna.morphologyComplexity}
              min={0.0} max={1.0} step={0.01}
              onChange={(v) => onChange({ morphologyComplexity: v })}
              displayValue={`${(dna.morphologyComplexity * 100).toFixed(0)}%`} mutationSpan={0.1} />
            <div className="flex justify-between text-[8px] text-slate-600">
              <span>{isMicrobial ? 'LOW SIGNALING' : 'SIMPLE (Efficient)'}</span>
              <span>{isMicrobial ? 'HIGH QUORUM' : 'COMPLEX (High Cost)'}</span>
            </div>
          </div>
        </div>

        {/* Environment */}
        <div>
          <label className="tui-input-label flex items-center justify-between">
            Target Environment
            <span className="text-emerald-400 opacity-60">
              {dna.environment === 'LAND' && <Target size={14} />}
              {dna.environment === 'WATER' && <Waves size={14} />}
              {dna.environment === 'AIR' && <Wind size={14} />}
            </span>
          </label>
          <div className="tui-toggle-group">
            {(['LAND', 'WATER', 'AIR'] as const).map((env) => (
              <div key={env} onClick={() => onChange({ environment: env })}
                className={`tui-toggle-item relative ${dna.environment === env ? 'tui-toggle-item-active' : ''}`}>
                {env}
                {dna.environment === env && (
                  <motion.div layoutId="env-active" className="absolute -top-1 -right-1">
                    <Check size={8} className="text-emerald-400" />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Locomotion */}
        <div className="pt-6 border-t border-slate-800">
          <label className="tui-input-label mb-3 flex items-center">
            <Zap size={14} className="mr-2 text-emerald-400" />
            Locomotion Module
          </label>
          {isMicrobial ? (
            <div className="grid grid-cols-2 gap-1 mb-3">
              {(['none', 'flagella'] as const).map((loco) => (
                <div key={loco}
                  onClick={() => updateLocomotion({ type: loco })}
                  className={`tui-toggle-item text-[9px] py-1.5 flex items-center justify-center space-x-1 ${dna.modules.locomotion.type === loco ? 'tui-toggle-item-active' : ''}`}>
                  {dna.modules.locomotion.type === loco && <div className="w-1 h-1 rounded-full bg-emerald-400 mr-1" />}
                  <span>{loco}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 mb-3">
              {(['none', 'wings', 'spring_legs', 'columnar_legs', 'fins'] as const).map((loco) => (
                <div key={loco}
                  onClick={() => updateLocomotion({
                    type: loco,
                    wingAreaSqM: loco === 'wings' && !dna.modules.locomotion.wingAreaSqM ? 1.0 : dna.modules.locomotion.wingAreaSqM
                  })}
                  className={`tui-toggle-item text-[9px] py-1.5 flex items-center justify-center space-x-1 ${dna.modules.locomotion.type === loco ? 'tui-toggle-item-active' : ''}`}>
                  {dna.modules.locomotion.type === loco && <div className="w-1 h-1 rounded-full bg-emerald-400 mr-1" />}
                  <span>{loco.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}
          {!isMicrobial && dna.modules.locomotion.type === 'wings' && (
            <div className="space-y-1">
              <div className="flex justify-between items-end">
                <label className="text-[10px] text-slate-500 uppercase">Aero-Surface Area</label>
                <div className="flex items-center space-x-2">
                  <span className="px-1 bg-amber-500/10 border border-amber-500/30 text-[8px] text-amber-500 rounded-px uppercase">Lift Surface</span>
                  <span className="text-[10px] font-mono text-emerald-400">{(dna.modules.locomotion.wingAreaSqM || 1.0).toFixed(2)} m²</span>
                </div>
              </div>
              <input type="range" min="0.1" max="100.0" step="0.1"
                value={dna.modules.locomotion.wingAreaSqM || 1.0}
                onChange={(e) => updateLocomotion({ wingAreaSqM: parseFloat(e.target.value) })}
                className="tui-slider h-1" />
            </div>
          )}
          <p className="text-[8px] text-slate-600 mt-2 italic leading-tight">
            {dna.modules.locomotion.type === 'flagella' ? 'Rotary appendages for chemotaxis and nutrient seeking. Low metabolic cost.' :
             dna.modules.locomotion.type === 'wings' ? 'Enables aerial transit. High energy cost on land.' :
             dna.modules.locomotion.type === 'spring_legs' ? 'High burst speed. Dynamic load distribution reduces skeletal stress.' :
             dna.modules.locomotion.type === 'columnar_legs' ? 'Reinforced skeletal load handling for heavy biomass.' :
             dna.modules.locomotion.type === 'fins' ? 'Aquatic propulsion. Efficient in water environments.' :
             'Standard configuration.'}
          </p>
        </div>

        {/* Sub-systems */}
        <div className="pt-6 border-t border-slate-800 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-px flex-1 bg-slate-800" />
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Sub-Systems</div>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* Gas Exchange */}
          <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
            <label className="tui-input-label mb-3 flex items-center">
              <FlaskConical size={14} className="mr-2 text-emerald-400" />
              Gas Exchange
              {isMicrobial && <LockedBadge />}
            </label>
            {isMicrobial ? (
              <div className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-[9px] text-emerald-400 font-bold uppercase">
                Membrane Diffusion (Fick's Law)
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 mb-3">
                {(['mammalian_lung', 'avian_lung', 'tracheae', 'gills', 'membrane_diffusion'] as const).map((resp) => (
                  <div key={resp}
                    onClick={() => updateRespiration({ type: resp })}
                    className={`tui-toggle-item text-[9px] py-1.5 flex items-center justify-center space-x-1 ${dna.modules.respiration.type === resp ? 'tui-toggle-item-active' : ''}`}>
                    {dna.modules.respiration.type === resp && <div className="w-1 h-1 rounded-full bg-emerald-400 mr-1" />}
                    <span>{resp.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-1 mt-3">
              <div className="flex justify-between items-end">
                <label className="text-[10px] text-slate-500 uppercase">Efficiency</label>
                <div className="flex items-center space-x-2">
                  <span className="px-1 bg-blue-500/10 border border-blue-500/30 text-[8px] text-blue-400 rounded-px uppercase">YIELD</span>
                  <span className="text-[10px] font-mono text-emerald-400">x{dna.modules.respiration.efficiency.toFixed(2)}</span>
                </div>
              </div>
              <input type="range" min="0.5" max="2.0" step="0.05"
                value={dna.modules.respiration.efficiency}
                onChange={(e) => updateRespiration({ efficiency: parseFloat(e.target.value) })}
                className="tui-slider h-1" />
            </div>
            <p className="text-[8px] text-slate-600 mt-2 italic leading-tight">
              {isMicrobial ? 'O2 crosses cell membrane via passive diffusion. Efficiency limited by cell radius.' :
               dna.modules.respiration.type === 'membrane_diffusion' ? 'Passive diffusion. Insufficient above 1g — MACROSCALE FAILURE.' :
               dna.modules.respiration.type === 'gills' ? 'Liquid-phase gas extraction. Requires water immersion.' :
               dna.modules.respiration.type === 'tracheae' ? 'Passive diffusion network. Limited by specimen size.' :
               dna.modules.respiration.type === 'avian_lung' ? 'High-efficiency flow-through system. Optimal for flight.' :
               'Standard high-pressure internal gas exchange.'}
            </p>
          </div>

          {/* Thermodynamics — hidden for microbials (poikilothermic) */}
          {!isMicrobial && (
            <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
              <label className="tui-input-label mb-3 flex items-center">
                <Thermometer size={14} className="mr-2 text-emerald-400" />
                Thermodynamics
              </label>
              <div className="grid grid-cols-2 gap-1 mb-3">
                {(['none', 'vascular_ears', 'dorsal_plates', 'blubber'] as const).map((therm) => (
                  <div key={therm}
                    onClick={() => updateThermal({ type: therm })}
                    className={`tui-toggle-item text-[9px] py-1.5 flex items-center justify-center space-x-1 ${dna.modules.thermal.type === therm ? 'tui-toggle-item-active' : ''}`}>
                    {dna.modules.thermal.type === therm && <div className="w-1 h-1 rounded-full bg-emerald-400 mr-1" />}
                    <span>{therm.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
              {dna.modules.thermal.type !== 'none' && (
                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] text-slate-500 uppercase">Shunt Capacity</label>
                    <div className="flex items-center space-x-2">
                      <span className="px-1 bg-red-500/10 border border-red-500/30 text-[8px] text-red-400 rounded-px uppercase">Scale</span>
                      <span className="text-[10px] font-mono text-emerald-400">x{dna.modules.thermal.scale.toFixed(2)}</span>
                    </div>
                  </div>
                  <input type="range" min="0.1" max="3.0" step="0.1"
                    value={dna.modules.thermal.scale}
                    onChange={(e) => updateThermal({ scale: parseFloat(e.target.value) })}
                    className="tui-slider h-1" />
                </div>
              )}
              <p className="text-[8px] text-slate-600 mt-2 italic leading-tight">
                {dna.modules.thermal.type === 'vascular_ears' ? 'Regulated blood flow for rapid cooling.' :
                 dna.modules.thermal.type === 'dorsal_plates' ? 'Passive radiator surfaces. Ideal for high heat biomes.' :
                 dna.modules.thermal.type === 'blubber' ? 'Subcutaneous insulation for sub-zero survival.' :
                 'Standard metabolic thermoregulation.'}
              </p>
            </div>
          )}

          {/* Hydro-Dynamics */}
          <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
            <label className="tui-input-label mb-3 flex items-center">
              <Waves size={14} className="mr-2 text-emerald-400" />
              Hydro-Dynamics
            </label>
            <div className="grid grid-cols-2 gap-1 mb-3">
              {(['none', 'streamlining', 'lateral_line'] as const).map((hydro) => (
                <div key={hydro}
                  onClick={() => updateHydrodynamics({ type: hydro })}
                  className={`tui-toggle-item text-[9px] py-1.5 flex items-center justify-center space-x-1 ${dna.modules.hydrodynamics?.type === hydro ? 'tui-toggle-item-active' : ''}`}>
                  {dna.modules.hydrodynamics?.type === hydro && <div className="w-1 h-1 rounded-full bg-emerald-400 mr-1" />}
                  <span>{hydro.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
            {dna.modules.hydrodynamics?.type !== 'none' && (
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] text-slate-500 uppercase">Aero-Morph Scale</label>
                  <div className="flex items-center space-x-2">
                    <span className="px-1 bg-cyan-500/10 border border-cyan-500/30 text-[8px] text-cyan-400 rounded-px uppercase">Scale</span>
                    <span className="text-[10px] font-mono text-emerald-400">x{dna.modules.hydrodynamics?.scale.toFixed(2)}</span>
                  </div>
                </div>
                <input type="range" min="0.1" max="3.0" step="0.1"
                  value={dna.modules.hydrodynamics?.scale}
                  onChange={(e) => updateHydrodynamics({ scale: parseFloat(e.target.value) })}
                  className="tui-slider h-1 accent-cyan-500" />
              </div>
            )}
          </div>

          {/* Trophic */}
          <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
            <label className="tui-input-label mb-3 flex items-center">
              <Zap size={14} className="mr-2 text-emerald-400" />
              Energy Sourcing
            </label>
            <div className="grid grid-cols-2 gap-1 mb-3">
              {(['photoautotroph', 'photosynthesis', 'herbivore', 'carnivore', 'chemoautotroph'] as const).map((trophic) => (
                <div key={trophic}
                  onClick={() => updateTrophic({ type: trophic })}
                  className={`tui-toggle-item text-[9px] py-1.5 flex items-center justify-center space-x-2 transition-all ${dna.modules.trophic?.type === trophic ? 'tui-toggle-item-active ring-1 ring-emerald-400/50' : ''}`}>
                  <span className="opacity-50">
                    {trophic === 'photoautotroph' && <Wind size={10} />}
                    {trophic === 'photosynthesis' && <Wind size={10} />}
                    {trophic === 'herbivore' && <Component size={10} />}
                    {trophic === 'carnivore' && <Target size={10} />}
                    {trophic === 'chemoautotroph' && <FlaskConical size={10} />}
                  </span>
                  <span className="truncate">{trophic.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-end">
                <label className="text-[10px] text-slate-500 uppercase">Digestive Yield</label>
                <span className="text-[10px] font-mono text-emerald-400">x{(dna.modules.trophic?.efficiency || 0.5).toFixed(2)}</span>
              </div>
              <input type="range" min="0.1" max="1.0" step="0.05"
                value={dna.modules.trophic?.efficiency || 0.5}
                onChange={(e) => updateTrophic({ efficiency: parseFloat(e.target.value) })}
                className="tui-slider h-1" />
            </div>
          </div>

          {/* Neurology — locked to "none" for microbials */}
          <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
            <label className="tui-input-label mb-3 flex items-center">
              <Activity size={14} className="mr-2 text-emerald-400" />
              Neurological
              {isMicrobial && <LockedBadge />}
            </label>
            {isMicrobial ? (
              <div className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-[9px] text-emerald-400 font-bold uppercase">
                None — Prokaryotes lack nervous systems
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {(['primitive', 'standard', 'cephalized', 'complex'] as const).map((comp) => (
                  <div key={comp}
                    onClick={() => updateNervousSystem({ complexity: comp })}
                    className={`tui-toggle-item text-[9px] py-1.5 flex items-center justify-center space-x-1 ${dna.modules.nervousSystem?.complexity === comp ? 'tui-toggle-item-active' : ''}`}>
                    <span>{comp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sensory */}
          <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
            <label className="tui-input-label mb-3 flex items-center">
              <Eye size={14} className="mr-2 text-emerald-400" />
              Sensory Array
            </label>
            <div className="grid grid-cols-2 gap-1 mb-3">
              {(isMicrobial
                ? (['none', 'chemoreception'] as const)
                : (['none', 'vision', 'echolocation', 'thermal_sense', 'vibration_sense'] as const)
              ).map((sens) => (
                <div key={sens}
                  onClick={() => updateSensory({ type: sens })}
                  className={`tui-toggle-item text-[9px] py-1.5 flex items-center justify-center space-x-2 ${dna.modules.sensory?.type === sens ? 'tui-toggle-item-active' : ''}`}>
                  <span className="opacity-50">
                    {sens === 'vision' && <Eye size={10} />}
                    {sens === 'echolocation' && <Radio size={10} />}
                    {sens === 'thermal_sense' && <Thermometer size={10} />}
                    {sens === 'vibration_sense' && <Waves size={10} />}
                    {sens === 'chemoreception' && <FlaskConical size={10} />}
                  </span>
                  <span className="truncate">{sens.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
            {dna.modules.sensory?.type !== 'none' && (
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] text-slate-500 uppercase">
                    {dna.modules.sensory?.type === 'chemoreception' ? 'Chemotaxis Sensitivity' : 'Detection Acuity'}
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400">{(dna.modules.sensory?.acuity * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min="0.1" max="1.0" step="0.05"
                  value={dna.modules.sensory?.acuity || 0.5}
                  onChange={(e) => updateSensory({ acuity: parseFloat(e.target.value) })}
                  className="tui-slider h-1 accent-emerald-500" />
              </div>
            )}
            <p className="text-[8px] text-slate-600 mt-2 italic leading-tight">
              {dna.modules.sensory?.type === 'chemoreception' ? 'Chemical gradient tracking for nutrient location and threat avoidance.' :
               dna.modules.sensory?.type === 'vision' ? 'Light-spectrum processing. Most effective in AIR.' :
               dna.modules.sensory?.type === 'echolocation' ? 'Active sonar mapping. Dominant efficacy in WATER.' :
               dna.modules.sensory?.type === 'thermal_sense' ? 'Infrared detection. Useful for tracking metabolic heat.' :
               dna.modules.sensory?.type === 'vibration_sense' ? 'Seismic vibration mapping.' :
               'Zero perceptual capability beyond basic touch.'}
            </p>
          </div>

          {/* Chemical Tolerance */}
          <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
            <label className="tui-input-label mb-3 flex items-center">
              <FlaskConical size={14} className="mr-2 text-emerald-400" />
              Bio-Resistance
              {domain === 'bacteria' && (
                <span className="ml-2 px-1 bg-red-500/10 border border-red-500/30 rounded text-[7px] text-red-400 uppercase">Antibiotic risk</span>
              )}
              {domain === 'archaea' && (
                <span className="ml-2 px-1 bg-amber-500/10 border border-amber-500/30 rounded text-[7px] text-amber-400 uppercase">pH extremophile</span>
              )}
            </label>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] text-slate-500 uppercase">
                    {domain === 'bacteria' ? 'Antibiotic Resistance' : 'Toxicity Shielding'}
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400">{((dna.modules.chemicalTolerance?.toxicityResistance || 0.5) * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min="0.0" max="1.0" step="0.01"
                  value={dna.modules.chemicalTolerance?.toxicityResistance || 0.5}
                  onChange={(e) => updateChemicalTolerance({ toxicityResistance: parseFloat(e.target.value) })}
                  className="tui-slider h-1 accent-purple-500" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] text-slate-500 uppercase">
                    {domain === 'archaea' ? 'Extremophile pH Range' : 'pH Adaptation'}
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400">{((dna.modules.chemicalTolerance?.pHResistance || 0.5) * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min="0.0" max="1.0" step="0.01"
                  value={dna.modules.chemicalTolerance?.pHResistance || 0.5}
                  onChange={(e) => updateChemicalTolerance({ pHResistance: parseFloat(e.target.value) })}
                  className="tui-slider h-1 accent-purple-500" />
              </div>
            </div>
            <p className="text-[8px] text-slate-600 mt-2 italic leading-tight">
              {domain === 'archaea'
                ? 'For archaea, high pH resistance widens the extremophile bonus range.'
                : domain === 'bacteria'
                ? 'Toxicity resistance doubles as antibiotic resistance. Critical for bacterial survival.'
                : 'Metabolic reinforcement against systemic poisoning and acidic/alkaline environments.'}
            </p>
          </div>

          {/* Niche Positioning — hidden for microbials */}
          {!isMicrobial && (
            <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
              <label className="tui-input-label mb-3 flex items-center">
                <Target size={14} className="mr-2 text-emerald-400" />
                Niche Positioning
              </label>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase mb-2 block">Predator Status</label>
                  <div className="tui-toggle-group">
                    {(['none', 'mesopredator', 'apex'] as const).map((type) => (
                      <div key={type} onClick={() => onChange({ predatorType: type })}
                        className={`tui-toggle-item text-[8px] py-1 ${dna.predatorType === type ? 'tui-toggle-item-active' : ''}`}>
                        {type}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 uppercase mb-2 block">Foraging Strategy</label>
                  <div className="tui-toggle-group">
                    {(['generalist', 'specialist', 'opportunistic'] as const).map((type) => (
                      <div key={type} onClick={() => onChange({ preyType: type })}
                        className={`tui-toggle-item text-[8px] py-1 ${dna.preyType === type ? 'tui-toggle-item-active' : ''}`}>
                        {type}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Osmoregulation */}
          <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
            <label className="tui-input-label mb-3 flex items-center">
              <Waves size={14} className="mr-2 text-emerald-400" />
              Osmoregulation
            </label>
            <div className="space-y-1">
              <div className="flex justify-between items-end">
                <label className="text-[10px] text-slate-500 uppercase">Water Retention</label>
                <span className="text-[10px] font-mono text-emerald-400">{(dna.waterRetentionScale * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min="0.0" max="1.0" step="0.01"
                value={dna.waterRetentionScale}
                onChange={(e) => onChange({ waterRetentionScale: parseFloat(e.target.value) })}
                className="tui-slider h-1 accent-cyan-500" />
            </div>
          </div>

          {/* Reproduction */}
          <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
            <label className="tui-input-label mb-3 flex items-center">
              <History size={14} className="mr-2 text-emerald-400" />
              Reproduction
              {isMicrobial && <LockedBadge />}
            </label>
            {isMicrobial ? (
              <div className="px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-[9px] text-emerald-400 font-bold uppercase">
                Binary Fission — Rapid asexual division
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-1 mb-3">
                  {(['r_selection', 'K_selection', 'iteroparity', 'semelparity'] as const).map((strat) => (
                    <div key={strat}
                      onClick={() => updateReproduction({ strategy: strat })}
                      className={`tui-toggle-item text-[9px] py-1.5 flex items-center justify-center space-x-1 ${dna.modules.reproduction?.strategy === strat ? 'tui-toggle-item-active' : ''}`}>
                      <span>{strat.replace('_', '-')}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] text-slate-500 uppercase">Clutch Size</label>
                    <span className="text-[10px] font-mono text-emerald-400">{dna.modules.reproduction?.clutchSize || 10} units</span>
                  </div>
                  <input type="range" min="1"
                    max={dna.modules.reproduction?.strategy === 'K_selection' ? 10 : 1000}
                    step="1"
                    value={dna.modules.reproduction?.clutchSize || 10}
                    onChange={(e) => updateReproduction({ clutchSize: parseInt(e.target.value) })}
                    className="tui-slider h-1 accent-rose-500" />
                </div>
              </>
            )}
          </div>

          {/* Physiology */}
          <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
            <label className="tui-input-label mb-3 flex items-center">
              <Activity size={14} className="mr-2 text-emerald-400" />
              Physiology
            </label>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] text-slate-500 uppercase">BMR Multiplier</label>
                  <span className="text-[10px] font-mono text-emerald-400">x{dna.physiology.basalMetabolicRateMultiplier.toFixed(2)}</span>
                </div>
                <input type="range" min="0.5" max="2.0" step="0.05"
                  value={dna.physiology.basalMetabolicRateMultiplier}
                  onChange={(e) => onChange({ physiology: { ...dna.physiology, basalMetabolicRateMultiplier: parseFloat(e.target.value) } })}
                  className="tui-slider h-1 accent-emerald-500" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] text-slate-500 uppercase">Energy Storage</label>
                  <span className="text-[10px] font-mono text-emerald-400">{(dna.physiology.energyStorageCapacity * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min="0.1" max="1.0" step="0.05"
                  value={dna.physiology.energyStorageCapacity}
                  onChange={(e) => onChange({ physiology: { ...dna.physiology, energyStorageCapacity: parseFloat(e.target.value) } })}
                  className="tui-slider h-1 accent-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Structural Matrix */}
        <div className="pt-4 border-t border-slate-800/50">
          <label className="tui-input-label flex items-center">
            <Component size={10} className="mr-2 text-slate-400" />
            Structural Matrix
          </label>
          <div className="grid grid-cols-1 gap-1">
            {(isMicrobial
              ? (['peptidoglycan', 'archaeal_s_layer'] as const)
              : (['standard_bone', 'chitin', 'cartilage', 'exoskeleton', 'cartilage_matrix'] as const)
            ).map((mat) => (
              <div key={mat}
                onClick={() => onChange({ structuralMaterial: mat })}
                className={`px-2 py-1 text-[10px] uppercase border border-slate-800 cursor-pointer hover:bg-emerald-400/5 transition-colors flex items-center justify-between ${
                  dna.structuralMaterial === mat ? 'bg-emerald-400/20 border-emerald-400/40 text-emerald-400' : 'text-slate-500'
                }`}>
                <span>{mat.replace(/_/g, ' ')}</span>
                {dna.structuralMaterial === mat && <Check size={10} />}
              </div>
            ))}
          </div>
          <p className="text-[8px] text-slate-600 mt-1 italic">
            {dna.structuralMaterial === 'peptidoglycan' ? 'Bacterial cell wall. Flexible mesh; antibiotic target.' :
             dna.structuralMaterial === 'archaeal_s_layer' ? 'Protein-lattice surface layer. Heat-stable and chemically inert.' :
             ''}
          </p>
        </div>

        {/* Skeletal Density — hidden for microbials */}
        {!isMicrobial && (
          <SliderWithMutation label="Skeletal Density" value={dna.boneCrossSectionRatio}
            min={0.01} max={0.15} step={0.005}
            onChange={(v) => onChange({ boneCrossSectionRatio: v })}
            displayValue={`${(dna.boneCrossSectionRatio * 100).toFixed(1)}%`}
            mutationSpan={0.02} />
        )}

        {/* Mutation Probability */}
        <div className="pt-2">
          <div className="flex justify-between items-end mb-1">
            <label className="tui-input-label">Mutation Latency</label>
            <span className="text-xs text-amber-500">{(dna.mutationProbability * 100).toFixed(0)}% CHANCE</span>
          </div>
          <input type="range" min="0" max="1.0" step="0.01"
            value={dna.mutationProbability}
            onChange={(e) => onChange({ mutationProbability: parseFloat(e.target.value) })}
            className="tui-slider accent-amber-500" />
          <div className="text-[8px] text-slate-600 mt-1 uppercase">Probability of genetic drift per epoch sequence</div>
        </div>

        {/* DNA History */}
        {dnaHistory.length > 0 && (
          <div className="pt-4 border-t border-slate-800 mt-6">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between py-2 text-[10px] text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-widest font-black">
              <div className="flex items-center">
                <History size={12} className="mr-2" />
                Lineage Logs ({dnaHistory.length})
              </div>
              <ChevronDown size={12} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </button>
            {showHistory && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-1 mb-3">
                  {(['all', 'USER', 'MUTATION'] as const).map(f => (
                    <button key={f} onClick={() => setHistoryFilter(f)}
                      className={`text-[7px] px-2 py-0.5 border uppercase font-bold tracking-tighter transition-colors ${
                        historyFilter === f
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                          : 'border-slate-800 text-slate-600 hover:text-slate-400'
                      }`}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar border-l border-slate-800/50 ml-1 pl-2 space-y-2">
                  {filteredHistory.map((entry, idx) => (
                    <div key={idx} className="text-[9px] border-b border-slate-800/30 pb-1 last:border-0">
                      <div className="flex justify-between text-slate-500 mb-0.5">
                        <span className="font-bold">EPOCH {entry.epoch.toString().padStart(4, '0')}</span>
                        <span className={entry.changeType === 'MUTATION' ? 'text-amber-500' : 'text-blue-500'}>{entry.changeType}</span>
                      </div>
                      <div className="text-emerald-400/80 truncate">{entry.parameter.toUpperCase()}:</div>
                      <div className="flex items-center space-x-1 font-mono text-[8px]">
                        <span className="text-slate-600 decoration-slate-600 line-through">
                          {typeof entry.oldValue === 'number' && entry.oldValue < 1 ? entry.oldValue.toFixed(3) : entry.oldValue}
                        </span>
                        <span className="text-slate-500">→</span>
                        <span className="text-emerald-400 font-bold">
                          {typeof entry.newValue === 'number' && entry.newValue < 1 ? entry.newValue.toFixed(3) : entry.newValue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DNAModifier;
