import { OrganismDNA, EcosystemState, SimulationResult } from './types';

// Biological and Physical Constants
const FLESH_DENSITY = 1010; // kg/m^3 (approximate density of water/flesh)
const MATERIAL_PROPERTIES = {
  standard_bone: { strength: 170000000, density: 1900 }, // 170 MPa
  chitin: { strength: 60000000, density: 1200 },         // 60 MPa
  cartilage: { strength: 3000000, density: 1100 },       // 3 MPa
  exoskeleton: { strength: 65000000, density: 950 },     // Chitin-like but optimized
  cartilage_matrix: { strength: 1500000, density: 1300 } // Flexible, higher density
};
const MAMM_METABOLIC_CONSTANT = 3.39; // Watts per kg^(3/4)
const CORE_TEMP_CELSIUS = 37;

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

  // 1. VOLUME & SURFACE AREA CALCULATION
  const mat = MATERIAL_PROPERTIES[dna.structuralMaterial];
  const boneMass = dna.totalMassKg * dna.boneCrossSectionRatio;
  const fleshMass = dna.totalMassKg * (1 - dna.boneCrossSectionRatio);
  
  const volume = (boneMass / mat.density) + (fleshMass / FLESH_DENSITY);
  telemetry.volumeCuMeters = volume;

  const sphericalRadius = Math.pow((3 * volume) / (4 * Math.PI), 1 / 3);
  const baseSphericalSurfaceArea = 4 * Math.PI * Math.pow(sphericalRadius, 2);
  
  let surfaceArea = baseSphericalSurfaceArea * Math.sqrt(dna.geometryFactor);
  
  // Morphology complexity adds extra surface area folds
  surfaceArea *= (1 + dna.morphologyComplexity * 0.4);
  
  // Apply thermal module modifiers to surface area
  if (dna.modules.thermal.type === 'vascular_ears') {
    surfaceArea *= (1 + 0.25 * dna.modules.thermal.scale);
  } else if (dna.modules.thermal.type === 'dorsal_plates') {
    surfaceArea *= (1 + 0.45 * dna.modules.thermal.scale);
  }
  
  telemetry.surfaceAreaSqMeters = surfaceArea;

  // 2. METABOLIC ENGINE (Kleiber's Law)
  const bmr = MAMM_METABOLIC_CONSTANT * Math.pow(dna.totalMassKg, 0.75) * dna.physiology.basalMetabolicRateMultiplier;
  
  // Metabolic overhead from active modules
  let metabolicMultiplier = 1.0;
  
  // Drag Penalty: High density environments require more energy to move through
  const crossSectionalArea = Math.PI * Math.pow(sphericalRadius, 2) * (1 / Math.sqrt(dna.geometryFactor));
  let dragPenaltyValue = 0;
  
  if (dna.environment === "WATER") {
    dragPenaltyValue = (crossSectionalArea / 10) * 0.5;
    // Fluid viscosity scaling
    dragPenaltyValue *= (1 + (ecosystem.fluidViscosity - 1) * 0.3);
  } else if (dna.environment === "AIR") {
    dragPenaltyValue = (crossSectionalArea / 50) * 0.2;
  }
  
  // Refined drag: Elongated shapes have higher surface friction / complex wake turbulence
  dragPenaltyValue *= (1 + (dna.geometryFactor - 1) * 0.2);
  
  // Morphology complexity adds drag
  dragPenaltyValue *= (1 + dna.morphologyComplexity * 0.3);
  
  // Hydrodynamic refinements
  if (dna.modules.hydrodynamics?.type === 'streamlining') {
    dragPenaltyValue *= (1 / (1 + 0.5 * dna.modules.hydrodynamics.scale));
  } else if (dna.modules.hydrodynamics?.type === 'lateral_line') {
    // Lateral line helps with sensing flow and reducing turbulence impact
    dragPenaltyValue *= (1 / (1 + 0.2 * dna.modules.hydrodynamics.scale));
  }

  metabolicMultiplier += dragPenaltyValue;
  telemetry.dragPenalty = dragPenaltyValue * 100; // Store as percentage

  if (dna.modules.locomotion.type === 'wings') metabolicMultiplier += 0.3;
  if (dna.modules.locomotion.type === 'fins') metabolicMultiplier += 0.15; // Fins are efficient in water
  if (dna.modules.locomotion.type === 'spring_legs') metabolicMultiplier += 0.2;
  if (dna.modules.respiration.type === 'avian_lung') metabolicMultiplier += 0.1;

  // Environment-specific metabolic scaling: Moving in fluid is inherently more expensive
  if (dna.environment === "WATER" || dna.environment === "AIR") {
    metabolicMultiplier *= 1.15;
  }

  // Neurology: High complexity requires significant energy overhead
  let neuCost = 0;
  const brainComplexity = dna.modules.nervousSystem?.complexity || "standard";
  if (brainComplexity === "primitive") neuCost = bmr * 0.05;
  else if (brainComplexity === "standard") neuCost = bmr * 0.1;
  else if (brainComplexity === "cephalized") neuCost = bmr * 0.2;
  else if (brainComplexity === "complex") neuCost = bmr * 0.4;
  
  telemetry.neurologicalCostWatts = neuCost;
  
  // SENSORY OVERHEAD
  let sensoryCost = 0;
  const sensoryType = dna.modules.sensory?.type || "none";
  const acuity = dna.modules.sensory?.acuity || 0.5;
  
  if (sensoryType !== "none") {
    const baseCost = bmr * 0.02;
    if (sensoryType === "vision") sensoryCost = baseCost * 5 * acuity;
    else if (sensoryType === "echolocation") sensoryCost = baseCost * 10 * acuity;
    else if (sensoryType === "thermal_sense") sensoryCost = baseCost * 4 * acuity;
    else if (sensoryType === "vibration_sense") sensoryCost = baseCost * 3 * acuity;
  }

  const morphoCost = bmr * (dna.morphologyComplexity * 0.15);
  const totalMetabolicRate = bmr * metabolicMultiplier + neuCost + morphoCost + sensoryCost;
  
  if (neuCost + sensoryCost > totalMetabolicRate * 0.50) {
    failureModes.push("NEUROLOGICAL_OVERLOAD");
  }

  telemetry.metabolicRateWatts = totalMetabolicRate;
  telemetry.heatGeneratedWatts = totalMetabolicRate; 

  // 3. ENERGY SOURCING & NUTRIENT LIMITS
  let energyIntake = 0;
  const trophicModule = dna.modules.trophic || { type: 'photoautotroph', efficiency: 0.5 };
  const trophicType = trophicModule.type;
  const trophicEfficiency = trophicModule.efficiency;

  if (trophicType === "photoautotroph" || trophicType === "photosynthesis") {
    // Sunlight capture depends on surface area (assuming solar-facing exposure)
    // Environmental factor: Photosynthesis is harder in WATER due to attenuation
    let solarFlux = 120; // Watts per m2 baseline
    if (dna.environment === "WATER") solarFlux = 60; // Light attenuation
    
    energyIntake = surfaceArea * solarFlux * trophicEfficiency; 
  } else if (trophicType === "herbivore") {
    // Herbivores depend on grazing capacity (mass-scaled) and nutrient availability
    energyIntake = Math.pow(dna.totalMassKg, 0.72) * 20 * trophicEfficiency * ecosystem.nutrientAvailability;
  } else if (trophicType === "carnivore") {
    // Carnivores have high energy density food but harder to catch (scaled differently)
    energyIntake = Math.pow(dna.totalMassKg, 0.78) * 30 * trophicEfficiency * ecosystem.nutrientAvailability;
  } else if (trophicType === "chemoautotroph") {
    // Chemosynthesis depends on chemical gradient volume, mass-based
    // Bonus in high toxin environments (using toxins as reactant proxy)
    energyIntake = dna.totalMassKg * (10 + ecosystem.toxins * 20) * trophicEfficiency;
  }

  // Nutrient bottleneck: The absolute limit of biomass possible in the environment
  const baseNutrientCap = 100000; // Total mass achievable at 100% nutrient availability
  const dynamicNutrientLimit = baseNutrientCap * ecosystem.nutrientAvailability;
  telemetry.nutrientLimitKg = dynamicNutrientLimit;

  if (dna.totalMassKg > dynamicNutrientLimit) {
    failureModes.push("NUTRIENT_LIMIT_EXCEEDED_STUNTED_GROWTH");
  }

  telemetry.energyIntakeWatts = energyIntake;
  
  // SENSORY INTAKE BOOST (Herbivores and Carnivores)
  if (sensoryType !== "none") {
    if (trophicType === "herbivore" || trophicType === "carnivore") {
       let bonus = 1.0 + (acuity * 0.2);
       // Optimization: vision in AIR is great, Echolocation in WATER is great
       if (sensoryType === "vision" && dna.environment !== "WATER") bonus *= 1.1;
       if (sensoryType === "echolocation" && dna.environment === "WATER") bonus *= 1.2;
       energyIntake *= bonus;
    }
  }

  // ENERGY BALANCE CHECK
  if (totalMetabolicRate > energyIntake) {
    failureModes.push("METABOLIC_STARVATION_DEFICIT");
  }

  // Energy Reserves Calculation
  const energyReserves = Math.min(100, (energyIntake / (totalMetabolicRate || 1)) * 100 * dna.physiology.energyStorageCapacity);
  telemetry.energyReserves = energyReserves;

  if (energyReserves < 15) {
    failureModes.push("ENERGY_DEPLETION");
  }

  if (energyReserves < 5) {
    failureModes.push("FATAL_METABOLIC_COLLAPSE");
  }

  // 4. THERMODYNAMICS LAYER
  const tempDifferential = CORE_TEMP_CELSIUS - ecosystem.ambientTemperatureCelsius;
  
  let heatTransferCoefficient = 10; 
  if (dna.environment === "WATER") {
    heatTransferCoefficient = 250; 
  }

  // Blubber reduces heat transfer
  if (dna.modules.thermal.type === 'blubber') {
    heatTransferCoefficient *= (1 / (1 + 0.8 * dna.modules.thermal.scale));
  }

  let maxHeatDissipation = surfaceArea * heatTransferCoefficient * tempDifferential;
  
  if (dna.environment === "AIR") {
    maxHeatDissipation *= 1.8; 
  }
  
  telemetry.maxHeatDissipationWatts = maxHeatDissipation;

  if (telemetry.heatGeneratedWatts! > maxHeatDissipation) {
    failureModes.push("LETHAL_THERMAL_RETENTION");
  } else if (tempDifferential > 0 && maxHeatDissipation > telemetry.heatGeneratedWatts! * 4) {
    failureModes.push("LETHAL_THERMAL_DISSIPATION_FREEZE");
  }

  // 5. OSMOREGULATION & WATER BALANCE
  let waterLossRate = 0;
  if (dna.environment === "LAND") {
    waterLossRate = (surfaceArea / dna.totalMassKg) * 0.15;
  } else if (dna.environment === "AIR") {
    waterLossRate = (surfaceArea / dna.totalMassKg) * 0.25;
  } else {
    waterLossRate = 0.02; // Minimal osmotic exchange in water
  }

  // Applying retention scale (1.0 = 100% loss, 0.0 = total retention)
  const hydrationStability = 1.0 - (waterLossRate * (1.0 - dna.waterRetentionScale));
  telemetry.hydrationStability = Math.max(0, hydrationStability * 100);

  if (telemetry.hydrationStability < 40) {
    failureModes.push("HYDRATION_OSMOTIC_CRITICAL_FAILURE");
  }

  // Salinity imbalance: WATER environment specific constraint
  if (dna.environment === "WATER" && dna.waterRetentionScale < 0.4 && telemetry.hydrationStability < 60) {
    failureModes.push("SALINITY_IMBALANCE");
  }

  // 6. CHEMICAL TOXICITY & pH BALANCE
  const chemDNA = dna.modules.chemicalTolerance || { toxicityResistance: 0.5, pHResistance: 0.5 };

  let toxicResistance = chemDNA.toxicityResistance;
  toxicResistance += trophicEfficiency * 0.2;
  
  const toxicStress = Math.max(0, (ecosystem.toxins - toxicResistance) * 100);
  telemetry.toxicStress = toxicStress;
  telemetry.toxicResistance = toxicResistance;

  if (toxicStress > 50) {
    failureModes.push("SYSTEMIC_TOXIC_OVERLOAD");
  }
  if (toxicStress > 80) {
    failureModes.push("FATAL_CHEMICAL_POISONING");
  }

  // pH Logic: Deviation from neutral (7.0) creates acidosis/alkalosis stress
  const pHDeviation = Math.abs(ecosystem.pHLevel - 7.0);
  const pHStressLimit = 2.0 + (chemDNA.pHResistance * 4.0); // Can tolerate 2-6 units of dev
  
  if (pHDeviation > pHStressLimit) {
    if (ecosystem.pHLevel < 7) failureModes.push("METABOLIC_ACIDOSIS");
    else failureModes.push("METABOLIC_ALKALOSIS");
  }

  // 7. BIOMECHANICAL STRUCTURAL LAYER
  const gravityForce = 9.81 * ecosystem.gravityMultiplier;
  const downwardForceNewtons = dna.totalMassKg * gravityForce;
  
  const totalBoneVolume = (dna.totalMassKg * dna.boneCrossSectionRatio) / mat.density;
  const boneCrossLength = sphericalRadius * 2;
  const boneCrossSectionArea = totalBoneVolume / (boneCrossLength || 1); 

  let mechanicalStress = downwardForceNewtons / (boneCrossSectionArea || 0.001);
  
  // Locomotion and material trade-offs
  if (dna.modules.locomotion.type === 'spring_legs') {
    mechanicalStress *= 0.85; // Better load distribution/handling
  } else if (dna.modules.locomotion.type === 'columnar_legs') {
    mechanicalStress *= 0.7; // Columns handle more load efficiently
  }

  if (dna.structuralMaterial === 'cartilage_matrix') {
    mechanicalStress *= 0.6; // Flexibility reduces point stress impact
  }

  const materialLimit = mat.strength;

  telemetry.skeletalStressPascals = dna.environment === "WATER" ? mechanicalStress * 0.1 : mechanicalStress; 
  telemetry.skeletalLimitPascals = materialLimit;

  if (mechanicalStress > materialLimit) {
    failureModes.push("STRUCTURAL_SKELETAL_COLLAPSE");
  }

  // 8. PREDATION RISK & FOOD WEB
  // Smaller organisms are faster, larger ones are targets.
  // Brain complexity helps evade predators.
  // Predator/Prey types influence risk
  const sizeRisk = Math.log10(dna.totalMassKg + 1) * 0.1;
  const intelligenceBonus = brainComplexity === "complex" ? 0.8 : brainComplexity === "cephalized" ? 0.6 : brainComplexity === "standard" ? 0.3 : 0;
  
  let detectionBonus = 0;
  if (dna.modules.hydrodynamics?.type === 'lateral_line') {
    detectionBonus += 0.2 * (dna.modules.hydrodynamics.scale || 1.0);
  }
  
  if (sensoryType === "vision") detectionBonus += 0.3 * acuity;
  if (sensoryType === "echolocation") detectionBonus += 0.4 * acuity;
  if (sensoryType === "thermal_sense") detectionBonus += 0.2 * acuity;
  if (sensoryType === "vibration_sense") detectionBonus += 0.25 * acuity;

  // Food Web Multipliers
  let predationMultiplier = 1.0;
  if (dna.predatorType === "apex") predationMultiplier = 0.2;
  else if (dna.predatorType === "mesopredator") predationMultiplier = 0.6;
  
  if (dna.preyType === "specialist") predationMultiplier *= 1.5; // Specialists are easier to track if found
  else if (dna.preyType === "opportunistic") predationMultiplier *= 0.8; // Harder to pin down behaviorally
  
  const predationRisk = Math.max(0, (sizeRisk * (1 - intelligenceBonus - detectionBonus)) * 100 * predationMultiplier);
  telemetry.predationRisk = predationRisk;

  if (predationRisk > 80) {
    failureModes.push("PREDATION_EXTERMINATION_RISK_CAP");
  }

  // 9. RESPIRATION LAYER (Modular)
  const o2Demand = telemetry.metabolicRateWatts * 0.005; 
  let o2SupplyCap = 0;

  const { type, efficiency } = dna.modules.respiration;
  const gasRatio = (ecosystem.oxygenPercentage / 21);

  if (type === "mammalian_lung") {
    o2SupplyCap = Math.pow(dna.totalMassKg, 0.9) * gasRatio * efficiency;
  } else if (type === "avian_lung") {
    o2SupplyCap = Math.pow(dna.totalMassKg, 0.9) * gasRatio * 1.25 * efficiency;
  } else if (type === "tracheae") {
    o2SupplyCap = (surfaceArea / sphericalRadius) * gasRatio * 15 * efficiency;
    
    // Dynamic tracheal limit: In higher O2 environments, diffusion can support larger mass.
    // Baseline: 2kg at 21% O2.
    const dynamicTrachealLimit = 2.0 * Math.pow(gasRatio, 1.5); 
    telemetry.trachealLimit = dynamicTrachealLimit;
    if (dna.totalMassKg > dynamicTrachealLimit) {
      failureModes.push("TRACHEAL_DIFFUSION_LIMIT_BREACHED_ANOXIC_CHOICE");
    }
  } else if (type === "gills") {
    if (dna.environment !== "WATER") {
      failureModes.push("GILL_FILAMENT_DESICCATION_FAILURE");
      o2SupplyCap = 0;
    } else {
      o2SupplyCap = Math.pow(dna.totalMassKg, 0.8) * gasRatio * 1.5 * efficiency;
    }
  }

  telemetry.oxygenDemandRate = o2Demand;
  telemetry.oxygenSupplyRate = o2SupplyCap;

  if (o2Demand > o2SupplyCap) {
    failureModes.push("SYSTEMIC_TISSUE_ANOXIA");
  }

  // 10. LOCOMOTION CONSTRAINTS
  if (dna.modules.locomotion.type === 'wings') {
    const wingArea = dna.modules.locomotion.wingAreaSqM || 1.0;
    const loading = dna.totalMassKg / wingArea;
    telemetry.wingLoading = loading;
    
    // Powered flight cutoff for biological muscle/bone units approx 25kg/m2
    if (loading > 35) {
      failureModes.push("FLIGHT_WING_LOADING_MAXIMUM_BREACHED");
    }
    
    if (dna.environment !== 'AIR') {
      // Wings are cumbersome on land/water
      telemetry.heatGeneratedWatts! *= 1.2;
    }
  }

  // Flight validation constraint override (Total mass limit for any biomechanical wings)
  if (dna.environment === "AIR" && dna.totalMassKg > 40) {
      failureModes.push("AERODYNAMIC_MASS_LIMIT_EXCEEDED");
  }

  // 11. REPRODUCTION STRATEGY
  const strategy = dna.modules.reproduction?.strategy || "r_selection";
  const clutch = dna.modules.reproduction?.clutchSize || 10;
  
  // Cost of reproduction scales with clutch size and mass
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
  }

  const reproductiveCost = (clutch * (dna.totalMassKg * 0.05)) * strategyCostMultiplier;
  
  // Viability check: Can the organism afford more than its survival metabolism?
  const surplusEnergy = energyIntake - totalMetabolicRate;
  const reproductionPotential = Math.max(0, surplusEnergy / (reproductiveCost || 1));
  
  telemetry.reproductionPotential = reproductionPotential * strategyPotentialMultiplier;
  
  if (reproductionPotential < 0.05) {
    failureModes.push("REPRODUCTIVE_VIABILITY_LOST");
  }

  // GAMEPLAY: Calculate Viability Score (0-100)
  const stressRatio = Math.min(1, telemetry.skeletalStressPascals / (telemetry.skeletalLimitPascals || 1));
  const totalStress = stressRatio * 50 + 
                     (telemetry.toxicStress || 0) * 0.3 + 
                     (100 - (telemetry.energyReserves || 0)) * 0.2;
  
  telemetry.viabilityScore = Math.max(0, 100 - totalStress);
  
  // GAMEPLAY: Fitness Score Accumulation
  const survivalBonus = failureModes.length === 0 ? 1 : -5;
  telemetry.fitnessScore = Math.max(0, (telemetry.viabilityScore / 1000) + (survivalBonus / 100));

  // GAMEPLAY: Module Synergies
  if (dna.modules.hydrodynamics?.type === 'streamlining' && dna.physiology.basalMetabolicRateMultiplier > 1.5) {
     telemetry.predationRisk = (telemetry.predationRisk || 0) * 0.7;
  }

  return {
    isViable: failureModes.length === 0,
    telemetry: telemetry as SimulationResult["telemetry"],
    failureModes
  };
}
