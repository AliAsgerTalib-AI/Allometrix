import React, { useState, useMemo } from 'react';
import { SimulationResult, OrganismDNA, EcosystemState } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, AlertCircle, Wrench } from 'lucide-react';

interface EpochHistory {
  epoch: number;
  metabolicRate: number;
  skeletalStress: number;
  oxygenSupply: number;
  fitnessScore: number;
  viabilityScore: number;
  failureModes: string[];
}

interface TelemetryDisplayProps {
  result: SimulationResult;
  history: EpochHistory[];
  dna: OrganismDNA;
  ecosystem: EcosystemState;
}

const FAILURE_DIAGNOSTICS: Record<string, { driver: string; fix: string }> = {
  STRUCTURAL_SKELETAL_COLLAPSE:              { driver: 'Gravitational load exceeds material strength limit', fix: 'Increase bone ratio, switch to standard_bone, or reduce mass' },
  METABOLIC_STARVATION_DEFICIT:             { driver: 'Energy intake cannot cover total metabolic demand', fix: 'Boost trophic efficiency, reduce mass, or add sensory intake bonus' },
  LETHAL_THERMAL_RETENTION:                 { driver: 'Heat generation exceeds surface dissipation capacity', fix: 'Add dorsal plates or ears, lower mass, or move to AIR environment' },
  LETHAL_THERMAL_DISSIPATION_FREEZE:        { driver: 'Heat loss rate far exceeds generation — organism freezes', fix: 'Add blubber, increase mass, or raise metabolic rate multiplier' },
  SYSTEMIC_TISSUE_ANOXIA:                   { driver: 'Oxygen demand exceeds what the respiratory module can supply', fix: 'Improve respiration efficiency, raise ambient O2, or reduce metabolism' },
  NEUROLOGICAL_OVERLOAD:                    { driver: 'Neurological + sensory cost exceeds 50% of total metabolism', fix: 'Reduce brain complexity or lower sensory acuity' },
  GILL_FILAMENT_DESICCATION_FAILURE:        { driver: 'Gills require WATER environment to remain functional', fix: 'Switch to mammalian/avian lung, or move organism to WATER' },
  TRACHEAL_DIFFUSION_LIMIT_BREACHED_ANOXIC_CHOICE: { driver: 'Tracheae cannot supply O2 to organisms above ~2 kg', fix: 'Switch to mammalian lung, or reduce total mass below 2 kg' },
  FLIGHT_WING_LOADING_MAXIMUM_BREACHED:     { driver: 'Wing area too small relative to body mass — no lift possible', fix: 'Increase wing area or reduce total mass' },
  AERODYNAMIC_MASS_LIMIT_EXCEEDED:          { driver: 'Biological wings cannot sustain flight above 40 kg', fix: 'Reduce mass below 40 kg to achieve flight' },
  PREDATION_EXTERMINATION_RISK_CAP:         { driver: 'Predation risk > 80% — population cannot sustain itself', fix: 'Upgrade brain complexity, add sensory module, or become apex predator' },
  REPRODUCTIVE_VIABILITY_LOST:              { driver: 'Surplus energy too low to afford reproduction cost', fix: 'Increase energy intake surplus, or switch to r_selection strategy' },
  HYDRATION_OSMOTIC_CRITICAL_FAILURE:       { driver: 'Water loss rate exceeds retention capacity', fix: 'Increase waterRetentionScale or reduce surface-area-to-mass ratio' },
  SALINITY_IMBALANCE:                       { driver: 'Low water retention in aquatic environment causes osmotic crisis', fix: 'Increase waterRetentionScale above 0.4 for aquatic survival' },
  SYSTEMIC_TOXIC_OVERLOAD:                  { driver: 'Environmental toxin level exceeds chemical resistance threshold', fix: 'Increase toxicityResistance or reduce ecosystem toxin level' },
  FATAL_CHEMICAL_POISONING:                 { driver: 'Extreme toxicity — lethal chemical saturation', fix: 'Maximise toxicityResistance or drastically detoxify the environment' },
  METABOLIC_ACIDOSIS:                       { driver: 'Acidic pH exceeds organism tolerance — internal acidosis', fix: 'Increase pHResistance or raise ecosystem pH toward neutral 7.0' },
  METABOLIC_ALKALOSIS:                      { driver: 'Alkaline pH exceeds organism tolerance — internal alkalosis', fix: 'Increase pHResistance or lower ecosystem pH toward neutral 7.0' },
  NUTRIENT_LIMIT_EXCEEDED_STUNTED_GROWTH:   { driver: 'Organism mass exceeds what ecosystem nutrients can sustain', fix: 'Reduce mass or increase nutrient availability' },
  ENERGY_DEPLETION:                         { driver: 'Energy reserves critically low — starvation imminent', fix: 'Improve trophic efficiency or reduce metabolic overhead' },
  FATAL_METABOLIC_COLLAPSE:                 { driver: 'Energy reserves at terminal zero — complete metabolic failure', fix: 'Immediately switch trophic type or increase energy intake drastically' },
};

const TelemetryDisplay: React.FC<TelemetryDisplayProps> = ({ result, history, dna, ecosystem }) => {
  const { telemetry, isViable, failureModes } = result;
  const [chartTab, setChartTab] = useState<'METRICS' | 'VIABILITY' | 'FAILURES'>('METRICS');

  const failureFrequency = useMemo(() => {
    const freq: Record<string, number> = {};
    history.forEach(h => h.failureModes.forEach(m => { freq[m] = (freq[m] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [history]);

  const MetricBlock = ({ label, value, unit, warning = false, subValue, subValueWarning = false }: {
    label: string; value: string | number; unit: string; warning?: boolean; subValue?: string; subValueWarning?: boolean;
  }) => (
    <div className={`bg-slate-900 border p-3 rounded-xl transition-all duration-300 ${warning ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'}`}>
      <div className="text-[9px] font-bold uppercase text-slate-500 mb-1.5 tracking-widest">{label}</div>
      <div className={`text-sm font-bold tracking-tight ${warning ? 'text-red-500' : 'text-emerald-400'}`}>
        {typeof value === 'number' && !isNaN(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
        <span className="text-[10px] ml-1 opacity-40 font-medium">{unit}</span>
      </div>
      {subValue && (
        <div className={`text-[9px] mt-1.5 font-medium leading-tight ${subValueWarning ? 'text-red-400' : 'text-slate-600'}`}>
          {subValue}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-6 font-mono">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-[11px] font-bold tracking-[0.2em] text-emerald-400 uppercase">Live Biometric Feed</h2>
      </div>

      {/* Specimen Classification */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900/50 border border-slate-800 p-2 rounded-lg flex flex-col items-center justify-center text-center">
          <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Mass Class</span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest whitespace-nowrap">
            {dna.totalMassKg < 1 ? 'Micro' : dna.totalMassKg < 50 ? 'Small' : dna.totalMassKg < 500 ? 'Medium' : dna.totalMassKg < 5000 ? 'Large' : 'Mega'}
          </span>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-2 rounded-lg flex flex-col items-center justify-center text-center">
          <span className="text-[7px] text-slate-500 uppercase font-black mb-1">Trophic Tier</span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest whitespace-nowrap">
            {dna.modules.trophic.type === 'carnivore' ? 'Tier 2' : dna.modules.trophic.type === 'herbivore' ? 'Tier 1' : 'Base'}
          </span>
        </div>
      </div>

      {/* Energy Reserves Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
          <span className="text-slate-500">Energy Reserves</span>
          <span className={`tracking-widest ${telemetry.energyReserves < 20 ? 'text-red-500' : 'text-emerald-400'}`}>
            {(telemetry.energyReserves || 0).toFixed(1)}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${telemetry.energyReserves < 20 ? 'bg-red-500' : 'bg-emerald-400'}`}
            initial={{ width: 0 }}
            animate={{ width: `${telemetry.energyReserves}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-1">

        {/* Tabbed Chart */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Temporal Performance</div>
            <div className="flex space-x-1">
              {(['METRICS', 'VIABILITY', 'FAILURES'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setChartTab(tab)}
                  className={`text-[8px] font-bold px-2 py-0.5 rounded transition-colors uppercase tracking-widest ${chartTab === tab ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {chartTab === 'METRICS' && (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="epoch" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: '10px', borderRadius: '8px' }} itemStyle={{ padding: '2px 0' }} />
                  <Line type="monotone" dataKey="metabolicRate" stroke="#34d399" dot={false} strokeWidth={2} name="Metabolic" />
                  <Line type="monotone" dataKey="skeletalStress" stroke="#94a3b8" dot={false} strokeWidth={2} name="Stress" />
                  <Line type="monotone" dataKey="oxygenSupply" stroke="#3b82f6" dot={false} strokeWidth={1} name="O2 Supply" strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartTab === 'VIABILITY' && (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="epoch" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', fontSize: '10px', borderRadius: '8px' }} itemStyle={{ padding: '2px 0' }} />
                  <Line type="monotone" dataKey="viabilityScore" stroke="#34d399" dot={false} strokeWidth={2} name="Viability %" />
                  <Line type="monotone" dataKey="failureCount" stroke="#f87171" dot={false} strokeWidth={1.5} name="Failures" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {chartTab === 'FAILURES' && (
            <div className="h-36 flex flex-col justify-center space-y-1.5 overflow-hidden">
              {failureFrequency.length === 0 ? (
                <div className="text-[9px] text-slate-600 text-center font-bold uppercase tracking-widest">No failures recorded</div>
              ) : (
                failureFrequency.map(([mode, count]) => {
                  const pct = history.length > 0 ? (count / history.length) * 100 : 0;
                  return (
                    <div key={mode} className="space-y-0.5">
                      <div className="flex justify-between text-[8px] font-bold">
                        <span className="text-slate-500 truncate pr-2">{mode.replace(/_/g, ' ').slice(0, 30)}</span>
                        <span className="text-red-400 shrink-0">{count}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* System Diagnostics — shown when failures exist */}
        {failureModes.length > 0 && (
          <section className="space-y-3">
            <div className="text-[10px] font-bold text-red-400/80 tracking-widest uppercase flex items-center px-2">
              <AlertCircle size={10} className="mr-2 text-red-400" />
              System Diagnostics
            </div>
            <div className="space-y-2">
              {failureModes.slice(0, 3).map((mode) => {
                const diag = FAILURE_DIAGNOSTICS[mode];
                return (
                  <div key={mode} className="bg-red-950/30 border border-red-500/20 p-3 rounded-xl space-y-1.5">
                    <div className="text-[8px] font-black text-red-400 uppercase tracking-tight">
                      {mode.replace(/_/g, ' ')}
                    </div>
                    {diag ? (
                      <>
                        <div className="text-[9px] text-slate-400 leading-tight">
                          <span className="text-slate-600 font-bold">Cause: </span>{diag.driver}
                        </div>
                        <div className="flex items-start space-x-1 text-[9px] text-emerald-400/70 leading-tight">
                          <Wrench size={9} className="shrink-0 mt-px" />
                          <span>{diag.fix}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-[9px] text-slate-500">No diagnostic available for this failure mode.</div>
                    )}
                  </div>
                );
              })}
              {failureModes.length > 3 && (
                <div className="text-[8px] text-red-400/50 text-center font-bold uppercase tracking-widest">
                  +{failureModes.length - 3} additional critical failures
                </div>
              )}
            </div>
          </section>
        )}

        {/* Thermodynamics Section */}
        <section className="space-y-3">
          <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase flex items-center px-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3" />
            Thermodynamics
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricBlock label="Thermal Load" value={telemetry.heatGeneratedWatts} unit="W" />
            <MetricBlock
              label="Efficiency"
              value={telemetry.maxHeatDissipationWatts}
              unit="W"
              warning={telemetry.heatGeneratedWatts > telemetry.maxHeatDissipationWatts}
            />
          </div>
        </section>

        {/* Structural Integrity Section */}
        <section className="space-y-3">
          <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase flex items-center px-2">
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-3" />
            Structural
          </div>
          <div className="grid grid-cols-1 gap-3">
            <MetricBlock
              label="Skeletal Stress"
              value={(telemetry.skeletalStressPascals / 1000).toFixed(2)}
              unit="kPa"
              warning={telemetry.skeletalStressPascals > telemetry.skeletalLimitPascals}
              subValue={`Limit: ${(telemetry.skeletalLimitPascals / 1000).toLocaleString()} kPa`}
            />
          </div>
        </section>

        {/* ECO-SYSTEMIC Section */}
        <section className="space-y-3">
          <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase flex items-center px-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3" />
            Systems Equilibrium
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricBlock label="Energy In" value={telemetry.energyIntakeWatts} unit="W" warning={telemetry.energyIntakeWatts < telemetry.metabolicRateWatts} />
            <MetricBlock label="Hydration" value={telemetry.hydrationStability} unit="%" warning={telemetry.hydrationStability < 50} />
            <MetricBlock label="Neuro Tax" value={telemetry.neurologicalCostWatts} unit="W" />
            <MetricBlock
              label="Predation Risk"
              value={telemetry.predationRisk}
              unit="%"
              warning={telemetry.predationRisk > 60}
              subValue={`${dna.predatorType.toUpperCase()} / ${dna.preyType.toUpperCase()}`}
            />
          </div>
        </section>

        {/* Chemical Environment Section */}
        <section className="space-y-3">
          <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase flex items-center px-2">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3" />
            Chemical Stasis
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricBlock label="Toxic Stress" value={telemetry.toxicStress} unit="%" warning={telemetry.toxicStress > 40} />
            <MetricBlock label="pH Balance" value={ecosystem.pHLevel} unit="pH" warning={Math.abs(ecosystem.pHLevel - 7.0) > 2.0} />
          </div>
        </section>
      </div>

      {/* Status Block */}
      <div className="mt-auto pt-6 border-t border-slate-800">
        <AnimatePresence mode="wait">
          {isViable ? (
            <motion.div
              key="viable"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-emerald-400 text-slate-950 p-5 rounded-2xl flex items-center justify-between shadow-[0_0_30px_rgba(52,211,153,0.2)]"
            >
              <div className="text-left">
                <div className="text-sm font-black tracking-tight uppercase leading-none">Stable System</div>
                <div className="text-[8px] font-bold opacity-60 mt-1 uppercase tracking-widest whitespace-nowrap">Equilibrium Verified</div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-slate-950/20 flex items-center justify-center">
                <span className="text-2xl font-black italic">
                  {telemetry.viabilityScore > 90 ? 'S' : telemetry.viabilityScore > 80 ? 'A' : telemetry.viabilityScore > 65 ? 'B' : 'C'}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="unstable"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-red-500/10 border border-red-500/40 p-5 rounded-2xl"
            >
              <div className="text-xs font-bold text-red-500 tracking-widest text-center mb-3 uppercase">System Failure</div>
              <div className="space-y-1.5">
                {failureModes.slice(0, 3).map((mode, i) => (
                  <div key={i} className="text-[9px] text-red-400 font-bold flex items-start uppercase tracking-tight">
                    <span className="mr-2">×</span>
                    <span>{mode.replace(/_/g, ' ')}</span>
                  </div>
                ))}
                {failureModes.length > 3 && <div className="text-[8px] text-red-400/60 text-center font-bold">+{failureModes.length - 3} MORE CRITICALS</div>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TelemetryDisplay;
