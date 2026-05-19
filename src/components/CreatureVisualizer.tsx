import React from 'react';
import { motion } from 'motion/react';
import { OrganismDNA, SimulationResult, EcosystemState } from '../types';

interface CreatureVisualizerProps {
  dna: OrganismDNA;
  isViable: boolean;
  telemetry: SimulationResult['telemetry'];
  ecosystem?: EcosystemState;
}

// ── Microbial visualizer ────────────────────────────────────────────────────
function MicrobialBody({ dna, isViable, telemetry }: { dna: OrganismDNA; isViable: boolean; telemetry: SimulationResult['telemetry'] }) {
  const domain = dna.domain ?? "eukaryota";
  const width = 200;
  const height = 120;
  const cx = width / 2;
  const cy = height / 2;

  // Geometry factor determines cell shape
  const shape = dna.geometryFactor < 1.5 ? 'coccus' : dna.geometryFactor < 3.0 ? 'rod' : 'spiral';

  // Size scales with mass (log)
  const massScale = 0.3 + Math.log10(Math.max(1e-15, dna.totalMassKg) + 1e-15) / 5 * 0.7;
  const rx = Math.max(6, 28 * massScale);
  const ry = shape === 'coccus' ? rx : rx * 0.55;
  const rodLength = shape === 'rod' ? rx * 1.6 : rx;

  // Domain-based color palette
  const domainColor = domain === 'bacteria'
    ? { primary: '#22d3ee', secondary: '#164e63', accent: '#67e8f9', glow: 'rgba(34,211,238,0.3)' }
    : { primary: '#fbbf24', secondary: '#78350f', accent: '#fde68a', glow: 'rgba(251,191,36,0.3)' };

  const viableColor = isViable ? domainColor.primary : '#ef4444';
  const viableGlow = isViable ? domainColor.glow : 'rgba(239,68,68,0.3)';
  const pulseFreq = Math.max(0.5, 3 - (telemetry.metabolicRateWatts / 800));

  // Build the SVG path for the cell body
  const getCellPath = () => {
    if (shape === 'coccus') {
      return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy}`;
    }
    if (shape === 'rod') {
      const l = rodLength;
      const r = ry;
      return `M ${cx - l} ${cy - r} L ${cx + l} ${cy - r} A ${r} ${r} 0 0 1 ${cx + l} ${cy + r} L ${cx - l} ${cy + r} A ${r} ${r} 0 0 1 ${cx - l} ${cy - r} Z`;
    }
    // spiral: sinusoidal path approximated with bezier
    const amp = ry * 1.8;
    const freq = 3;
    const pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * Math.PI * 2 * freq;
      pts.push([cx - rodLength * 1.5 + (i / 40) * rodLength * 3, cy + Math.sin(t) * amp]);
    }
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
    return d;
  };

  const cellPath = getCellPath();
  const nucleoidRx = shape === 'spiral' ? rx * 0.2 : rx * 0.4;
  const nucleoidRy = ry * 0.4;

  return (
    <motion.g>
      {/* Outer membrane / capsule */}
      <motion.ellipse
        cx={cx} cy={cy}
        rx={shape === 'spiral' ? 0 : rx + 5} ry={shape === 'spiral' ? 0 : ry + 4}
        fill="none" stroke={viableColor} strokeWidth="0.8" opacity={0.2}
        strokeDasharray="3,4"
        animate={{ opacity: [0.1, 0.25, 0.1], rx: [rx + 5, rx + 7, rx + 5] }}
        transition={{ repeat: Infinity, duration: pulseFreq * 1.5, ease: 'easeInOut' }}
      />

      {/* Cell body */}
      {shape === 'spiral' ? (
        <motion.path
          d={cellPath}
          fill="none"
          stroke={viableColor}
          strokeWidth={ry * 2}
          strokeLinecap="round"
          opacity={0.7}
          style={{ filter: `drop-shadow(0 0 6px ${viableGlow})` }}
          animate={{ opacity: [0.6, 0.9, 0.6] }}
          transition={{ repeat: Infinity, duration: pulseFreq, ease: 'easeInOut' }}
        />
      ) : (
        <motion.path
          d={cellPath}
          fill={isViable ? domainColor.secondary : '#450a0a'}
          stroke={viableColor}
          strokeWidth="0.8"
          style={{ filter: `drop-shadow(0 0 8px ${viableGlow})` }}
          animate={{ scaleX: [1, 1 + 0.03 * (isViable ? 1 : 0), 1] }}
          transition={{ repeat: Infinity, duration: pulseFreq, ease: 'easeInOut' }}
        />
      )}

      {/* Cell wall texture overlay */}
      {shape !== 'spiral' && dna.structuralMaterial === 'peptidoglycan' && (
        <motion.path
          d={cellPath}
          fill="none"
          stroke={domainColor.accent}
          strokeWidth="0.4"
          strokeDasharray="2,5"
          opacity={0.3}
          animate={{ strokeDashoffset: [0, -14] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        />
      )}

      {/* Nucleoid region (prokaryotic DNA — no nuclear membrane) */}
      {shape !== 'spiral' && (
        <motion.ellipse
          cx={cx} cy={cy}
          rx={nucleoidRx} ry={nucleoidRy}
          fill={domainColor.primary} opacity={0.25}
          animate={{ opacity: [0.15, 0.35, 0.15], scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: pulseFreq * 0.8 }}
        />
      )}

      {/* Ribosomes (small dots) */}
      {shape !== 'spiral' && [...Array(10)].map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const dist = Math.min(rx, ry) * 0.65;
        return (
          <motion.circle
            key={i}
            cx={cx + Math.cos(angle) * dist}
            cy={cy + Math.sin(angle) * dist * (ry / rx)}
            r={0.8}
            fill={domainColor.accent}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.12 }}
          />
        );
      })}

      {/* Flagella */}
      {dna.modules.locomotion.type === 'flagella' && (
        <g>
          {[0, 1].map((side) => (
            <motion.path
              key={side}
              d={`M ${cx + (side === 0 ? rx : -rx)} ${cy}
                  C ${cx + (side === 0 ? rx + 20 : -rx - 20)} ${cy - 15}
                    ${cx + (side === 0 ? rx + 30 : -rx - 30)} ${cy + 10}
                    ${cx + (side === 0 ? rx + 45 : -rx - 45)} ${cy - 5}`}
              fill="none"
              stroke={domainColor.accent}
              strokeWidth="0.8"
              opacity={0.6}
              animate={{
                d: side === 0
                  ? [`M ${cx + rx} ${cy} C ${cx + rx + 20} ${cy - 15} ${cx + rx + 30} ${cy + 10} ${cx + rx + 45} ${cy - 5}`,
                     `M ${cx + rx} ${cy} C ${cx + rx + 20} ${cy + 15} ${cx + rx + 30} ${cy - 10} ${cx + rx + 45} ${cy + 5}`,
                     `M ${cx + rx} ${cy} C ${cx + rx + 20} ${cy - 15} ${cx + rx + 30} ${cy + 10} ${cx + rx + 45} ${cy - 5}`]
                  : [`M ${cx - rx} ${cy} C ${cx - rx - 20} ${cy - 15} ${cx - rx - 30} ${cy + 10} ${cx - rx - 45} ${cy - 5}`,
                     `M ${cx - rx} ${cy} C ${cx - rx - 20} ${cy + 15} ${cx - rx - 30} ${cy - 10} ${cx - rx - 45} ${cy + 5}`,
                     `M ${cx - rx} ${cy} C ${cx - rx - 20} ${cy - 15} ${cx - rx - 30} ${cy + 10} ${cx - rx - 45} ${cy - 5}`]
              }}
              transition={{ repeat: Infinity, duration: 0.4, ease: 'easeInOut' }}
            />
          ))}
        </g>
      )}

      {/* Pili (morphology complexity-based surface projections) */}
      {dna.morphologyComplexity > 0.3 && shape !== 'spiral' && (
        <g opacity={0.5}>
          {[...Array(Math.floor(dna.morphologyComplexity * 16))].map((_, i) => {
            const angle = (i / Math.floor(dna.morphologyComplexity * 16)) * Math.PI * 2;
            const sx = cx + Math.cos(angle) * rx;
            const sy = cy + Math.sin(angle) * ry;
            const ex = cx + Math.cos(angle) * (rx + 8 + dna.morphologyComplexity * 6);
            const ey = cy + Math.sin(angle) * (ry + 8 + dna.morphologyComplexity * 6);
            return (
              <motion.line key={i} x1={sx} y1={sy} x2={ex} y2={ey}
                stroke={domainColor.accent} strokeWidth="0.5"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.1 }}
              />
            );
          })}
        </g>
      )}

      {/* Quorum sensing particles (floating for high morphologyComplexity) */}
      {dna.morphologyComplexity > 0.5 && (
        <g>
          {[...Array(8)].map((_, i) => (
            <motion.circle key={i}
              cx={cx + (Math.random() - 0.5) * (rx * 4)}
              cy={cy + (Math.random() - 0.5) * (ry * 4)}
              r={1}
              fill={domainColor.accent}
              animate={{
                x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20],
                y: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1.5, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 2 + i * 0.3, delay: i * 0.25 }}
            />
          ))}
        </g>
      )}

      {/* Stress overlay */}
      {!isViable && (
        <motion.path
          d={shape !== 'spiral' ? cellPath : ''}
          fill="rgba(239,68,68,0.1)"
          stroke="#ef4444"
          strokeWidth="1.5"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 0.4 }}
        />
      )}

      {/* Cell diameter label */}
      {telemetry.cellDiameterMicrons !== undefined && (
        <text x={cx} y={cy + ry + 18} textAnchor="middle"
          fill={domainColor.primary} opacity={0.5}
          className="font-mono text-[5px]" fontSize="5">
          {telemetry.cellDiameterMicrons < 1
            ? `${(telemetry.cellDiameterMicrons * 1000).toFixed(0)} nm`
            : `${telemetry.cellDiameterMicrons.toFixed(2)} µm`}
        </text>
      )}
    </motion.g>
  );
}

export default function CreatureVisualizer({ dna, isViable, telemetry, ecosystem }: CreatureVisualizerProps) {
  const domain = dna.domain ?? "eukaryota";
  const isMicrobialDomain = domain === "bacteria" || domain === "archaea";

  // Calculate visual properties based on DNA
  const width = 200;
  const height = 120;
  const centerX = width / 2;
  const centerY = height / 2;

  // Geometry factor directly influences the body shape
  // Instead of a simple ellipse, we use a path to allow for organic deformations
  const bodyWidth = 40 * Math.sqrt(dna.geometryFactor);
  const bodyHeight = 40 / Math.sqrt(dna.geometryFactor);
  
  // Create a "deformed" body path based on geometry factor
  // Elongated shapes get a slight "wasp waist" pinch, squat shapes get a bulge
  const getBodyPath = (w: number, h: number, factor: number) => {
    // Smoother interpolation for organic feel
    const squeeze = factor > 1.2 ? Math.min(0.95, 1.1 - (factor * 0.1)) : 1.0;
    const expansion = factor < 0.8 ? Math.max(1.05, 1.2 - (factor * 0.2)) : 1.0;
    
    // Additional "lobes" or asymmetry for very high/low factors
    const distortion = Math.abs(1 - factor) * 5;

    // Morphology Complexity adds bumps/waviness
    const waves = dna.morphologyComplexity * 10;
    
    return `
      M ${centerX - w} ${centerY}
      C ${centerX - w} ${centerY - h * expansion - (waves/2)}, ${centerX - w/4 * squeeze} ${centerY - h * squeeze - distortion - waves}, ${centerX} ${centerY - h * squeeze}
      S ${centerX + w} ${centerY - h * expansion - (waves/2)}, ${centerX + w} ${centerY}
      S ${centerX + w/4 * squeeze} ${centerY + h * squeeze + distortion + waves}, ${centerX} ${centerY + h * squeeze}
      S ${centerX - w} ${centerY + h * expansion + (waves/2)}, ${centerX - w} ${centerY}
    `;
  };

  const bodyPath = getBodyPath(bodyWidth, bodyHeight, dna.geometryFactor);
  
  // Morphology complexity protrusions
  const complexityThreshold = 0.7;
  const showComplexFeatures = dna.morphologyComplexity > complexityThreshold;
  const complexityLevel = Math.max(0, dna.morphologyComplexity - complexityThreshold) / (1 - complexityThreshold);
  const spikeCount = Math.floor(dna.morphologyComplexity * 12);
  const spikeHeight = 10 * complexityLevel;

  const stressRatio = telemetry.skeletalStressPascals / telemetry.skeletalLimitPascals;
  const isStraining = stressRatio > 0.5;
  const isCritical = stressRatio > 0.8;
  const viabilityResonance = isViable ? (telemetry.viabilityScore / 100) : 0;
  
  // Dynamic body pulse for viable organisms
  // Metabolism scaling: High metabolic rate = faster heart rate/pulse
  const pulseFreq = Math.max(0.5, 3 - (telemetry.metabolicRateWatts / 800));
  const bodyPulse = isViable ? [1, 1 + (0.04 * viabilityResonance), 1] : 1;

  // Dynamic flexing based on stress
  const flexX = isStraining ? [0, (stressRatio - 0.5) * 8, 0, -(stressRatio - 0.5) * 8, 0] : 0;
  const jitter = isCritical ? [0, 1, -1, 0.5, -0.5, 0] : 0;

  // EKG heartbeat path — 20 cycles × 40 SVG units = 800 total; viewBox shows 400 at a time
  const buildEkgPath = (baseY: number) => {
    let d = `M 0 ${baseY}`;
    for (let i = 0; i < 20; i++) {
      const o = i * 40;
      d += ` L ${o+10} ${baseY} L ${o+13} ${baseY-9} L ${o+18} ${baseY+12} L ${o+22} ${baseY-4} L ${o+26} ${baseY} L ${o+40} ${baseY}`;
    }
    return d;
  };
  const ekgPeriod = Math.max(0.4, 2.5 - telemetry.metabolicRateWatts / 500);

  // Hydrodynamics influence (streamlining makes it "pointier")
  const isStreamlined = dna.modules.hydrodynamics?.type === 'streamlining';
  
  // Mass influences scale (logarithmic to keep it on screen)
  const massScale = 0.5 + Math.log10(dna.totalMassKg + 1) * 0.15;

  // Color scheme based on environment (Apple-inspired)
  const envColors = {
    LAND: { primary: '#ffffff', secondary: '#3f3f46', accent: '#a1a1aa' },
    WATER: { primary: '#3b82f6', secondary: '#1e3a8a', accent: '#60a5fa' },
    AIR: { primary: '#a855f7', secondary: '#581c87', accent: '#c084fc' }
  };
  const colors = envColors[dna.environment] || envColors.LAND;

  return (
    <div className={`relative w-full h-80 bg-black rounded-2xl overflow-hidden flex items-center justify-center group select-none shadow-2xl border transition-all duration-700 ${isViable ? 'border-emerald-400/20 shadow-[0_0_24px_rgba(52,211,153,0.07)]' : 'border-red-500/35 shadow-[0_0_24px_rgba(239,68,68,0.10)]'}`}>
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#111111_0%,_#000000_100%)]" />
      
      {/* Background Soft Particles based on environment */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {dna.environment === 'WATER' && (
          [...Array(18)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-blue-300/30"
              style={{ width: 2 + (i % 3), height: 2 + (i % 3) }}
              initial={{ x: Math.random() * 800, y: 400 }}
              animate={{ y: -20, opacity: [0, 0.75, 0] }}
              transition={{ repeat: Infinity, duration: 3 + Math.random() * 5, delay: i * 0.4 }}
            />
          ))
        )}
        {dna.environment === 'AIR' && (
          [...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[1.5px] bg-purple-300/30 rounded-full"
              style={{ width: 20 + Math.random() * 50 }}
              initial={{ x: -120, y: Math.random() * 400 }}
              animate={{ x: 900, opacity: [0, 0.65, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 + Math.random() * 2.5, delay: i * 0.25 }}
            />
          ))
        )}
        {dna.environment === 'LAND' && (
          [...Array(18)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-[1.5px] h-[1.5px] bg-white/20 rounded-full"
              initial={{ x: Math.random() * 800, y: Math.random() * 400 }}
              animate={{ y: `+=${8 + (i % 5)}`, x: `+=${6 + (i % 4)}`, opacity: [0, 0.45, 0] }}
              transition={{ repeat: Infinity, duration: 2.5 + Math.random() * 3 }}
            />
          ))
        )}
      </div>
      
      <div className="absolute top-6 left-8 flex flex-col gap-1.5 opacity-80 z-20">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isViable ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] pulse'}`} />
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">ANALYTICAL CORE</span>
        </div>
        <span className={`text-[12px] font-bold tracking-tight ${isViable ? 'text-white' : 'text-red-500'}`}>
          {isViable ? 'BIOMETRY STABLE' : 'CRITICAL FAILURE'}
        </span>
      </div>

      {!isMicrobialDomain && (
        <div className="absolute top-6 right-8 text-right opacity-40 z-20">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Model 7.4-Pro</span>
          <div className="text-[11px] text-white font-medium uppercase mt-1"> {dna.modules.trophic.type} </div>
        </div>
      )}

      {/* Microbial domain badge */}
      {isMicrobialDomain && (
        <div className="absolute top-6 right-8 text-right z-20">
          <div className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded border ${
            domain === 'bacteria'
              ? 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5'
              : 'text-amber-400 border-amber-400/30 bg-amber-400/5'
          }`}>
            {domain === 'bacteria' ? 'PROKARYOTA' : 'ARCHAEA'}
          </div>
          <div className={`text-[10px] font-medium mt-1 ${domain === 'bacteria' ? 'text-cyan-300/60' : 'text-amber-300/60'}`}>
            {dna.modules.trophic.type}
          </div>
        </div>
      )}

      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible z-10">
        <defs>
          <radialGradient id="bodyGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={isViable ? (dna.environment === 'LAND' ? '#ffffff' : colors.accent) : "#ef4444"} stopOpacity="0.9" />
            <stop offset="40%" stopColor={isViable ? colors.primary : "#ef4444"} stopOpacity="0.7" />
            <stop offset="100%" stopColor={isViable ? colors.secondary : "#7f1d1d"} stopOpacity="0.4" />
          </radialGradient>

          <filter id="premium-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.8" specularExponent="20" lightingColor="white" result="spec">
              <fePointLight x="-100" y="-100" z="200"/>
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" operator="in" result="specOut"/>
            <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint"/>
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="black" floodOpacity="1.0" />
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={colors.primary} floodOpacity="0.3" />
          </filter>
          
          <filter id="inner-glow">
            <feOffset dx="0" dy="2" />
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="out" />
            <feFlood floodColor="white" floodOpacity="0.5" result="glow" />
            <feComposite in="glow" in2="SourceGraphic" operator="in" />
            <feComposite in2="SourceGraphic" operator="over" />
          </filter>

          {/* New Material Patterns */}
          <pattern id="bonePattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
             <path d="M 0 4 Q 4 0 8 4 Q 4 8 0 4" fill="none" stroke="white" strokeWidth="0.2" opacity="0.1" />
          </pattern>

          <pattern id="chitinShiny" x="0" y="0" width="1" height="1" patternContentUnits="objectBoundingBox">
             <linearGradient id="chitinGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.2" />
                <stop offset="50%" stopColor="transparent" />
             </linearGradient>
             <rect width="1" height="1" fill="url(#chitinGrad)" />
          </pattern>

          <pattern id="exoskeletonPattern" x="0" y="0" width="12" height="40" patternUnits="userSpaceOnUse">
             <path d="M 0 0 V 40 M 6 0 V 40" stroke={colors.primary} strokeWidth="1" opacity="0.4" />
             <path d="M 0 10 H 12 M 0 30 H 12" stroke={colors.primary} strokeWidth="0.5" opacity="0.2" />
          </pattern>

          <pattern id="cartilageFibrous" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
             <circle cx="2" cy="2" r="0.5" fill="white" opacity="0.1" />
             <path d="M 0 0 L 4 4" stroke="white" strokeWidth="0.1" opacity="0.05" />
          </pattern>

          {/* stressCracks Pattern */}
          <pattern id="stressCracks" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
             <path d="M 0 15 L 8 12 L 15 18 L 22 10 L 30 15" fill="none" stroke="red" strokeWidth="1.2" opacity="0.8" />
             <path d="M 15 0 L 18 8 L 12 15 L 20 22 L 15 30" fill="none" stroke="red" strokeWidth="1.2" opacity="0.8" />
          </pattern>
        </defs>

        {isMicrobialDomain
          ? (
            <motion.g
              animate={{ scale: massScale * 1.4 }}
              transition={{ type: 'spring', stiffness: 50, damping: 15 }}
              style={{ transformOrigin: `${centerX}px ${centerY}px` }}
            >
              <MicrobialBody dna={dna} isViable={isViable} telemetry={telemetry} />
            </motion.g>
          )
          : null
        }

        {!isMicrobialDomain && (
        <motion.g
          animate={{
            scale: massScale,
            rotate: dna.structuralMaterial === 'cartilage_matrix' && isViable ? [0, 1.5, -1.5, 0] : 0,
            y: isViable ? [0, -2, 2, 0] : 0,
            skewX: dna.structuralMaterial === 'cartilage_matrix' && isViable ? [0, 2, -2, 0] : 0,
            x: flexX,
            filter: dna.modules.thermal.type === 'vascular_ears' && isViable ? ["blur(0px)", "blur(1px)", "blur(0px)"] : "none",
            scaleX: bodyPulse
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 50, 
            damping: 15,
            rotate: { repeat: Infinity, duration: 3, ease: "easeInOut" },
            y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
            skewX: { repeat: Infinity, duration: 1.8, ease: "easeInOut" },
            filter: { repeat: Infinity, duration: 2, ease: "easeInOut" },
            x: { repeat: Infinity, duration: 0.5, ease: "linear" },
            scaleX: { repeat: Infinity, duration: pulseFreq, ease: "easeInOut" }
          }}
        >
          {/* COMPLEXITY PROTRUSIONS */}
          {showComplexFeatures && (
            <g className="opacity-60">
              {[...Array(spikeCount)].map((_, i) => {
                const angle = (i / spikeCount) * Math.PI * 2;
                const sx = centerX + Math.cos(angle) * (bodyWidth - 5);
                const sy = centerY + Math.sin(angle) * (bodyHeight - 5);
                const ex = centerX + Math.cos(angle) * (bodyWidth + spikeHeight);
                const ey = centerY + Math.sin(angle) * (bodyHeight + spikeHeight);
                const isOdd = i % 2 === 0;
                return (
                  <g key={i}>
                    <motion.path
                      d={`M ${sx} ${sy} Q ${centerX + Math.cos(angle + 0.2) * (bodyWidth + spikeHeight/2)} ${centerY + Math.sin(angle + 0.2) * (bodyHeight + spikeHeight/2)} ${ex} ${ey}`}
                      className="fill-none stroke-current"
                      style={{ color: colors.primary }}
                      strokeWidth={1.5 + (complexityLevel * 1)}
                      animate={{ 
                        scaleY: [1, 1.3, 1],
                        rotate: [0, 8, -8, 0],
                        opacity: [0.6, 1, 0.6]
                      }}
                      transition={{ repeat: Infinity, duration: 2 + Math.random(), delay: i * 0.1 }}
                      strokeLinecap="round"
                    />
                    {complexityLevel > 0.5 && isOdd && (
                      <motion.circle 
                        cx={ex} cy={ey} r={2 * complexityLevel}
                        className="fill-current"
                        style={{ color: colors.accent }}
                        animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.8, 1.2, 0.8] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                      />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* LOCOMOTION VISUALS */}
          <g className="opacity-60">
            {dna.modules.locomotion.type === 'wings' && (
              <motion.g
                animate={{ 
                  rotate: [0, 55, -55, 0],
                  scaleY: [1, 0.7, 1.2, 1]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: dna.environment === 'AIR' ? 0.25 : 0.7, 
                  ease: "easeInOut" 
                }}
                style={{ transformOrigin: `${centerX}px ${centerY}px` }}
              >
                <path 
                  d={`M ${centerX} ${centerY} Q ${centerX - bodyWidth} ${centerY - bodyHeight} ${centerX - bodyWidth * 1.5} ${centerY} Q ${centerX - bodyWidth} ${centerY + bodyHeight/2} ${centerX} ${centerY}`}
                  className="fill-slate-700/30 stroke-slate-500/60" 
                  strokeWidth="0.8" 
                />
                <path 
                  d={`M ${centerX} ${centerY} Q ${centerX + bodyWidth} ${centerY - bodyHeight} ${centerX + bodyWidth * 1.5} ${centerY} Q ${centerX + bodyWidth} ${centerY + bodyHeight/2} ${centerX} ${centerY}`}
                  className="fill-slate-700/30 stroke-slate-500/60" 
                  strokeWidth="0.8" 
                />
              </motion.g>
            )}

            {dna.modules.locomotion.type === 'fins' && (
              <g>
                {/* Tail Fin */}
                <motion.path 
                  d={`M ${centerX + bodyWidth/2} ${centerY} L ${centerX + bodyWidth/2 + 35} ${centerY - 25} L ${centerX + bodyWidth/2 + 25} ${centerY} L ${centerX + bodyWidth/2 + 35} ${centerY + 25} Z`} 
                  className="fill-cyan-500/30 stroke-cyan-500/60" 
                  animate={{ 
                    d: [
                      `M ${centerX + bodyWidth/2} ${centerY} L ${centerX + bodyWidth/2 + 35} ${centerY - 18} L ${centerX + bodyWidth/2 + 25} ${centerY} L ${centerX + bodyWidth/2 + 35} ${centerY + 18} Z`,
                      `M ${centerX + bodyWidth/2} ${centerY} L ${centerX + bodyWidth/2 + 35} ${centerY - 28} L ${centerX + bodyWidth/2 + 25} ${centerY} L ${centerX + bodyWidth/2 + 35} ${centerY + 28} Z`,
                      `M ${centerX + bodyWidth/2} ${centerY} L ${centerX + bodyWidth/2 + 35} ${centerY - 18} L ${centerX + bodyWidth/2 + 25} ${centerY} L ${centerX + bodyWidth/2 + 35} ${centerY + 18} Z`
                    ],
                    scaleX: [1, 1.1, 1]
                  }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut" }}
                  strokeWidth="1"
                />
                {/* Dorsal Fin */}
                <path 
                   d={`M ${centerX - 5} ${centerY - bodyHeight/2} L ${centerX} ${centerY - bodyHeight/2 - 15} L ${centerX + 15} ${centerY - bodyHeight/2} Z`}
                   className="fill-cyan-500/20 stroke-cyan-500/40"
                   strokeWidth="0.5"
                />
              </g>
            )}

            {(dna.modules.locomotion.type === 'spring_legs' || dna.modules.locomotion.type === 'columnar_legs') && (
              <motion.g 
                animate={dna.modules.locomotion.type === 'spring_legs' 
                  ? { y: [0, -10, 0], scaleY: [1, 0.8, 1.1, 1] } 
                  : { y: [0, -2, 0] }
                }
                transition={{ repeat: Infinity, duration: dna.modules.locomotion.type === 'spring_legs' ? 0.8 : 2 }}
                style={{ transformOrigin: "bottom" }}
              >
                <path 
                  d={`M ${centerX - bodyWidth/3} ${centerY + bodyHeight/2} L ${centerX - bodyWidth/2} ${centerY + bodyHeight/2 + 25}`} 
                  className="stroke-slate-500" 
                  strokeWidth={dna.modules.locomotion.type === 'columnar_legs' ? "4" : "1.5"} 
                />
                <path 
                  d={`M ${centerX + bodyWidth/3} ${centerY + bodyHeight/2} L ${centerX + bodyWidth/2} ${centerY + bodyHeight/2 + 25}`} 
                  className="stroke-slate-500" 
                  strokeWidth={dna.modules.locomotion.type === 'columnar_legs' ? "4" : "1.5"} 
                />
              </motion.g>
            )}
          </g>

          {/* THERMAL VISUALS */}
          {dna.modules.thermal.type === 'vascular_ears' && (
            <g className="opacity-60">
              <motion.path
                d={`M ${centerX - 5} ${centerY - bodyHeight/2} L ${centerX - 25} ${centerY - bodyHeight/2 - 20} L ${centerX} ${centerY - bodyHeight/2 - 5} Z`}
                className="fill-rose-500/30 stroke-rose-400/50"
                strokeWidth="0.5"
                animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1], fillOpacity: [0.2, 0.5, 0.2] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <motion.path
                d={`M ${centerX + 5} ${centerY - bodyHeight/2} L ${centerX + 25} ${centerY - bodyHeight/2 - 20} L ${centerX} ${centerY - bodyHeight/2 - 5} Z`}
                className="fill-rose-500/30 stroke-rose-400/50"
                strokeWidth="0.5"
                animate={{ rotate: [5, -5, 5], scale: [1, 1.1, 1], fillOpacity: [0.2, 0.5, 0.2] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </g>
          )}

          {dna.modules.thermal.type === 'dorsal_plates' && (
            <g className="opacity-70">
              {[...Array(5)].map((_, i) => (
                <motion.rect
                  key={i}
                  x={centerX - bodyWidth/2 + (i * bodyWidth/5)}
                  y={centerY - bodyHeight/2 - 10}
                  width={bodyWidth/10}
                  height="12"
                  rx="1"
                  className="fill-orange-400/40 stroke-orange-300/60"
                  strokeWidth="0.5"
                  animate={{ y: [centerY - bodyHeight/2 - 8, centerY - bodyHeight/2 - 14, centerY - bodyHeight/2 - 8] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                />
              ))}
            </g>
          )}

          {dna.modules.thermal.type === 'blubber' && (
             <motion.path
                d={bodyPath}
                className="fill-none stroke-blue-200/20"
                strokeWidth="6"
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ repeat: Infinity, duration: 4 }}
              />
          )}

          {/* MAIN BODY PATH */}
          <motion.path
            d={bodyPath}
            className={`${isViable ? 'stroke-white/30' : 'stroke-rose-500/40'} fill-[url(#bodyGradient)]`}
            strokeWidth="0.5"
            filter="url(#premium-glow)"
            animate={isViable ? { 
              d: isStraining ? [
                bodyPath,
                getBodyPath(bodyWidth * (1 + 0.12 * stressRatio), bodyHeight * (1 - 0.08 * stressRatio), dna.geometryFactor),
                bodyPath
              ] : [
                bodyPath,
                getBodyPath(bodyWidth * (1 + telemetry.metabolicRateWatts / 5000), bodyHeight * (1 - telemetry.metabolicRateWatts / 5000), dna.geometryFactor),
                bodyPath
              ]
            } : {}}
            transition={{ repeat: Infinity, duration: isStraining ? 0.3 : Math.max(0.5, 3 - (telemetry.metabolicRateWatts / 500)), ease: "easeInOut" }}
          />

          {/* SKELETAL STRESS OVERLAY */}
          {isStraining && (
            <motion.path
              d={bodyPath}
              className="fill-rose-600/10 stroke-rose-500"
              strokeWidth={Math.min(6, stressRatio * 5)}
              animate={{ 
                opacity: isCritical ? [0.8, 1.0, 0.8] : [0.3, 0.7, 0.3],
                scale: isCritical ? [1.0, 1.1, 1.0] : [1.0, 1.02, 1.0],
                filter: isCritical ? "blur(12px) drop-shadow(0 0 35px rgba(239, 68, 68, 0.9))" : "blur(4px) drop-shadow(0 0 10px rgba(239, 68, 68, 0.2))"
              }}
              transition={{ repeat: Infinity, duration: isCritical ? 0.15 : 0.8 }}
            />
          )}

          {isCritical && (
            <g>
              <motion.path 
                d={bodyPath} 
                fill="url(#stressCracks)" 
                className="opacity-100 pointer-events-none"
                animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
              />
              <motion.path
                d={bodyPath}
                className="fill-none stroke-rose-500 opacity-90"
                strokeWidth="12"
                animate={{ scale: [1, 1.2, 1], opacity: [0, 0.8, 0] }}
                transition={{ repeat: Infinity, duration: 0.3, ease: "easeOut" }}
                style={{ filter: "blur(30px) drop-shadow(0 0 40px rgba(239, 68, 68, 1))" }}
              />
            </g>
          )}

          {/* MATERIAL OVERLAYS */}
          <g className="pointer-events-none">
            {dna.structuralMaterial === 'standard_bone' && (
              <path d={bodyPath} fill="url(#bonePattern)" className="opacity-40" />
            )}
            {dna.structuralMaterial === 'chitin' && (
              <path d={bodyPath} fill="url(#chitinShiny)" className="opacity-80" />
            )}
            {dna.structuralMaterial === 'cartilage' && (
              <path d={bodyPath} fill="url(#cartilageFibrous)" />
            )}
            {dna.structuralMaterial === 'exoskeleton' && (
              <motion.path 
                d={bodyPath} 
                fill="url(#exoskeletonPattern)" 
                animate={{ 
                  opacity: isStraining ? [0.4, 0.9, 0.4] : 0.4,
                  strokeWidth: isStraining ? 2 : 0
                }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </g>

          {/* TROPHIC SPECIALIZATIONS */}
          {(dna.modules.trophic.type === 'photoautotroph' || dna.modules.trophic.type === 'photosynthesis') && (
            <g className="opacity-80">
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <motion.g key={angle} transform={`rotate(${angle} ${centerX} ${centerY}) translate(${bodyWidth - 5} 0)`}>
                  <motion.path
                    d={`M 0 0 Q 15 -12 40 0 Q 15 12 0 0`}
                    className="fill-emerald-400/40 stroke-emerald-300/60"
                    strokeWidth="1.2"
                    animate={{ 
                      rotate: [0, 25, -25, 0],
                      scale: [1, 1.4, 1],
                      fillOpacity: [0.3, 0.9, 0.3],
                      strokeWidth: [1.2, 2.5, 1.2]
                    }}
                    transition={{ repeat: Infinity, duration: 1.2 + angle/250, ease: "easeInOut" }}
                  />
                  {/* Solar "particles" gathering */}
                  <motion.circle 
                    r="1.5"
                    className="fill-emerald-100"
                    animate={{ 
                      x: [50, 0], 
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.5, 0.5] 
                    }}
                    transition={{ repeat: Infinity, duration: 1, delay: angle/100 }}
                  />
                </motion.g>
              ))}
            </g>
          )}

          {(dna.modules.trophic.type === 'herbivore' || dna.modules.trophic.type === 'carnivore') && (
            <g className="opacity-60">
              {/* Simple Mouth / Digestive element */}
              <motion.path
                d={`M ${centerX - bodyWidth/1.2} ${centerY} Q ${centerX - bodyWidth/1.5} ${centerY + 10} ${centerX - bodyWidth/2} ${centerY}`}
                className="fill-none stroke-current"
                style={{ color: colors.secondary }}
                strokeWidth="1.5"
                animate={isViable ? { 
                  d: [
                    `M ${centerX - bodyWidth/1.2} ${centerY} Q ${centerX - bodyWidth/1.5} ${centerY + 2} ${centerX - bodyWidth/2} ${centerY}`,
                    `M ${centerX - bodyWidth/1.2} ${centerY} Q ${centerX - bodyWidth/1.5} ${centerY + 12 + (telemetry.energyIntakeWatts / 500)} ${centerX - bodyWidth/2} ${centerY}`,
                    `M ${centerX - bodyWidth/1.2} ${centerY} Q ${centerX - bodyWidth/1.5} ${centerY + 2} ${centerX - bodyWidth/2} ${centerY}`
                  ]
                } : {}}
                transition={{ repeat: Infinity, duration: Math.max(0.4, 1.5 - (telemetry.energyIntakeWatts / 1000)), ease: "easeInOut" }}
              />
              <motion.circle
                cx={centerX - bodyWidth/3}
                cy={centerY}
                r={4 + (telemetry.energyIntakeWatts / 2000)}
                className="fill-current/20"
                style={{ color: colors.secondary }}
                animate={{ 
                  scale: [1, 1.4, 1], 
                  opacity: [0.2, 0.5, 0.2],
                  fillOpacity: [0.1, 0.4, 0.1]
                }}
                transition={{ repeat: Infinity, duration: 3 }}
              />
            </g>
          )}

          {dna.modules.trophic.type === 'chemoautotroph' && (
             <g className="opacity-70">
               {[...Array(32)].map((_, i) => (
                 <motion.circle
                   key={i}
                   cx={centerX + (Math.random() - 0.5) * (bodyWidth * 2.5)}
                   cy={centerY + (Math.random() - 0.5) * (bodyHeight * 2.2)}
                   r={Math.random() * 4 + 0.5}
                   className="fill-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.8)]"
                   animate={{ 
                     opacity: [0, 0.8, 0],
                     scale: [0.1, 1.8, 0.1],
                     x: [(Math.random() - 0.5) * 15, (Math.random() - 0.5) * 45],
                     y: [40, -60]
                   }}
                   transition={{ 
                     repeat: Infinity, 
                     duration: 1.2 + Math.random() * 1.5, 
                     delay: i * 0.08,
                     ease: "easeOut"
                   }}
                 />
               ))}
               {/* Swirling atmosphere effect */}
               <motion.ellipse 
                 cx={centerX} cy={centerY}
                 rx={bodyWidth * 1.4} ry={bodyHeight * 1.4}
                 className="fill-none stroke-amber-400/20"
                 strokeWidth="0.5"
                 strokeDasharray="4, 12"
                 animate={{ rotate: 360, opacity: [0.1, 0.3, 0.1] }}
                 transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
               />
               {/* Internal Metabolic Glow */}
               <motion.path
                  d={bodyPath}
                  className="fill-amber-400/10"
                  animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
             </g>
          )}

          {/* REPRODUCTION VISUALS */}
          {dna.modules.reproduction.strategy === 'r_selection' && (
             <g className="opacity-70">
               {[...Array(24)].map((_, i) => (
                 <motion.circle
                   key={i}
                   cx={centerX + Math.cos(i) * (bodyWidth + 15)}
                   cy={centerY + Math.sin(i) * (bodyHeight + 15)}
                   r={Math.random() * 2 + 1}
                   className="fill-rose-200 border border-rose-400/20"
                   animate={{ 
                     x: [0, (Math.random() - 0.5) * 15],
                     y: [0, (Math.random() - 0.5) * 15],
                     opacity: [0.3, 1, 0.3],
                     scale: [1, 1.2, 1]
                   }}
                   transition={{ repeat: Infinity, duration: 3 + Math.random() * 2 }}
                 />
               ))}
             </g>
          )}

          {dna.modules.reproduction.strategy === 'K_selection' && (
             <motion.g
               animate={{ y: [0, -5, 0], scale: [1, 1.05, 1] }}
               transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
             >
               <circle
                 cx={centerX}
                 cy={centerY + bodyHeight/2}
                 r={bodyHeight/3.5}
                 className="fill-rose-400/40 stroke-rose-200/60"
                 strokeWidth="1.5"
               />
               <motion.circle
                 cx={centerX}
                 cy={centerY + bodyHeight/2}
                 r={bodyHeight/8}
                 className="fill-rose-100"
                 animate={{ opacity: [0.4, 0.9, 0.4] }}
                 transition={{ repeat: Infinity, duration: 1.2 }}
               />
             </motion.g>
          )}

          {dna.modules.reproduction.strategy === 'iteroparity' && (
            <motion.circle 
              cx={centerX} cy={centerY} r={bodyWidth + 25} 
              className="fill-none stroke-blue-400/30" 
              strokeWidth="0.8" strokeDasharray="6,3" 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
            />
          )}

          {dna.modules.reproduction.strategy === 'semelparity' && (
            <motion.path
              d={`M ${centerX - bodyWidth - 20} ${centerY} A ${bodyWidth+20} ${bodyHeight+20} 0 1 1 ${centerX + bodyWidth + 20} ${centerY}`}
              className="fill-none stroke-orange-500/40"
              strokeWidth="2"
              strokeDasharray="1,10"
              animate={{ strokeDashoffset: [0, 20] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
          )}

          {/* HYDRODYNAMICS / SURFACE DETAILS */}
          {dna.modules.hydrodynamics?.type === 'lateral_line' && (
            <g>
              <motion.path 
                d={`M ${centerX - bodyWidth + 5} ${centerY} Q ${centerX - bodyWidth/2} ${centerY + 15} ${centerX + bodyWidth - 10} ${centerY}`} 
                className="fill-none stroke-current" 
                style={{ color: colors.accent }}
                strokeWidth="3" 
                strokeDasharray="6,12"
                animate={{ 
                  strokeDashoffset: [0, -48],
                  opacity: [0.7, 1, 0.7],
                  strokeWidth: [3, 5, 3]
                }}
                transition={{ repeat: Infinity, duration: 0.6 / (dna.modules.hydrodynamics.scale || 1), ease: "linear" }}
              />
              {/* Pronounced Dynamic Pulse ripples */}
              {[...Array(5)].map((_, i) => (
                <motion.ellipse
                  key={i}
                  cx={centerX - bodyWidth/2.5} cy={centerY}
                  rx={2} ry={2}
                  className="fill-none stroke-current"
                  style={{ color: colors.accent, filter: "blur(1px)" }}
                  animate={{ 
                    rx: [2, (bodyWidth * 2.2) * (dna.modules.hydrodynamics.scale || 1)],
                    ry: [2, (bodyHeight * 2.2) * (dna.modules.hydrodynamics.scale || 1)],
                    opacity: [0, 0.9, 0],
                    strokeWidth: [6, 1.5, 0]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.2 / (dna.modules.hydrodynamics.scale || 1),
                    delay: i * 0.25,
                    ease: "easeOut"
                  }}
                />
              ))}
            </g>
          )}

          {/* STREAMLINING FLOW LINES */}
          {isStreamlined && (
            <g className="opacity-90">
               {[...Array(14)].map((_, i) => {
                 const sweepIdx = i - 7;
                 const yOffset = sweepIdx * (bodyHeight / 5);
                 const xStart = centerX - bodyWidth - 40;
                 const xEnd = centerX + bodyWidth + 80;
                 const delay = Math.abs(sweepIdx) * 0.05;
                 const scale = dna.modules.hydrodynamics.scale || 1;
                 
                 return (
                   <motion.path
                     key={i}
                     d={`M ${xStart} ${centerY + yOffset * 0.2} C ${centerX - bodyWidth/2} ${centerY + yOffset}, ${centerX + bodyWidth/3} ${centerY + yOffset * 0.4}, ${xEnd} ${centerY + yOffset * 0.05}`}
                     className="fill-none stroke-current opacity-50"
                     style={{ color: colors.primary }}
                     strokeWidth={(0.8 + (1 - Math.abs(sweepIdx)/7) * 2) * scale}
                     strokeDasharray="2, 25"
                     strokeLinecap="round"
                     animate={{ 
                       strokeDashoffset: [0, -100],
                       opacity: [0, 0.9, 0],
                       x: [0, 30]
                     }}
                     transition={{ 
                       repeat: Infinity, 
                       duration: 0.4 / scale, 
                       delay: delay,
                       ease: "linear"
                     }}
                   />
                 );
               })}
               
               <motion.path
                 d={`M ${centerX - bodyWidth - 120} ${centerY} L ${centerX + bodyWidth + 120} ${centerY}`}
                 className="stroke-current opacity-30"
                 style={{ color: colors.primary }}
                 strokeWidth="0.8"
                 strokeDasharray="4,60"
                 animate={{ x: [-60, 180] }}
                 transition={{ repeat: Infinity, duration: 0.25 }}
               />
               
               {/* Surface Flow Sheen */}
               <motion.path
                 d={bodyPath}
                 className="fill-white/5 pointer-events-none"
                 animate={{ 
                   opacity: [0.1, 0.4, 0.1],
                   fill: ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.2)", "rgba(255,255,255,0.05)"]
                 }}
                 transition={{ repeat: Infinity, duration: 1 }}
               />
            </g>
          )}

          {/* WATER FLUID DYNAMICS & DRAG LINES */}
          {dna.environment === 'WATER' && (
            <g className="pointer-events-none">
              {[...Array(10)].map((_, i) => {
                const viscosity = ecosystem?.fluidViscosity || 1.0;
                const hydroType = dna.modules.hydrodynamics?.type || 'none';
                const hydroScale = dna.modules.hydrodynamics?.scale || 1.0;
                
                // Efficiency improves as hydrodynamics improve
                const efficiency = hydroType === 'streamlining' ? 1 + hydroScale : hydroType === 'lateral_line' ? 1 + (hydroScale * 0.5) : 1;
                
                // Lines intensity based on viscosity and efficiency
                const intensity = (viscosity * 0.5) / efficiency;
                const speed = (0.5 + viscosity * 0.2) / efficiency;
                
                const yPos = centerY + (i - 4.5) * (bodyHeight / 4);
                const xStart = centerX - bodyWidth - 30;
                const xEnd = centerX + bodyWidth + 50;
                const delay = i * 0.15;

                return (
                  <motion.path
                    key={`water-flow-${i}`}
                    d={`M ${xStart} ${yPos} Q ${centerX - bodyWidth/2} ${yPos + (i%2===0?10:-10)} ${xEnd} ${yPos}`}
                    className="fill-none stroke-blue-400"
                    strokeWidth={0.5 + intensity * 2}
                    strokeDasharray={`${10 + intensity * 20}, ${40 - intensity * 10}`}
                    opacity={0.1 * intensity}
                    animate={{ 
                      strokeDashoffset: [0, -200],
                      opacity: [0.05 * intensity, 0.2 * intensity, 0.05 * intensity]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2 / speed, 
                      delay: delay,
                      ease: "linear"
                    }}
                  />
                );
              })}

              {/* Turbulence behind the creature */}
              {[...Array(6)].map((_, i) => {
                const viscosity = ecosystem?.fluidViscosity || 1.0;
                const hydroType = dna.modules.hydrodynamics?.type || 'none';
                const efficiency = hydroType === 'streamlining' ? 2 : hydroType === 'lateral_line' ? 1.4 : 1;
                
                const turbulenceScale = (viscosity * 1.2) / efficiency;
                const xPos = centerX + bodyWidth - 10;
                const yPos = centerY + (i - 2.5) * (bodyHeight / 3);
                
                return (
                  <motion.circle
                    key={`wake-${i}`}
                    cx={xPos}
                    cy={yPos}
                    r={2 * turbulenceScale}
                    className="fill-blue-400/10"
                    animate={{ 
                      x: [0, 40 * turbulenceScale],
                      y: [0, (Math.random() - 0.5) * 20 * turbulenceScale],
                      opacity: [0.1 * turbulenceScale, 0],
                      scale: [1, 2.5 * turbulenceScale]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1 + Math.random(), 
                      delay: i * 0.2 
                    }}
                  />
                );
              })}
            </g>
          )}

          {/* SENSORY / NERVOUS SYSTEM */}
          <g>
            {/* Eye (Front) */}
            <motion.circle 
              cx={isStreamlined ? centerX - bodyWidth/1.5 : centerX - bodyWidth/2} 
              cy={centerY - bodyHeight/4} 
              r={dna.modules.nervousSystem.complexity === 'complex' || dna.modules.sensory?.type === 'vision' ? 4 : 1.5} 
              className={isViable ? "fill-white/80" : "fill-rose-500 shadow-lg"}
              animate={isViable ? { opacity: [0.8, 1, 0.8] } : { scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            {/* Pupil for high complexity or vision */}
            {(dna.modules.nervousSystem.complexity === 'complex' || dna.modules.sensory?.type === 'vision') && (
               <motion.circle 
                cx={isStreamlined ? centerX - bodyWidth/1.5 : centerX - bodyWidth/2} 
                cy={centerY - bodyHeight/4} 
                r={1.5} 
                className="fill-black"
                animate={{ 
                  scaleX: [1, 0.2, 1, 1, 1],
                  x: [0, 1, -1, 0],
                  y: [0, -0.5, 0.5, 0]
                }}
                transition={{ 
                  scaleX: { repeat: Infinity, duration: 4, times: [0, 0.05, 0.1, 0.5, 1] },
                  x: { repeat: Infinity, duration: 3, delay: 1 },
                  y: { repeat: Infinity, duration: 2.5, delay: 0.5 }
                }}
              />
            )}
            
            {/* SENSORY SPECIFIC VISUALS */}
            {dna.modules.sensory?.type === 'echolocation' && (
              <g>
                {[...Array(3)].map((_, i) => (
                  <motion.path
                    key={i}
                    d={`M ${centerX - bodyWidth/2 - 10} ${centerY - 10} Q ${centerX - bodyWidth/2 - 20} ${centerY} ${centerX - bodyWidth/2 - 10} ${centerY + 10}`}
                    className="fill-none stroke-blue-400/40"
                    strokeWidth="1.2"
                    animate={{ 
                      x: [-bodyWidth * 0.1, -bodyWidth * 1.2],
                      opacity: [0, 0.8, 0],
                      scale: [0.8, 1.8, 0.8]
                    }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.5 }}
                  />
                ))}
              </g>
            )}

            {dna.modules.sensory?.type === 'thermal_sense' && (
               <g>
                 <motion.circle
                  cx={centerX - bodyWidth/2}
                  cy={centerY}
                  r={bodyHeight * 1.2}
                  className="fill-none stroke-orange-500/20"
                  strokeWidth="8"
                  style={{ filter: "blur(12px)" }}
                  animate={{ opacity: [0.1, 0.4, 0.1], scale: [0.9, 1.1, 0.9] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                 />
                 <motion.circle
                    cx={centerX - bodyWidth/2}
                    cy={centerY}
                    r={bodyHeight * 0.6}
                    className="fill-orange-500/10"
                    style={{ filter: "blur(4px)" }}
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                 />
               </g>
            )}

            {dna.modules.sensory?.type === 'vibration_sense' && (
               <g>
                 {[...Array(4)].map((_, i) => (
                   <motion.ellipse
                    key={i}
                    cx={centerX} cy={centerY + bodyHeight/2}
                    rx={bodyWidth * 0.5} ry={bodyHeight * 0.2}
                    className="fill-none stroke-slate-400/30"
                    strokeWidth="0.8"
                    animate={{ 
                      rx: [bodyWidth * 0.5, bodyWidth * 1.5],
                      ry: [bodyHeight * 0.2, bodyHeight * 0.5],
                      opacity: [0.6, 0] 
                    }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.5, ease: "easeOut" }}
                   />
                 ))}
                 {/* Whiskers too */}
                 {[...Array(4)].map((_, i) => (
                   <motion.line
                    key={`w-${i}`}
                    x1={centerX - bodyWidth/2} y1={centerY + (i-1.5) * 6}
                    x2={centerX - bodyWidth - 15} y2={centerY + (i-1.5) * 12}
                    className="stroke-slate-400/40"
                    strokeWidth="0.8"
                    animate={{ rotate: [-5, 5, -5] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                   />
                 ))}
               </g>
            )}
            
            {/* Neural Structures */}
            {dna.modules.nervousSystem.complexity === 'standard' && (
               <g className="opacity-30">
                 <path 
                   d={`M ${centerX - bodyWidth/2} ${centerY} L ${centerX + bodyWidth/2} ${centerY}`} 
                   className="stroke-blue-400" 
                   strokeWidth="0.8" 
                 />
                 <path 
                   d={`M ${centerX - bodyWidth/4} ${centerY - bodyHeight/4} Q ${centerX} ${centerY} ${centerX + bodyWidth/4} ${centerY + bodyHeight/4}`} 
                   className="stroke-blue-400" 
                   strokeWidth="0.4" 
                 />
               </g>
            )}
            
            {dna.modules.nervousSystem.complexity === 'cephalized' && (
               <g>
                 <circle 
                   cx={centerX - bodyWidth/2.5} 
                   cy={centerY - bodyHeight/6} 
                   r="5" 
                   className="fill-blue-400/50 shadow-lg" 
                 />
                 <path 
                    d={`M ${centerX - bodyWidth/2.5} ${centerY - bodyHeight/6} L ${centerX + bodyWidth/2} ${centerY}`}
                    className="stroke-blue-400/30"
                    strokeWidth="0.5"
                 />
               </g>
            )}

            {dna.modules.nervousSystem.complexity === 'complex' && (
              <g>
                <motion.circle 
                  cx={centerX - bodyWidth/3} 
                  cy={centerY - bodyHeight/4} 
                  r={8 + (viabilityResonance * 4)} 
                  className="fill-purple-500/40" 
                  animate={{ 
                    opacity: [0.3, 0.7 + (viabilityResonance * 0.3), 0.3],
                    scale: [0.9, 1.2 + (viabilityResonance * 0.2), 0.9],
                    filter: ["blur(1px)", `blur(${3 + viabilityResonance * 5}px)`, "blur(1px)"]
                  }}
                  transition={{ repeat: Infinity, duration: 1.2 / (viabilityResonance + 0.5) }}
                />
                
                {/* Interconnected Neural Pathways - scaling with viability */}
                {[...Array(Math.min(24, 8 + Math.floor(viabilityResonance * 16)))].map((_, i) => {
                  const angle = (i / (8 + viabilityResonance * 16)) * Math.PI * 2;
                  const dist = (bodyWidth / 1.8) * (0.3 + Math.random() * 0.7);
                  const tx = centerX + Math.cos(angle) * dist;
                  const ty = centerY + Math.sin(angle) * dist;
                  
                  return (
                    <g key={i}>
                      <motion.path
                        d={`M ${centerX - bodyWidth/3} ${centerY - bodyHeight/4} L ${tx} ${ty}`}
                        className={isViable ? "stroke-cyan-400" : "stroke-rose-400"}
                        strokeWidth={0.3 + viabilityResonance * 1.5}
                        animate={{ 
                          opacity: [0.1, 0.6 + viabilityResonance * 0.4, 0.1],
                          strokeDasharray: ["2, 20", "20, 0", "2, 20"]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1.5 + Math.random(), 
                          delay: i * 0.08,
                          ease: "easeInOut"
                        }}
                      />
                      {isViable && viabilityResonance > 0.4 && (
                        <motion.circle
                          cx={tx} cy={ty}
                          r={0.8 + viabilityResonance * 2 * Math.random()}
                          className="fill-cyan-300"
                          animate={{ 
                            opacity: [0, 0.8 + viabilityResonance * 0.2, 0],
                            scale: [0.5, 1.5 + viabilityResonance, 0.5],
                            filter: [`blur(${1 * viabilityResonance}px)`]
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 1.2, 
                            delay: i * 0.1 
                          }}
                        />
                      )}
                    </g>
                  );
                })}

                <motion.circle 
                  cx={centerX - bodyWidth/3} 
                  cy={centerY - bodyHeight/4} 
                  r="3" 
                  className="fill-white/80" 
                  animate={{ scale: [1, 1.5 + viabilityResonance, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                />
              </g>
            )}
          </g>

        </motion.g>
        )}

        {/* PREDATION RISK INDICATOR */}
        {(telemetry.predationRisk || 0) > 40 && (
          <motion.g
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [massScale * 0.95, massScale * (1.1 + (telemetry.predationRisk / 200)), massScale * 0.95],
              opacity: [0.1, 0.2 + (telemetry.predationRisk / 200), 0.1]
            }}
            transition={{ repeat: Infinity, duration: Math.max(0.3, 2.5 - ((telemetry.predationRisk || 0) / 30)) }}
          >
            <ellipse 
              cx={centerX} cy={centerY} 
              rx={bodyWidth + 25} ry={bodyHeight + 25} 
              className="fill-none stroke-rose-600" 
              strokeWidth={2 + (telemetry.predationRisk / 50)} 
              style={{ filter: `blur(${8 + (telemetry.predationRisk / 20)}px)` }}
            />
            <ellipse 
              cx={centerX} cy={centerY} 
              rx={bodyWidth + 15} ry={bodyHeight + 15} 
              className="fill-none stroke-rose-500/30" 
              strokeWidth="1"
            />
            {(telemetry.predationRisk || 0) > 70 && (
              <text x={centerX} y={centerY - bodyHeight - 35} className="fill-rose-500 font-mono text-[9px] font-black animate-pulse uppercase text-center" textAnchor="middle">
                [ PREDATORY DETECTION ]
              </text>
            )}
          </motion.g>
        )}

        {/* HUD OVERLAY */}
        <g className="opacity-40">
           <path d={`M 10 110 L 40 110`} className="stroke-slate-500" strokeWidth="0.5" />
           <path d={`M 160 110 L 190 110`} className="stroke-slate-500" strokeWidth="0.5" />
           <text x="100" y="112" textAnchor="middle" className="fill-slate-500 font-mono text-[5px] uppercase tracking-widest ">
              Biomechanical Matrix Calibration: Active
           </text>
        </g>
      </svg>

      <div className="absolute bottom-6 right-8 text-[9px] text-zinc-600 font-bold font-mono text-right flex flex-col gap-1.5">
        <span className="flex items-center justify-end gap-3">
          EXT_X <span className="text-zinc-300">{(bodyWidth * 2).toFixed(1)}m</span>
        </span>
        <span className="flex items-center justify-end gap-3">
          EXT_Y <span className="text-zinc-300">{(bodyHeight * 2).toFixed(1)}m</span>
        </span>
      </div>
      
      <div className="absolute bottom-6 left-8 text-[9px] text-zinc-500 font-bold uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/5">
        Matrix: {dna.environment}
      </div>

      {/* EKG heartbeat strip */}
      <div className="absolute bottom-14 inset-x-0 h-6 overflow-hidden pointer-events-none">
        <svg
          width="100%"
          height="24"
          viewBox="0 0 400 24"
          preserveAspectRatio="none"
          className="absolute inset-0"
        >
          <motion.path
            d={buildEkgPath(13)}
            fill="none"
            stroke={isViable ? '#34d399' : '#ef4444'}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isViable ? 0.45 : 0.3}
            animate={{ x: [0, -400] }}
            transition={{ repeat: Infinity, duration: ekgPeriod * 10, ease: 'linear' }}
          />
        </svg>
      </div>
    </div>
  );
}
