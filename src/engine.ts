import { OrganismDNA, EcosystemState, SimulationResult } from './types';

// Biological and Physical Constants
const FLESH_DENSITY = 1010; // kg/m^3
const MATERIAL_PROPERTIES = {
  standard_bone:    { strength: 170000000, density: 1900 }, // 170 MPa
  chitin:           { strength: 60000000,  density: 1200 }, // 60 MPa
  cartilage:        { strength: 3000000,   density: 1100 }, // 3 MPa
  exoskeleton:      { strength: 65000000,  density: 950  }, // chitin-like but optimized
  cartilage_matrix: { strength: 1500000,   density: 1300 }, // flexible, higher density
  peptidoglycan:    { strength: 15000000,  density: 1100 }, // bacterial cell wall
  archaeal_s_layer: { strength: 25000000,  density: 1050 }, // protein lattice, heat-stable
};
const MAMM_METABOLIC_CONSTANT = 3.39; // Watts per kg^(3/4)
const CORE_TEMP_CELSIUS = 37;
// Fick's law O2 diffusion coefficient in water (m²/s)
const O2_DIFFUSION_COEFF = 2e-9;

export const DEFAULT_ECOSYSTEM: EcosystemState = {
  ambientTemperatureCelsius: 22,
  gravityMultiplier: 1.0,
  oxygenPercentage: 21,
  fluidViscosity: 1.0,
  toxins: 0.1,
  pHLevel: 7.0,
  nutrientAvailability: 0.6,
  eventFrequency: 0.4,
};

export function evaluateSurvival(dna: OrganismDNA, incomingEcosystem: EcosystemState): SimulationResult {
  const ecosystem = { ...DEFAULT_ECOSYSTEM, ...incomingEcosystem };
  const telemetry: Partial<SimulationResult["telemetry"]> = {};
  const failureModes: string[] = [];

  const domain = dna.domain ?? "eukaryota";
  const isMicrobial = domain === "bacteria" || domain === "archaea";

  // ─── 1. VOLUME & SURFACE AREA ────────────────────────────────────────────
  const mat = MATERIAL_PROPERTIES[dna.structuralMaterial] ?? MATERIAL_PROPERTIES.standard_bone;
  const boneMass = dna.totalMassKg * dna.boneCrossSectionRatio;
  const fleshMass = dna.totalMassKg * (1 - dna.boneCrossSectionRatio);

  const volume = (boneMass / mat.density) + (fleshMass / FLESH_DENSITY);
  telemetry.volumeCuMeters = volume;

  const sphericalRadius = Math.pow((3 * volume) / (4 * Math.PI), 1 / 3);
  const baseSphericalSurfaceArea = 4 * Math.PI * Math.pow(sphericalRadius, 2);

  let surfaceArea = baseSphericalSurfaceArea * Math.sqrt(dna.geometryFactor);
  surfaceArea *= (1 + dna.morphologyComplexity * 0.4);

  if (dna.modules.thermal.type === 'vascular_ears') {
    surfaceArea *= (1 + 0.25 * dna.modules.thermal.scale);
  } else if (dna.modules.thermal.type === 'dorsal_plates') {
    surfaceArea *= (1 + 0.45 * dna.modules.thermal.scale);
  }

  telemetry.surfaceAreaSqMeters = surfaceArea;

  // Cell diameter telemetry for microbials
  if (isMicrobial) {
    telemetry.cellDiameterMicrons = sphericalRadius * 2 * 1e6;
  }

  // Domain mass range check
  if (isMicrobial && dna.totalMassKg > 1e-6) {
    failureModes.push("MICROBIAL_MASS_LIMIT_EXCEEDED");
  }
  if (!isMicrobial && dna.structuralMaterial === "peptidoglycan") {
    failureModes.push("PEPTIDOGLYCAN_WALL_INSUFFICIENT_AT_MACROSCALE");
  }

  // ─── 2. METABOLIC ENGINE (Kleiber's Law) ─────────────────────────────────
  const bmr = MAMM_METABOLIC_CONSTANT * Math.pow(dna.totalMassKg, 0.75) * dna.physiology.basalMetabolicRateMultiplier;

  let metabolicMultiplier = 1.0;

  const crossSectionalArea = Math.PI * Math.pow(sphericalRadius, 2) * (1 / Math.sqrt(dna.geometryFactor));
  let dragPenaltyValue = 0;

  if (dna.environment === "WATER") {
    dragPenaltyValue = (crossSectionalArea / 10) * 0.5;
    dragPenaltyValue *= (1 + (ecosystem.fluidViscosity - 1) * 0.3);
  } else if (dna.environment === "AIR") {
    dragPenaltyValue = (crossSectionalArea / 50) * 0.2;
  }

  dragPenaltyValue *= (1 + (dna.geometryFactor - 1) * 0.2);
  dragPenaltyValue *= (1 + dna.morphologyComplexity * 0.3);

  if (dna.modules.hydrodynamics?.type === 'streamlining') {
    dragPenaltyValue *= (1 / (1 + 0.5 * dna.modules.hydrodynamics.scale));
  } else if (dna.modules.hydrodynamics?.type === 'lateral_line') {
    dragPenaltyValue *= (1 / (1 + 0.2 * dna.modules.hydrodynamics.scale));
  }

  metabolicMultiplier += dragPenaltyValue;
  telemetry.dragPenalty = dragPenaltyValue * 100;

  if (dna.modules.locomotion.type === 'wings') metabolicMultiplier += 0.3;
  if (dna.modules.locomotion.type === 'fins') metabolicMultiplier += 0.15;
  if (dna.modules.locomotion.type === 'spring_legs') metabolicMultiplier += 0.2;
  if (dna.modules.locomotion.type === 'flagella') metabolicMultiplier += 0.05; // flagella are energetically cheap
  if (dna.modules.respiration.type === 'avian_lung') metabolicMultiplier += 0.1;

  if (dna.environment === "WATER" || dna.environment === "AIR") {
    metabolicMultiplier *= 1.15;
  }

  // Neurology cost — "none" complexity falls through all conditions = 0 cost
  let neuCost = 0;
  const brainComplexity = dna.modules.nervousSystem?.complexity || "primitive";
  if (brainComplexity === "primitive") neuCost = bmr * 0.05;
  else if (brainComplexity === "standard") neuCost = bmr * 0.1;
  else if (brainComplexity === "cephalized") neuCost = bmr * 0.2;
  else if (brainComplexity === "complex") neuCost = bmr * 0.4;

  telemetry.neurologicalCostWatts = neuCost;

  let sensoryCost = 0;
  const sensoryType = dna.modules.sensory?.type || "none";
  const acuity = dna.modules.sensory?.acuity || 0.5;

  if (sensoryType !== "none") {
    const baseCost = bmr * 0.02;
    if (sensoryType === "vision") sensoryCost = baseCost * 5 * acuity;
    else if (sensoryType === "echolocation") sensoryCost = baseCost * 10 * acuity;
    else if (sensoryType === "thermal_sense") sensoryCost = baseCost * 4 * acuity;
    else if (sensoryType === "vibration_sense") sensoryCost = baseCost * 3 * acuity;
    else if (sensoryType === "chemoreception") sensoryCost = baseCost * 1.5 * acuity; // cheap but effective for microbes
  }

  const morphoCost = bmr * (dna.morphologyComplexity * 0.15);
  const totalMetabolicRate = bmr * metabolicMultiplier + neuCost + morphoCost + sensoryCost;

  if (neuCost + sensoryCost > totalMetabolicRate * 0.50) {
    failureModes.push("NEUROLOGICAL_OVERLOAD");
  }

  telemetry.metabolicRateWatts = totalMetabolicRate;
  telemetry.heatGeneratedWatts = totalMetabolicRate;

  // ─── 3. ENERGY SOURCING & NUTRIENT LIMITS ────────────────────────────────
  let energyIntake = 0;
  const trophicModule = dna.modules.trophic || { type: 'photoautotroph', efficiency: 0.5 };
  const trophicType = trophicModule.type;
  const trophicEfficiency = trophicModule.efficiency;

  if (trophicType === "photoautotroph" || trophicType === "photosynthesis") {
    let solarFlux = 120;
    if (dna.environment === "WATER") solarFlux = 60;
    energyIntake = surfaceArea * solarFlux * trophicEfficiency;
  } else if (trophicType === "herbivore") {
    energyIntake = Math.pow(dna.totalMassKg, 0.72) * 20 * trophicEfficiency * ecosystem.nutrientAvailability;
  } else if (trophicType === "carnivore") {
    energyIntake = Math.pow(dna.totalMassKg, 0.78) * 30 * trophicEfficiency * ecosystem.nutrientAvailability;
  } else if (trophicType === "chemoautotroph") {
    energyIntake = dna.totalMassKg * (10 + ecosystem.toxins * 20) * trophicEfficiency;
  }

  // Quorum sensing bonus for microbials
  if (isMicrobial) {
    const quorumBonus = dna.morphologyComplexity * 0.5 * ecosystem.nutrientAvailability;
    telemetry.quorumSensingBonus = quorumBonus * 100;
    energyIntake *= (1 + quorumBonus);
  }

  // Archaea extremophile bonuses: extreme pH and high temperature fuel metabolism
  if (domain === "archaea") {
    const pHExtremity = Math.abs(ecosystem.pHLevel - 7.0);
    const pHBonus = pHExtremity * (dna.modules.chemicalTolerance?.pHResistance || 0.5) * 0.3;
    energyIntake *= (1 + pHBonus);

    if (ecosystem.ambientTemperatureCelsius > 60) {
      const thermoBonus = Math.min(0.5, (ecosystem.ambientTemperatureCelsius - 60) * 0.01);
      energyIntake *= (1 + thermoBonus);
    }
  }

  // Nutrient bottleneck
  const baseNutrientCap = 100000;
  const dynamicNutrientLimit = baseNutrientCap * ecosystem.nutrientAvailability;
  telemetry.nutrientLimitKg = dynamicNutrientLimit;

  if (dna.totalMassKg > dynamicNutrientLimit) {
    failureModes.push("NUTRIENT_LIMIT_EXCEEDED_STUNTED_GROWTH");
  }

  telemetry.energyIntakeWatts = energyIntake;

  if (sensoryType !== "none") {
    if (trophicType === "herbivore" || trophicType === "carnivore") {
      let bonus = 1.0 + (acuity * 0.2);
      if (sensoryType === "vision" && dna.environment !== "WATER") bonus *= 1.1;
      if (sensoryType === "echolocation" && dna.environment === "WATER") bonus *= 1.2;
      if (sensoryType === "chemoreception") bonus *= (1 + acuity * 0.3);
      energyIntake *= bonus;
    }
  }

  if (totalMetabolicRate > energyIntake) {
    failureModes.push("METABOLIC_STARVATION_DEFICIT");
  }

  const energyReserves = Math.min(100, (energyIntake / (totalMetabolicRate || 1)) * 100 * dna.physiology.energyStorageCapacity);
  telemetry.energyReserves = energyReserves;

  if (energyReserves < 15) failureModes.push("ENERGY_DEPLETION");
  if (energyReserves < 5)  failureModes.push("FATAL_METABOLIC_COLLAPSE");

  // ─── 4. THERMODYNAMICS ───────────────────────────────────────────────────
  // Microbials are poikilotherms — skip the mammalian thermal retention model.
  // They do die at extreme temperatures though.
  if (!isMicrobial) {
    const tempDifferential = CORE_TEMP_CELSIUS - ecosystem.ambientTemperatureCelsius;
    let heatTransferCoefficient = 10;
    if (dna.environment === "WATER") heatTransferCoefficient = 250;

    if (dna.modules.thermal.type === 'blubber') {
      heatTransferCoefficient *= (1 / (1 + 0.8 * dna.modules.thermal.scale));
    }

    let maxHeatDissipation = surfaceArea * heatTransferCoefficient * tempDifferential;
    if (dna.environment === "AIR") maxHeatDissipation *= 1.8;

    telemetry.maxHeatDissipationWatts = maxHeatDissipation;

    if (telemetry.heatGeneratedWatts! > maxHeatDissipation) {
      failureModes.push("LETHAL_THERMAL_RETENTION");
    } else if (tempDifferential > 0 && maxHeatDissipation > telemetry.heatGeneratedWatts! * 4) {
      failureModes.push("LETHAL_THERMAL_DISSIPATION_FREEZE");
    }
  } else {
    // Microbial temperature limits
    const temp = ecosystem.ambientTemperatureCelsius;
    if (domain === "bacteria") {
      // Standard bacteria: viable -5°C to 95°C
      if (temp < -5 || temp > 95) failureModes.push("MICROBIAL_TEMPERATURE_LETHAL");
    } else {
      // Archaea: survive wider range, thrive at extremes
      if (temp < -20 || temp > 130) failureModes.push("MICROBIAL_TEMPERATURE_LETHAL");
    }
    telemetry.maxHeatDissipationWatts = surfaceArea * 100 * Math.abs(37 - ecosystem.ambientTemperatureCelsius);
  }

  // ─── 5. OSMOREGULATION & WATER BALANCE ───────────────────────────────────
  let waterLossRate = 0;
  if (dna.environment === "LAND") {
    waterLossRate = (surfaceArea / dna.totalMassKg) * 0.15;
  } else if (dna.environment === "AIR") {
    waterLossRate = (surfaceArea / dna.totalMassKg) * 0.25;
  } else {
    waterLossRate = 0.02;
  }

  const hydrationStability = 1.0 - (waterLossRate * (1.0 - dna.waterRetentionScale));
  telemetry.hydrationStability = Math.max(0, hydrationStability * 100);

  if (telemetry.hydrationStability < 40) {
    failureModes.push("HYDRATION_OSMOTIC_CRITICAL_FAILURE");
  }
  if (dna.environment === "WATER" && dna.waterRetentionScale < 0.4 && telemetry.hydrationStability < 60) {
    failureModes.push("SALINITY_IMBALANCE");
  }

  // ─── 6. CHEMICAL TOXICITY & pH ───────────────────────────────────────────
  const chemDNA = dna.modules.chemicalTolerance || { toxicityResistance: 0.5, pHResistance: 0.5 };

  let toxicResistance = chemDNA.toxicityResistance;
  toxicResistance += trophicEfficiency * 0.2;

  const toxicStress = Math.max(0, (ecosystem.toxins - toxicResistance) * 100);
  telemetry.toxicStress = toxicStress;
  telemetry.toxicResistance = toxicResistance;

  if (toxicStress > 50) failureModes.push("SYSTEMIC_TOXIC_OVERLOAD");
  if (toxicStress > 80) failureModes.push("FATAL_CHEMICAL_POISONING");

  // Bacteria are extra-sensitive to antibiotics (proxied via toxins)
  if (domain === "bacteria") {
    const antibioticStress = toxicStress * 1.5;
    if (antibioticStress > 60) failureModes.push("ANTIBIOTIC_MEMBRANE_DISRUPTION");
  }

  const pHDeviation = Math.abs(ecosystem.pHLevel - 7.0);

  if (domain === "archaea") {
    // Archaea are extremophiles — only fail at truly unlivable pH extremes
    const archaialPHLimit = 4.0 + chemDNA.pHResistance * 6.0;
    if (pHDeviation > archaialPHLimit) {
      if (ecosystem.pHLevel < 7) failureModes.push("METABOLIC_ACIDOSIS");
      else failureModes.push("METABOLIC_ALKALOSIS");
    }
  } else {
    const pHStressLimit = 2.0 + (chemDNA.pHResistance * 4.0);
    if (pHDeviation > pHStressLimit) {
      if (ecosystem.pHLevel < 7) failureModes.push("METABOLIC_ACIDOSIS");
      else failureModes.push("METABOLIC_ALKALOSIS");
    }
  }

  // ─── 7. BIOMECHANICAL STRUCTURAL ─────────────────────────────────────────
  const gravityForce = 9.81 * ecosystem.gravityMultiplier;
  const downwardForceNewtons = dna.totalMassKg * gravityForce;

  const totalBoneVolume = (dna.totalMassKg * dna.boneCrossSectionRatio) / mat.density;
  const boneCrossLength = sphericalRadius * 2;
  const boneCrossSectionArea = totalBoneVolume / (boneCrossLength || 1);

  let mechanicalStress = downwardForceNewtons / (boneCrossSectionArea || 0.001);

  if (dna.modules.locomotion.type === 'spring_legs') mechanicalStress *= 0.85;
  else if (dna.modules.locomotion.type === 'columnar_legs') mechanicalStress *= 0.7;

  if (dna.structuralMaterial === 'cartilage_matrix') mechanicalStress *= 0.6;

  const materialLimit = mat.strength;

  // Microbials aren't stressed by gravity — surface tension and osmotic forces dominate
  telemetry.skeletalStressPascals = isMicrobial ? 0 : (dna.environment === "WATER" ? mechanicalStress * 0.1 : mechanicalStress);
  telemetry.skeletalLimitPascals = materialLimit;

  if (!isMicrobial && mechanicalStress > materialLimit) {
    failureModes.push("STRUCTURAL_SKELETAL_COLLAPSE");
  }

  // ─── 8. PREDATION RISK & FOOD WEB ────────────────────────────────────────
  const sizeRisk = Math.log10(dna.totalMassKg + 1) * 0.1;
  const intelligenceBonus = brainComplexity === "complex" ? 0.8 : brainComplexity === "cephalized" ? 0.6 : brainComplexity === "standard" ? 0.3 : 0;

  let detectionBonus = 0;
  if (dna.modules.hydrodynamics?.type === 'lateral_line') detectionBonus += 0.2 * (dna.modules.hydrodynamics.scale || 1.0);
  if (sensoryType === "vision") detectionBonus += 0.3 * acuity;
  if (sensoryType === "echolocation") detectionBonus += 0.4 * acuity;
  if (sensoryType === "thermal_sense") detectionBonus += 0.2 * acuity;
  if (sensoryType === "vibration_sense") detectionBonus += 0.25 * acuity;
  if (sensoryType === "chemoreception") detectionBonus += 0.35 * acuity; // chemotaxis is effective for microbes

  let predationMultiplier = 1.0;
  if (dna.predatorType === "apex") predationMultiplier = 0.2;
  else if (dna.predatorType === "mesopredator") predationMultiplier = 0.6;

  if (dna.preyType === "specialist") predationMultiplier *= 1.5;
  else if (dna.preyType === "opportunistic") predationMultiplier *= 0.8;

  // Microbials face phage/protist predation — smaller = more risk
  const microbialPredationMod = isMicrobial ? 1.8 : 1.0;

  const predationRisk = Math.max(0, (sizeRisk * (1 - intelligenceBonus - detectionBonus)) * 100 * predationMultiplier * microbialPredationMod);
  telemetry.predationRisk = predationRisk;

  if (predationRisk > 80) failureModes.push("PREDATION_EXTERMINATION_RISK_CAP");

  // ─── 9. RESPIRATION ──────────────────────────────────────────────────────
  const o2Demand = telemetry.metabolicRateWatts * 0.005;
  let o2SupplyCap = 0;

  const { type: respType, efficiency: respEff } = dna.modules.respiration;
  const gasRatio = (ecosystem.oxygenPercentage / 21);

  if (isMicrobial) {
    if (respType !== "membrane_diffusion") {
      failureModes.push("MACROSCOPIC_RESPIRATION_ORGAN_IMPOSSIBLE");
      o2SupplyCap = 0;
    } else {
      // Fick's Law: J = D * A * ΔC / L (where L = cell radius)
      const concGrad = gasRatio * 0.0085; // relative O2 mol/L
      o2SupplyCap = (O2_DIFFUSION_COEFF * surfaceArea * concGrad * respEff) / (sphericalRadius || 1e-9);
    }
  } else {
    if (respType === "membrane_diffusion") {
      // Membrane diffusion is insufficient for macroscopic organisms
      const diffusionLimit = (O2_DIFFUSION_COEFF * surfaceArea * gasRatio * 0.0085) / (sphericalRadius || 0.001);
      o2SupplyCap = diffusionLimit;
      if (dna.totalMassKg > 0.001) {
        failureModes.push("MEMBRANE_DIFFUSION_INSUFFICIENT_MACROSCALE");
      }
    } else if (respType === "mammalian_lung") {
      o2SupplyCap = Math.pow(dna.totalMassKg, 0.9) * gasRatio * respEff;
    } else if (respType === "avian_lung") {
      o2SupplyCap = Math.pow(dna.totalMassKg, 0.9) * gasRatio * 1.25 * respEff;
    } else if (respType === "tracheae") {
      o2SupplyCap = (surfaceArea / sphericalRadius) * gasRatio * 15 * respEff;
      const dynamicTrachealLimit = 2.0 * Math.pow(gasRatio, 1.5);
      telemetry.trachealLimit = dynamicTrachealLimit;
      if (dna.totalMassKg > dynamicTrachealLimit) {
        failureModes.push("TRACHEAL_DIFFUSION_LIMIT_BREACHED_ANOXIC_CHOICE");
      }
    } else if (respType === "gills") {
      if (dna.environment !== "WATER") {
        failureModes.push("GILL_FILAMENT_DESICCATION_FAILURE");
        o2SupplyCap = 0;
      } else {
        o2SupplyCap = Math.pow(dna.totalMassKg, 0.8) * gasRatio * 1.5 * respEff;
      }
    }
  }

  telemetry.oxygenDemandRate = o2Demand;
  telemetry.oxygenSupplyRate = o2SupplyCap;

  if (o2Demand > o2SupplyCap) failureModes.push("SYSTEMIC_TISSUE_ANOXIA");

  // ─── 10. LOCOMOTION CONSTRAINTS ──────────────────────────────────────────
  if (dna.modules.locomotion.type === 'wings') {
    const wingArea = dna.modules.locomotion.wingAreaSqM || 1.0;
    const loading = dna.totalMassKg / wingArea;
    telemetry.wingLoading = loading;
    if (loading > 35) failureModes.push("FLIGHT_WING_LOADING_MAXIMUM_BREACHED");
    if (dna.environment !== 'AIR') telemetry.heatGeneratedWatts! *= 1.2;
  }

  if (dna.environment === "AIR" && dna.totalMassKg > 40) {
    failureModes.push("AERODYNAMIC_MASS_LIMIT_EXCEEDED");
  }

  // Macroscopic locomotion organs are impossible for microbials
  if (isMicrobial && ['wings', 'spring_legs', 'columnar_legs', 'fins'].includes(dna.modules.locomotion.type)) {
    failureModes.push("MACROSCOPIC_LOCOMOTION_INVALID_FOR_PROKARYOTE");
  }

  // Flagella are only meaningful for prokaryotes
  if (!isMicrobial && dna.modules.locomotion.type === 'flagella') {
    failureModes.push("FLAGELLA_ONLY_VALID_FOR_PROKARYOTES");
  }

  // ─── 11. REPRODUCTION STRATEGY ───────────────────────────────────────────
  const strategy = dna.modules.reproduction?.strategy || "r_selection";
  const clutch = dna.modules.reproduction?.clutchSize || 10;

  let strategyCostMultiplier = 1.0;
  let strategyPotentialMultiplier = 1.0;

  if (strategy === "K_selection") {
    strategyCostMultiplier = 10.0;
    strategyPotentialMultiplier = 1.0;
  } else if (strategy === "r_selection") {
    strategyCostMultiplier = 1.0;
    strategyPotentialMultiplier = 2.0;
  } else if (strategy === "iteroparity") {
    strategyCostMultiplier = 5.0;
    strategyPotentialMultiplier = 1.5;
  } else if (strategy === "semelparity") {
    strategyCostMultiplier = 20.0;
    strategyPotentialMultiplier = 8.0;
  } else if (strategy === "binary_fission") {
    // Extremely cheap, rapid reproduction — defines microbial success
    strategyCostMultiplier = 0.1;
    strategyPotentialMultiplier = 15.0;
    if (!isMicrobial) failureModes.push("BINARY_FISSION_INVALID_FOR_EUKARYOTA");
  }

  const reproductiveCost = (clutch * (dna.totalMassKg * 0.05)) * strategyCostMultiplier;
  const surplusEnergy = energyIntake - totalMetabolicRate;
  const reproductionPotential = Math.max(0, surplusEnergy / (reproductiveCost || 1));

  telemetry.reproductionPotential = reproductionPotential * strategyPotentialMultiplier;

  if (reproductionPotential < 0.05) failureModes.push("REPRODUCTIVE_VIABILITY_LOST");

  // ─── SCORES ───────────────────────────────────────────────────────────────
  const stressRatio = Math.min(1, (telemetry.skeletalStressPascals || 0) / (telemetry.skeletalLimitPascals || 1));
  const totalStress = stressRatio * 50 +
                     (telemetry.toxicStress || 0) * 0.3 +
                     (100 - (telemetry.energyReserves || 0)) * 0.2;

  telemetry.viabilityScore = Math.max(0, 100 - totalStress);

  const survivalBonus = failureModes.length === 0 ? 1 : -5;
  telemetry.fitnessScore = Math.max(0, (telemetry.viabilityScore / 1000) + (survivalBonus / 100));

  if (dna.modules.hydrodynamics?.type === 'streamlining' && dna.physiology.basalMetabolicRateMultiplier > 1.5) {
    telemetry.predationRisk = (telemetry.predationRisk || 0) * 0.7;
  }

  // Binary fission organisms need to be modeled without generation count
  telemetry.generation = telemetry.generation ?? 0;

  return {
    isViable: failureModes.length === 0,
    telemetry: telemetry as SimulationResult["telemetry"],
    failureModes
  };
}
