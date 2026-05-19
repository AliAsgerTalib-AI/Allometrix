export interface AttachedModules {
  respiration: {
    type: "mammalian_lung" | "avian_lung" | "tracheae" | "gills" | "membrane_diffusion";
    efficiency: number;
  };
  locomotion: {
    type: "none" | "wings" | "spring_legs" | "columnar_legs" | "fins" | "flagella";
    wingAreaSqM?: number;
  };
  thermal: {
    type: "none" | "vascular_ears" | "dorsal_plates" | "blubber";
    scale: number;
  };
  hydrodynamics: {
    type: "none" | "streamlining" | "lateral_line";
    scale: number;
  };
  trophic: {
    type: "photoautotroph" | "herbivore" | "carnivore" | "chemoautotroph" | "photosynthesis";
    efficiency: number;
  };
  nervousSystem: {
    complexity: "none" | "primitive" | "standard" | "cephalized" | "complex";
  };
  reproduction: {
    strategy: "r_selection" | "K_selection" | "iteroparity" | "semelparity" | "binary_fission";
    clutchSize: number;
  };
  sensory: {
    type: "none" | "vision" | "echolocation" | "thermal_sense" | "vibration_sense" | "chemoreception";
    acuity: number; // 0.1 to 1.0
  };
  chemicalTolerance: {
    toxicityResistance: number; // 0.0 to 1.0
    pHResistance: number;       // 0.0 to 1.0
  };
}

export interface OrganismDNA {
  domain?: "bacteria" | "archaea" | "eukaryota";
  name: string;
  totalMassKg: number;
  environment: "LAND" | "WATER" | "AIR";
  geometryFactor: number;
  morphologyComplexity: number; // 0.0 to 1.0
  structuralMaterial: "standard_bone" | "chitin" | "cartilage" | "exoskeleton" | "cartilage_matrix" | "peptidoglycan" | "archaeal_s_layer";
  boneCrossSectionRatio: number;
  waterRetentionScale: number; // 0.0 to 1.0
  predatorType: "apex" | "mesopredator" | "none";
  preyType: "generalist" | "specialist" | "opportunistic";
  physiology: {
    basalMetabolicRateMultiplier: number; // 0.5 to 2.0
    energyStorageCapacity: number; // 0.1 to 1.0
  };
  modules: AttachedModules;
  mutationProbability: number; // 0.0 to 1.0 (chance of mutation per epoch)
}

export interface EcosystemState {
  ambientTemperatureCelsius: number;
  gravityMultiplier: number; // 1.0 = Earth gravity
  oxygenPercentage: number;  // Default Earth baseline is 21
  fluidViscosity: number;     // 1.0 (water) to 5.0 (sludge)
  toxins: number;             // 0.0 to 1.0
  pHLevel: number;            // 1.0 to 14.0 (7.0 is neutral)
  nutrientAvailability: number; // 0.0 to 1.0
  eventFrequency: number;     // 0.0 to 1.0 (simulation setting)
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  isUnlocked: boolean;
  type: 'ENVIRONMENT' | 'COMPLEXITY' | 'BIOMECHANICS' | 'SURVIVAL' | 'DOMAIN';
  timestamp?: number;
}

export interface SimulationResult {
  isViable: boolean;
  telemetry: {
    metabolicRateWatts: number;
    surfaceAreaSqMeters: number;
    volumeCuMeters: number;
    heatGeneratedWatts: number;
    maxHeatDissipationWatts: number;
    skeletalStressPascals: number;
    skeletalLimitPascals: number;
    oxygenSupplyRate: number;
    oxygenDemandRate: number;
    wingLoading?: number;
    dragPenalty?: number;
    trachealLimit?: number;
    energyIntakeWatts?: number;
    neurologicalCostWatts?: number;
    hydrationStability?: number;
    reproductionPotential?: number;
    toxicStress?: number;
    toxicResistance?: number;
    nutrientLimitKg?: number;
    predationRisk?: number;
    energyReserves?: number;
    cellDiameterMicrons?: number;
    quorumSensingBonus?: number;
    viabilityScore: number;
    fitnessScore: number;
    generation: number;
  };
  failureModes: string[];
}

export type LogSeverity = "info" | "success" | "warning" | "critical";

export interface LogEntry {
  id: string;
  timestamp: string;
  text: string;
  severity: LogSeverity;
}

export interface DNAHistoryEntry {
  epoch: number;
  parameter: string;
  oldValue: string | number;
  newValue: string | number;
  changeType: 'USER' | 'MUTATION';
}

export interface Preset {
  id: string;
  name: string;
  type: "FULL" | "DNA" | "WORLD";
  dna: OrganismDNA;
  ecosystem: EcosystemState;
  timestamp: number;
}
