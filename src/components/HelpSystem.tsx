import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Zap, Waves, Wind, Thermometer, FlaskConical, Target, Activity, Eye, ShieldCheck, Info } from 'lucide-react';

interface HelpSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpSystem: React.FC<HelpSystemProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = React.useState('fundamentals');

  const tabs = [
    { id: 'fundamentals', label: 'Fundamentals', icon: <BookOpen size={14} /> },
    { id: 'metabolism', label: 'Metabolism', icon: <Zap size={14} /> },
    { id: 'biomechanics', label: 'Biomechanics', icon: <Activity size={14} /> },
    { id: 'environmental', label: 'Environment', icon: <Wind size={14} /> },
    { id: 'modules', label: 'Modules', icon: <ShieldCheck size={14} /> },
  ];

  const content: Record<string, React.ReactNode> = {
    fundamentals: (
      <div className="space-y-6">
        <div>
          <h4 className="text-emerald-400 font-bold text-sm mb-2 uppercase tracking-tight">The Simulation Core</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Biomapping Core v7.4-Pro is a high-fidelity biological evolutionary simulation. 
            Organisms must balance metabolic demand against environmental constraints to remain viable.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="text-emerald-400 font-bold text-[10px] uppercase mb-1">Viability</div>
            <p className="text-slate-500 text-[9px] leading-tight">
              A binary state indicating if the organism can survive in its current configuration. 
              Any single failure mode (e.g., Starvation) renders the specimen non-viable.
            </p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="text-emerald-400 font-bold text-[10px] uppercase mb-1">Fitness Score</div>
            <p className="text-slate-500 text-[9px] leading-tight">
              An accumulated metric representing the organism's evolutionary success. Viable organisms gain fitness over time.
            </p>
          </div>
        </div>
      </div>
    ),
    metabolism: (
      <div className="space-y-6">
        <div>
          <h4 className="text-emerald-400 font-bold text-sm mb-2 uppercase tracking-tight">Energy Management</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Metabolism is the central engine. It is governed by Kleiber's Law, where metabolic rate scales with Mass^0.75.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 p-1 bg-emerald-500/10 rounded-md text-emerald-400"><Zap size={12} /></div>
            <div>
              <div className="text-slate-300 font-bold text-[10px] uppercase">Metabolic Rate (Watts)</div>
              <p className="text-slate-500 text-[9px]">The base energy cost to stay alive. Complexity, motion, and neurological systems add to this cost.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 p-1 bg-blue-500/10 rounded-md text-blue-400"><Target size={12} /></div>
            <div>
              <div className="text-slate-300 font-bold text-[10px] uppercase">Chemoautotrophy</div>
              <p className="text-slate-500 text-[9px]">Sourcing energy from inorganic chemical reactions. Functions independently of surface area; highly efficient in high-toxin/volcanic environments.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 p-1 bg-amber-500/10 rounded-md text-amber-400"><Info size={12} /></div>
            <div>
              <div className="text-slate-300 font-bold text-[10px] uppercase">Starvation</div>
              <p className="text-slate-500 text-[9px]">Occurs when Metabolic Rate exceeds Energy Intake. Energy reserves will deplete rapidly.</p>
            </div>
          </div>
        </div>
      </div>
    ),
    biomechanics: (
      <div className="space-y-6">
        <div>
          <h4 className="text-emerald-400 font-bold text-sm mb-2 uppercase tracking-tight">Structural Engineering</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Mass and Gravity create skeletal stress. The organism's geometry and material determines its structural limit.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
             <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 font-bold text-[10px] uppercase">Skeletal Stress</span>
                <span className="text-[8px] text-slate-500 font-mono tracking-tighter">Newtons / Area</span>
             </div>
             <p className="text-slate-500 text-[9px] leading-relaxed">
                Calculated by dividing Weight by the bone's Cross-Sectional Area. 
                Materials like Bone (170 MPa) handle more stress than Cartilage (3 MPa).
             </p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
             <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 font-bold text-[10px] uppercase">Geometry (φ)</span>
                <span className="text-[8px] text-slate-500 font-mono tracking-tighter">Surface-to-Volume</span>
             </div>
             <p className="text-slate-500 text-[9px] leading-relaxed">
                High Geometry Factor (Elongated) increases Surface Area for cooling and photosynthesis but increases fluid drag.
                Low Factor (Spherical) is efficient but prone to overheating.
             </p>
          </div>
        </div>
      </div>
    ),
    environmental: (
      <div className="space-y-6">
        <div>
          <h4 className="text-emerald-400 font-bold text-sm mb-2 uppercase tracking-tight">External Constraints</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            The environment determines the physical laws acting on the specimen.
          </p>
        </div>
        <div className="space-y-4">
          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Waves size={12} className="text-blue-400" />
              <span className="text-blue-400 font-bold text-[10px] uppercase tracking-widest">Water Matrix</span>
            </div>
            <p className="text-slate-500 text-[9px]">High fluid viscosity increases drag (metabolic cost). Buoyancy reduces skeletal stress. Low sunlight penetration.</p>
          </div>
          <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Wind size={12} className="text-purple-400" />
              <span className="text-purple-400 font-bold text-[10px] uppercase tracking-widest">Air Matrix</span>
            </div>
            <p className="text-slate-500 text-[9px]">Low drag. High flight viability but extreme mass-to-lift constraints (Wing Loading). High water loss.</p>
          </div>
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Target size={12} className="text-amber-400" />
              <span className="text-amber-400 font-bold text-[10px] uppercase tracking-widest">Land Matrix</span>
            </div>
            <p className="text-slate-500 text-[9px]">Full gravity impact on skeleton. High nutrient availability. High solar flux for photosynthesis.</p>
          </div>
        </div>
      </div>
    ),
    modules: (
      <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
        <h4 className="text-emerald-400 font-bold text-sm mb-2 uppercase tracking-tight">Adaptive Modules</h4>
        <div className="space-y-3">
          {[
            { name: 'Locomotion', detail: 'Wings enable flight, Legs enable land transit. Columnar legs handle massive weights better.' },
            { name: 'Respiration', detail: 'Lungs (internal) are stable. Tracheae (diffusion) are simple but limit size. Gills (external) only work in water.' },
            { name: 'Thermodynamics', detail: 'Vascular ears and Dorsal plates increase dissipation. Blubber aids retention.' },
            { name: 'Sensory Array', detail: 'Primary environmental perception. Vision is dominant in AIR; Echolocation in WATER. Thermal and Vibration senses track heat and seismic ripples. High acuity reduces predation risk but increases metabolic tax.' },
            { name: 'Reproduction', detail: 'r-selection (Mass quantity) vs K-selection (Quality and investment). Semelparity is a single major event.' }
          ].map((mod, i) => (
            <div key={i} className="border-b border-slate-800/50 pb-2">
              <div className="text-slate-300 font-bold text-[10px] uppercase mb-0.5">{mod.name}</div>
              <p className="text-slate-500 text-[9px] leading-tight">{mod.detail}</p>
            </div>
          ))}
        </div>
      </div>
    )
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px]"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <BookOpen size={20} />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-white tracking-tight uppercase">Simulation Manual</h2>
                    <p className="text-[10px] text-zinc-500 font-mono font-bold tracking-widest uppercase">System Reference Guide // v7.4-Pro</p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-44 border-r border-slate-800 bg-slate-900/20 p-2 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      activeTab === tab.id 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 p-8 bg-slate-950 overflow-y-auto custom-scrollbar">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, x: 10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="h-full"
                 >
                   {content[activeTab]}
                 </motion.div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex justify-between items-center">
               <div className="flex gap-4 text-[8px] text-slate-600 font-mono uppercase font-bold">
                  <span>Status: Operational</span>
                  <span>License: Enterprise</span>
               </div>
               <button 
                  onClick={onClose}
                  className="px-6 py-1.5 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase rounded-lg hover:bg-emerald-400 transition-colors"
                >
                  Confirm Understanding
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default HelpSystem;
