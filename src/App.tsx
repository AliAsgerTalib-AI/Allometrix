import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Database, Zap, ShieldCheck, Terminal, FastForward, Info, AlertTriangle, Trophy } from 'lucide-react';
import { OrganismDNA, EcosystemState, SimulationResult, LogEntry, LogSeverity, DNAHistoryEntry, Milestone } from './types';
import { evaluateSurvival, DEFAULT_ECOSYSTEM } from './engine';
import DNAModifier from './components/DNAModifier';
import EnvironmentController from './components/EnvironmentController';
import EventLog from './components/EventLog';
import TelemetryDisplay from './components/TelemetryDisplay';
import CreatureVisualizer from './components/CreatureVisualizer';
import PresetManager from './components/PresetManager';
import MutationScrubber from './components/MutationScrubber';
import Tutorial from './components/Tutorial';
import HelpSystem from './components/HelpSystem';
import { ECOSYSTEM_EVENTS, EcosystemEvent } from './constants/ecosystemEvents';

type MutationResult = { dna: OrganismDNA; param: string; oldVal: any; newVal: any; msg: string };

function applyRandomMutation(dna: OrganismDNA): MutationResult | null {
  const domain = dna.domain ?? "eukaryota";
  const isMicrobial = domain === "bacteria" || domain === "archaea";
  const r = Math.random();

  // ── Numeric scalar mutations (0–0.78) ───────────────────────────────
  if (r < 0.09) {
    const oldVal = dna.totalMassKg;
    const rawNew = oldVal + (Math.random() - 0.5) * oldVal * 0.1;
    const newVal = isMicrobial
      ? Math.max(1e-15, Math.min(1e-6, rawNew))
      : Math.max(0.1, rawNew);
    return { dna: { ...dna, totalMassKg: newVal }, param: 'totalMassKg', oldVal, newVal, msg: `GENETIC DRIFT: Biomass ${oldVal.toFixed(1)}kg → ${newVal.toFixed(1)}kg` };
  } else if (r < 0.18) {
    const oldVal = dna.geometryFactor;
    const newVal = Math.max(1.0, Math.min(5.0, oldVal + (Math.random() - 0.5) * 0.2));
    return { dna: { ...dna, geometryFactor: newVal }, param: 'geometryFactor', oldVal, newVal, msg: `MORPHOLOGICAL SHIFT: Geometry ${oldVal.toFixed(2)} → ${newVal.toFixed(2)}` };
  } else if (r < 0.27) {
    const oldVal = dna.boneCrossSectionRatio;
    const newVal = Math.max(0.01, Math.min(0.15, oldVal + (Math.random() - 0.5) * 0.02));
    return { dna: { ...dna, boneCrossSectionRatio: newVal }, param: 'boneCrossSectionRatio', oldVal, newVal, msg: `SKELETAL MUTATION: Bone density ${(oldVal * 100).toFixed(1)}% → ${(newVal * 100).toFixed(1)}%` };
  } else if (r < 0.35) {
    const oldVal = dna.morphologyComplexity;
    const newVal = Math.max(0.0, Math.min(1.0, oldVal + (Math.random() - 0.5) * 0.15));
    return { dna: { ...dna, morphologyComplexity: newVal }, param: 'morphologyComplexity', oldVal, newVal, msg: `MORPHIC DRIFT: Complexity ${oldVal.toFixed(2)} → ${newVal.toFixed(2)}` };
  } else if (r < 0.43) {
    const oldVal = dna.waterRetentionScale;
    const newVal = Math.max(0.0, Math.min(1.0, oldVal + (Math.random() - 0.5) * 0.1));
    return { dna: { ...dna, waterRetentionScale: newVal }, param: 'waterRetentionScale', oldVal, newVal, msg: `OSMOTIC DRIFT: Retention ${oldVal.toFixed(2)} → ${newVal.toFixed(2)}` };
  } else if (r < 0.50) {
    const oldVal = dna.physiology.basalMetabolicRateMultiplier;
    const newVal = Math.max(0.5, Math.min(2.0, oldVal + (Math.random() - 0.5) * 0.15));
    return { dna: { ...dna, physiology: { ...dna.physiology, basalMetabolicRateMultiplier: newVal } }, param: 'basalMetabolicRateMultiplier', oldVal, newVal, msg: `METABOLIC SHIFT: BMR ×${oldVal.toFixed(2)} → ×${newVal.toFixed(2)}` };
  } else if (r < 0.57) {
    const oldVal = dna.physiology.energyStorageCapacity;
    const newVal = Math.max(0.1, Math.min(1.0, oldVal + (Math.random() - 0.5) * 0.1));
    return { dna: { ...dna, physiology: { ...dna.physiology, energyStorageCapacity: newVal } }, param: 'energyStorageCapacity', oldVal, newVal, msg: `STORAGE MUTATION: Capacity ${oldVal.toFixed(2)} → ${newVal.toFixed(2)}` };
  } else if (r < 0.64) {
    const oldVal = dna.modules.respiration.efficiency;
    const newVal = Math.max(0.1, Math.min(1.0, oldVal + (Math.random() - 0.5) * 0.1));
    return { dna: { ...dna, modules: { ...dna.modules, respiration: { ...dna.modules.respiration, efficiency: newVal } } }, param: 'RESPIRATION MODULE', oldVal, newVal, msg: `RESPIRATORY DRIFT: Efficiency ${oldVal.toFixed(2)} → ${newVal.toFixed(2)}` };
  } else if (r < 0.71) {
    const oldVal = dna.modules.trophic.efficiency;
    const newVal = Math.max(0.1, Math.min(1.0, oldVal + (Math.random() - 0.5) * 0.1));
    return { dna: { ...dna, modules: { ...dna.modules, trophic: { ...dna.modules.trophic, efficiency: newVal } } }, param: 'TROPHIC MODULE', oldVal, newVal, msg: `TROPHIC DRIFT: Efficiency ${oldVal.toFixed(2)} → ${newVal.toFixed(2)}` };
  } else if (r < 0.78) {
    const oldVal = dna.modules.chemicalTolerance.toxicityResistance;
    const newVal = Math.max(0.0, Math.min(1.0, oldVal + (Math.random() - 0.5) * 0.1));
    return { dna: { ...dna, modules: { ...dna.modules, chemicalTolerance: { ...dna.modules.chemicalTolerance, toxicityResistance: newVal } } }, param: 'CHEMICAL MODULE', oldVal, newVal, msg: `TOXIN RESISTANCE DRIFT: ${oldVal.toFixed(2)} → ${newVal.toFixed(2)}` };

  // ── Module type mutations (0.78–1.0) ────────────────────────────────
  } else if (r < 0.84) {
    if (isMicrobial) return null; // membrane_diffusion is locked for microbials
    const types = ['mammalian_lung', 'avian_lung', 'tracheae', 'gills'] as const;
    const oldVal = dna.modules.respiration.type;
    const options = types.filter(t => t !== oldVal);
    const newVal = options[Math.floor(Math.random() * options.length)];
    return { dna: { ...dna, modules: { ...dna.modules, respiration: { ...dna.modules.respiration, type: newVal } } }, param: 'RESPIRATION MODULE', oldVal, newVal, msg: `RESPIRATORY EVOLUTION: ${oldVal.toUpperCase()} → ${newVal.toUpperCase()}` };
  } else if (r < 0.89) {
    if (isMicrobial) return null; // no nervous system for prokaryotes
    const levels = ['primitive', 'standard', 'cephalized', 'complex'] as const;
    const oldVal = dna.modules.nervousSystem.complexity;
    const idx = levels.indexOf(oldVal as typeof levels[number]);
    const newIdx = Math.max(0, Math.min(levels.length - 1, idx + (Math.random() < 0.6 ? 1 : -1)));
    const newVal = levels[newIdx];
    if (oldVal === newVal) return null;
    return { dna: { ...dna, modules: { ...dna.modules, nervousSystem: { complexity: newVal } } }, param: 'NERVOUS MODULE', oldVal, newVal, msg: `NEURAL EVOLUTION: ${oldVal.toUpperCase()} → ${newVal.toUpperCase()}` };
  } else if (r < 0.94) {
    const types = ['none', 'vision', 'echolocation', 'thermal_sense', 'vibration_sense'] as const;
    const oldVal = dna.modules.sensory.type;
    const options = types.filter(t => t !== oldVal);
    const newVal = options[Math.floor(Math.random() * options.length)];
    return { dna: { ...dna, modules: { ...dna.modules, sensory: { ...dna.modules.sensory, type: newVal } } }, param: 'SENSORY MODULE', oldVal, newVal, msg: `SENSORY EVOLUTION: ${oldVal.toUpperCase()} → ${newVal.toUpperCase()}` };
  } else {
    const allTypes = ['photoautotroph', 'herbivore', 'carnivore', 'chemoautotroph'] as const;
    // Archaea strongly prefer chemoautotrophy — only allow it 80% of the time
    const types = domain === 'archaea' && Math.random() < 0.8
      ? (['chemoautotroph'] as const)
      : allTypes;
    const oldVal = dna.modules.trophic.type;
    const options = (types as readonly string[]).filter(t => t !== oldVal) as typeof allTypes[number][];
    if (options.length === 0) return null;
    const newVal = options[Math.floor(Math.random() * options.length)];
    return { dna: { ...dna, modules: { ...dna.modules, trophic: { ...dna.modules.trophic, type: newVal } } }, param: 'TROPHIC MODULE', oldVal, newVal, msg: `TROPHIC EVOLUTION: ${oldVal.toUpperCase()} → ${newVal.toUpperCase()}` };
  }
}

const INITIAL_DNA: OrganismDNA = {
  domain: "eukaryota",
  name: "SPECIMEN-01",
  totalMassKg: 0.001,
  environment: "LAND",
  geometryFactor: 1.0,
  morphologyComplexity: 0.1,
  structuralMaterial: "standard_bone",
  boneCrossSectionRatio: 0.08,
  waterRetentionScale: 0.6,
  predatorType: "none",
  preyType: "generalist",
  physiology: {
    basalMetabolicRateMultiplier: 1.0,
    energyStorageCapacity: 0.5,
  },
  modules: {
    respiration: { type: "mammalian_lung", efficiency: 1.0 },
    locomotion: { type: "none" },
    thermal: { type: "none", scale: 1.0 },
    trophic: { type: "herbivore", efficiency: 0.5 },
    nervousSystem: { complexity: "standard" },
    reproduction: { strategy: "r_selection", clutchSize: 10 },
    hydrodynamics: { type: "none", scale: 1.0 },
    sensory: { type: "none", acuity: 0.5 },
    chemicalTolerance: { toxicityResistance: 0.5, pHResistance: 0.5 },
  },
  mutationProbability: 0.1,
};

const INITIAL_ECOSYSTEM = DEFAULT_ECOSYSTEM;

const MILESTONES: Milestone[] = [
  { id: 'm1', name: 'Enter the Air', description: 'Survive in the AIR environment for the first time.', isUnlocked: false, type: 'ENVIRONMENT' },
  { id: 'm2', name: 'Deep Sea Dweller', description: 'Survive in WATER at 5G gravity equivalent.', isUnlocked: false, type: 'ENVIRONMENT' },
  { id: 'm3', name: 'Apex Intelligence', description: 'Survive with COMPLEX neurological structure.', isUnlocked: false, type: 'COMPLEXITY' },
  { id: 'm4', name: 'Titan Class', description: 'Survive with a total biomass exceeding 5,000kg.', isUnlocked: false, type: 'BIOMECHANICS' },
  { id: 'm5', name: 'Toxic Resistance', description: 'Survive in an environment with > 50% toxicity.', isUnlocked: false, type: 'ENVIRONMENT' },
  { id: 'm6', name: 'Microbial Survivor', description: 'Survive as a Bacteria or Archaea organism.', isUnlocked: false, type: 'DOMAIN' },
  { id: 'm7', name: 'Extremophile', description: 'Survive as Archaea in pH below 3 or above 11.', isUnlocked: false, type: 'DOMAIN' },
  { id: 'm8', name: 'Domain Crosser', description: 'Unlock Bacteria, Archaea, and Eukaryota milestones.', isUnlocked: false, type: 'DOMAIN' },
];

export default function App() {
  const [dna, setDna] = useState<OrganismDNA>(INITIAL_DNA);
  const [ecosystem, setEcosystem] = useState<EcosystemState>(INITIAL_ECOSYSTEM);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date().toLocaleTimeString([], { hour12: false }), text: "SYSTEM BOOT COMPLETE", severity: 'success' },
    { id: '2', timestamp: new Date().toLocaleTimeString([], { hour12: false }), text: "KERNEL V7.0-BETA INITIALIZED", severity: 'info' },
    { id: '3', timestamp: new Date().toLocaleTimeString([], { hour12: false }), text: "WAITING FOR INPUT...", severity: 'info' }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [epoch, setEpoch] = useState(1);
  const [dnaHistory, setDnaHistory] = useState<DNAHistoryEntry[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>(MILESTONES);
  const [activeEvent, setActiveEvent] = useState<EcosystemEvent | null>(null);
  const [history, setHistory] = useState<{ epoch: number; metabolicRate: number; skeletalStress: number; oxygenSupply: number; fitnessScore: number; viabilityScore: number; failureModes: string[] }[]>([]);
  const [dnaSnapshots, setDnaSnapshots] = useState<{ epoch: number; dna: OrganismDNA; hasMutation: boolean }[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);

  const dnaRef = useRef(dna);
  useEffect(() => { dnaRef.current = dna; }, [dna]);
  const mutationThisEpoch = useRef(false);

  const addLog = useCallback((text: string, severity: LogSeverity = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(2, 9),
      timestamp,
      text,
      severity
    }].slice(-50));
  }, []);

  const addHistory = useCallback((parameter: string, oldValue: any, newValue: any, type: 'USER' | 'MUTATION') => {
    if (oldValue === newValue) return;
    setDnaHistory(prev => [{
      epoch,
      parameter,
      oldValue,
      newValue,
      changeType: type
    }, ...prev].slice(0, 50));
  }, [epoch]);

  const result = useMemo(() => evaluateSurvival(dna, ecosystem), [dna, ecosystem]);

  useEffect(() => {
    setHistory(prev => [...prev, {
      epoch,
      metabolicRate: result.telemetry.metabolicRateWatts,
      skeletalStress: result.telemetry.skeletalStressPascals / 1000,
      oxygenSupply: result.telemetry.oxygenSupplyRate,
      fitnessScore: result.telemetry.fitnessScore,
      viabilityScore: result.telemetry.viabilityScore,
      failureModes: result.failureModes,
    }].slice(-20));

    setDnaSnapshots(prev => [...prev, {
      epoch,
      dna: { ...dnaRef.current },
      hasMutation: mutationThisEpoch.current,
    }].slice(-30));
    mutationThisEpoch.current = false;
  }, [epoch]);

  const failureModeKey = result.failureModes.join(',');

  useEffect(() => {
    if (!result.isViable) {
      if (Math.random() < 0.18) {
        const mode = result.failureModes[Math.floor(Math.random() * result.failureModes.length)];
        addLog(`EXTINCTION THREAT: ${mode.replace(/_/g, ' ')}`, 'critical');
      }
    } else {
      addLog(`BIOMETRIC EQUILIBRIUM MAINTAINED`, 'success');
    }
  }, [result.isViable, failureModeKey, addLog]);

  useEffect(() => {
    if (!result.isViable) return;
    setMilestones(prev => {
      let changed = false;
      const next = prev.map(m => {
        if (m.isUnlocked) return m;
        let unlocked = false;
        if (m.id === 'm1' && dna.environment === 'AIR') unlocked = true;
        if (m.id === 'm2' && dna.environment === 'WATER' && ecosystem.gravityMultiplier >= 5) unlocked = true;
        if (m.id === 'm3' && dna.modules.nervousSystem.complexity === 'complex') unlocked = true;
        if (m.id === 'm4' && dna.totalMassKg > 5000) unlocked = true;
        if (m.id === 'm5' && ecosystem.toxins > 0.5) unlocked = true;
        if (m.id === 'm6' && (dna.domain === 'bacteria' || dna.domain === 'archaea')) unlocked = true;
        if (m.id === 'm7' && dna.domain === 'archaea' && (ecosystem.pHLevel < 3 || ecosystem.pHLevel > 11)) unlocked = true;
        if (m.id === 'm8') {
          const ids = prev.map(x => x.id);
          const m6 = prev.find(x => x.id === 'm6');
          const m7 = prev.find(x => x.id === 'm7');
          const hasEuk = dna.domain === 'eukaryota' || (dna.domain ?? 'eukaryota') === 'eukaryota';
          if (m6?.isUnlocked && m7?.isUnlocked && hasEuk) unlocked = true;
          void ids;
        }
        if (unlocked) {
          addLog(`ACHIEVEMENT UNLOCKED: ${m.name.toUpperCase()}`, 'success');
          changed = true;
          return { ...m, isUnlocked: true, timestamp: Date.now() };
        }
        return m;
      });
      return changed ? next : prev;
    });
  }, [result.isViable, dna.environment, dna.totalMassKg, dna.modules.nervousSystem.complexity, ecosystem.gravityMultiplier, ecosystem.toxins, dna.domain, ecosystem.pHLevel, addLog]);

  useEffect(() => {
    if (ecosystem.eventFrequency <= 0) return;

    const triggerEvent = () => {
      if (Math.random() < ecosystem.eventFrequency) {
        const event = ECOSYSTEM_EVENTS[Math.floor(Math.random() * ECOSYSTEM_EVENTS.length)];
        setActiveEvent(event);
        setEcosystem(prev => ({
          ...event.apply(prev),
          eventFrequency: prev.eventFrequency // Preserve simulation setting
        }));
        
        const logSeverity: LogSeverity = event.severity === 'CRITICAL' ? 'critical' : event.severity === 'HIGH' ? 'critical' : event.severity === 'MEDIUM' ? 'warning' : 'info';

        addLog(`ALARM: ${event.name} DETECTED`, logSeverity);
        addLog(`${event.description}`, 'info');
        addLog(`SPECIMEN MUST ADAPT DNA TO SURVIVE`, 'info');

        if (event.mutationSurge) {
          const mut = applyRandomMutation(dnaRef.current);
          if (mut) {
            mutationThisEpoch.current = true;
            addLog(`RADIATION MUTATION: ${mut.msg}`, 'critical');
            setDna(mut.dna);
          }
        }

        // Clear the alert after 8 seconds
        setTimeout(() => setActiveEvent(null), 8000);
      }
    };

    const intervalTime = 15000 + (Math.random() * 15000); // 15–30s jitter
    const interval = setInterval(triggerEvent, intervalTime);
    return () => clearInterval(interval);
  }, [ecosystem.eventFrequency]);

  const handleDnaChange = useCallback((updates: Partial<OrganismDNA>) => {
    const entry = Object.entries(updates)[0];
    if (entry) {
      const [key, newVal] = entry;
      let paramName = key;
      let oldVal = (dna as any)[key];
      if (key === 'modules' && typeof newVal === 'object' && newVal !== null) {
        const moduleKey = Object.keys(updates.modules || {})[0];
        if (moduleKey) {
          paramName = `${moduleKey.toUpperCase()} MODULE`;
          oldVal = (dna.modules as any)[moduleKey]?.type || 'none';
          const currentNewVal = (newVal as any)[moduleKey];
          const newValValue = typeof currentNewVal === 'object' ? currentNewVal.type : currentNewVal;
          addHistory(paramName, oldVal, newValValue, 'USER');
        }
      } else {
        addHistory(paramName, oldVal, newVal, 'USER');
      }
    }
    setDna(prev => ({ ...prev, ...updates }));
  }, [dna, addHistory]);

  const handleSave = () => {
    setIsSaving(true);
    addLog("ARCHIVING DNA SEQUENCE...", 'info');
    setTimeout(() => {
      setIsSaving(false);
      addLog(`SEQUENCE [${dna.name}] SAVED TO VAULT`, 'success');
    }, 2000);
  };

  const advanceEpoch = () => {
    const newEpoch = epoch + 1;
    setEpoch(newEpoch);

    // 30% chance of a major event on manual advance
    let triggeredEvent: EcosystemEvent | null = null;
    if (Math.random() < 0.3) {
      const event = ECOSYSTEM_EVENTS[Math.floor(Math.random() * ECOSYSTEM_EVENTS.length)];
      triggeredEvent = event;
      setActiveEvent(event);
      setEcosystem(prev => event.apply(prev));
      addLog(`ENTERING EPOCH ${newEpoch}`, 'info');
      addLog(`CRITICAL ANOMALY: ${event.name}`, 'warning');
      addLog(`${event.description}`, 'info');
      setTimeout(() => setActiveEvent(null), 8000);
    } else {
      const tempShift = (Math.random() - 0.5) * 10;
      const o2Shift = (Math.random() - 0.5) * 3;
      setEcosystem(prev => ({
        ...prev,
        ambientTemperatureCelsius: Math.round(Math.max(-100, Math.min(200, prev.ambientTemperatureCelsius + tempShift))),
        oxygenPercentage: Math.round(Math.max(1, Math.min(100, prev.oxygenPercentage + o2Shift))),
      }));
      addLog(`ENTERING EPOCH ${newEpoch}`, 'info');
      addLog(`AMBIENT TEMP: ${tempShift > 0 ? '+' : ''}${tempShift.toFixed(1)}°C`, 'info');
      addLog(`ATMOSPHERIC O2: ${o2Shift > 0 ? '+' : ''}${o2Shift.toFixed(1)}%`, 'info');
    }

    // DNA mutation — normal probability or forced by radiation surge
    const forceMutation = triggeredEvent?.mutationSurge && Math.random() < 0.85;
    if (forceMutation || Math.random() < dna.mutationProbability) {
      const mut = applyRandomMutation(dna);
      if (mut) {
        mutationThisEpoch.current = true;
        const severity = forceMutation ? 'critical' : 'warning';
        addLog(forceMutation ? `RADIATION MUTATION: ${mut.msg}` : `GENETIC MUTATION: ${mut.msg}`, severity);
        addHistory(mut.param, mut.oldVal, mut.newVal, 'MUTATION');
        setDna(mut.dna);
      }
    }
  };

  return (
    <motion.div 
      className="h-screen w-screen bg-slate-950 text-emerald-400 font-mono flex flex-col overflow-hidden selection:bg-emerald-400 selection:text-slate-950"
      animate={{
        backgroundColor: ecosystem.toxins > 0.4 ? "#051005" : ecosystem.ambientTemperatureCelsius > 45 ? "#120505" : "#020617",
      }}
      transition={{ duration: 1.5 }}
    >
      
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950 relative z-10 shrink-0">
        <div className="flex items-center space-x-6">
          <div className="w-10 h-10 flex items-center justify-center bg-emerald-400 text-slate-950 rounded-lg">
            <Zap size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none italic uppercase">
              ALLOMETRIX
            </h1>
            <p className="text-[9px] text-emerald-400/50 tracking-[0.2em] font-medium uppercase mt-1">Evolutionary Simulation Engine</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-full flex items-center space-x-3">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Epoch</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={epoch}
                className="text-xs font-bold tracking-widest"
                initial={{ scale: 1.3, color: '#ffffff', opacity: 0.6 }}
                animate={{ scale: 1, color: '#34d399', opacity: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                {epoch.toString().padStart(4, '0')}
              </motion.span>
            </AnimatePresence>
          </div>
          
          <button 
            onClick={() => setHelpOpen(true)}
            className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-lg text-slate-500 hover:text-emerald-400 hover:border-emerald-400/50 transition-all"
          >
            <Info size={18} />
          </button>
          
          <button 
            onClick={advanceEpoch}
            className="tui-button flex items-center space-x-2"
          >
            <FastForward size={14} className="fill-current" />
            <span>Next Generation</span>
          </button>
          <div className="hidden lg:flex items-center space-x-6 text-[10px] text-emerald-400/40 font-semibold">
            <div className="flex items-center">
              <Database size={10} className="mr-2" />
              <span>SYNC: ALIGNED</span>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`tui-button-secondary ${isSaving ? 'opacity-50' : ''}`}
          >
            {isSaving ? "SYNCING..." : "Archive"}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-[340px_1fr_340px] lg:grid-cols-[400px_1fr_400px] min-h-0 relative z-10 transition-all">
        
        {/* Left Panel: DNA Modifier */}
        <section className={`tui-panel border-r border-slate-800 md:flex flex-col hidden space-y-8 transition-colors duration-500 ${activeEvent ? 'ring-1 ring-red-500/50 bg-red-950/5' : ''}`}>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
            <DNAModifier
              dna={dna}
              dnaHistory={dnaHistory}
              onChange={handleDnaChange}
            />
            {dnaSnapshots.length > 0 && (
              <div className="border-t border-slate-800 pt-8">
                <MutationScrubber
                  snapshots={dnaSnapshots}
                  currentEpoch={epoch}
                  onRestore={(restoredDna) => {
                    setDna(restoredDna);
                    addLog(`LINEAGE RESTORE: Snapshot from Epoch ${epoch} applied`, 'success');
                  }}
                />
              </div>
            )}
          </div>
          <div className="pt-8 border-t border-slate-800">
            <PresetManager
              currentDna={dna}
              currentEcosystem={ecosystem}
              onLoad={(newDna, newEcosystem) => {
                setDna(newDna);
                setEcosystem(newEcosystem);
              }}
              onLog={addLog}
            />
          </div>
        </section>

        {/* Center Panel: Environment & Logs */}
        <section className="flex flex-col min-h-0 bg-slate-900/10">
          <div className="p-6 border-b border-slate-800">
            <EnvironmentController 
              ecosystem={ecosystem} 
              onChange={(updates) => setEcosystem(prev => ({ ...prev, ...updates }))} 
            />
          </div>
          
          <div className="flex-1 p-6 flex flex-col min-h-0 relative">
             <AnimatePresence>
               {activeEvent && (
                 <motion.div
                   initial={{ opacity: 0, y: -20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="absolute top-4 left-4 right-4 z-50 bg-red-950/90 border border-red-500 p-3 shadow-[0_0_30px_rgba(239,68,68,0.2)] flex items-start space-x-3 backdrop-blur-md"
                 >
                   <AlertTriangle className="text-red-500 shrink-0 mt-1 animate-pulse" size={18} />
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-center mb-1">
                       <span className="text-[10px] font-black text-red-500 tracking-[0.2em]">EMERGENCY: {activeEvent.severity}</span>
                       <span className="text-[8px] text-red-400 font-mono">STATUS: ACTIVE</span>
                     </div>
                     <h4 className="text-xs font-black text-white uppercase mb-1">{activeEvent.name}</h4>
                     <p className="text-[10px] text-red-200/80 leading-tight font-mono">{activeEvent.description}</p>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>

              <div className="mb-6 shrink-0">
                <CreatureVisualizer 
                  dna={dna} 
                  isViable={result.isViable} 
                  telemetry={result.telemetry} 
                  ecosystem={ecosystem}
                />
              </div>

             <EventLog logs={logs} onClear={() => setLogs([])} />
          </div>
        </section>

        {/* Right Panel: Telemetry & Milestones */}
        <section className={`tui-panel md:flex flex-col hidden overflow-hidden border-l transition-colors duration-700 ${result.isViable ? 'border-slate-800' : 'border-red-500/25'}`} style={result.isViable ? {} : { boxShadow: '-4px 0 20px rgba(239,68,68,0.06)' }}>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <TelemetryDisplay result={result} history={history} dna={dna} ecosystem={ecosystem} />
          </div>
          
          {/* Milestones Section */}
          <div className="pt-6 border-t border-slate-800 mt-4 bg-slate-950 shrink-0">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold text-emerald-400/60 tracking-[0.1em] flex items-center">
                  <Trophy size={14} className="mr-2 text-emerald-400" />
                  ACHIEVEMENTS
                </h3>
                <span className="text-[10px] bg-emerald-400/10 px-2 py-0.5 rounded-full text-emerald-400 border border-emerald-400/20 font-bold">
                  {milestones.filter(m => m.isUnlocked).length}/{milestones.length}
                </span>
             </div>
             
             <div className="overflow-x-auto custom-scrollbar pb-2">
               <div className="grid grid-rows-2 grid-flow-col gap-3 min-w-max pr-8">
                  {milestones.map(m => (
                    <div 
                      key={m.id} 
                      className={`p-3 rounded-xl border transition-all duration-300 w-[240px] snap-start ${m.isUnlocked ? 'bg-emerald-400/5 border-emerald-400/30' : 'bg-slate-900 border-slate-800 opacity-40'}`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                         <span className={`text-[10px] font-bold tracking-tight uppercase ${m.isUnlocked ? 'text-emerald-400' : 'text-slate-600'}`}>
                          {m.name}
                        </span>
                        {m.isUnlocked && <ShieldCheck size={12} className="text-emerald-400" />}
                      </div>
                      <p className="text-[9px] text-slate-500 leading-tight uppercase line-clamp-2">
                        {m.description}
                      </p>
                    </div>
                  ))}
               </div>
             </div>
          </div>
        </section>

        {/* Mobile View Toggles (Simplified for mobile) */}
        <div className="md:hidden p-4 space-y-8 overflow-y-auto min-h-0 relative z-10">
          <DNAModifier
            dna={dna}
            dnaHistory={dnaHistory}
            onChange={handleDnaChange}
          />
          <div className="pt-8 border-t border-white/5">
            <PresetManager 
              currentDna={dna}
              currentEcosystem={ecosystem}
              onLoad={(newDna, newEcosystem) => {
                setDna(newDna);
                setEcosystem(newEcosystem);
              }}
              onLog={addLog}
            />
          </div>
          <TelemetryDisplay result={result} history={history} dna={dna} ecosystem={ecosystem} />
        </div>
      </main>

      {/* Footer Info */}
      <footer className="h-10 border-t border-slate-800 flex items-center justify-between px-8 bg-slate-950 text-[10px] text-slate-500 font-medium shrink-0">
        <div className="flex space-x-8 items-center">
          <div className="flex items-center space-x-2">
             <Info size={12} />
             <span>LAT: 45.42° N</span>
          </div>
          <span className="text-emerald-400 font-bold tracking-widest flex items-center">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 animate-pulse" />
            LIVE SIMULATION
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Terminal size={14} className="text-emerald-400" />
          <span className="uppercase tracking-widest text-[9px]">Allometrix BioOS v2.4</span>
        </div>
      </footer>
      
      <Tutorial />
      <HelpSystem isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </motion.div>
  );
}
