import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, HelpCircle, Terminal, Zap, Activity, Globe } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  targetedId?: string;
}

const STEPS: TutorialStep[] = [
  {
    title: "BIOMETRIC INTERFACE INITIALIZED",
    description: "Welcome to ALLOMETRIX. You are directing the evolutionary path of bio-specimens across harsh planetary environments. Your goal: achieve biological equilibrium.",
    icon: <Terminal className="text-emerald-400" />,
  },
  {
    title: "DNA ARCHITECTURE",
    description: "Use the DNA MODIFIER on the left to adjust mass, geometry, and structural matrix. Every adjustment shifts the metabolic and mechanical load on the organism.",
    icon: <Zap className="text-amber-400" />,
  },
  {
    title: "CHIMERIC MODULES",
    description: "Snap on respiratory, locomotion, and thermal modules. A 5,000kg spider with tracheae will suffocate; wings on an elephant will fail to generate lift. Balance is key.",
    icon: <Activity className="text-blue-400" />,
  },
  {
    title: "ENVIRONMENTAL CORE",
    description: "The world is not static. Gravity multipliers, O2 concentrations, and temperatures define the physical boundaries your specimen must survive.",
    icon: <Globe className="text-emerald-400" />,
  },
  {
    title: "TELEMETRY FEED",
    description: "Monitor the 'Live Biomechanical Feed' on the right. If any system breaches physical limits (e.g., skeletal stress > material limit), the specimen goes extinct.",
    icon: <Activity className="text-red-400" />,
  },
  {
    title: "EPOCH TRANSITIONS",
    description: "Advance the epoch to trigger environmental shifts. Survival over time is the ultimate metric of evolutionary success. Good luck, Architect.",
    icon: <ChevronRight className="text-emerald-400" />,
  }
];

export default function Tutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
    else setIsOpen(false);
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-12 right-6 z-50 w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-emerald-400 hover:border-emerald-400 transition-colors shadow-2xl"
        title="Help / Tutorial"
      >
        <HelpCircle size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-emerald-500/30 shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)] p-6 relative overflow-hidden"
            >
              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
              
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-emerald-400 transition-colors z-20"
              >
                <X size={18} />
              </button>

              <div className="relative z-20">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {STEPS[currentStep].icon}
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-500/50 font-mono tracking-widest uppercase">System Guide // Epoch 001</div>
                    <h3 className="text-sm font-black text-emerald-400 uppercase tracking-tighter italic">
                      {STEPS[currentStep].title}
                    </h3>
                  </div>
                </div>

                <div className="min-h-[80px] mb-8">
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">
                    {STEPS[currentStep].description}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    {STEPS.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-4 h-1 transition-colors ${i === currentStep ? 'bg-emerald-400' : 'bg-slate-800'}`}
                      />
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    {currentStep > 0 && (
                      <button 
                        onClick={prev}
                        className="p-2 bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                    )}
                    <button 
                      onClick={next}
                      className="px-4 py-2 bg-emerald-400 text-slate-950 font-bold text-[10px] uppercase flex items-center space-x-2 hover:bg-emerald-300 transition-colors"
                    >
                      <span>{currentStep === STEPS.length - 1 ? 'Begin Operation' : 'Continuum'}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Decorative side bar */}
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-400/20" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
