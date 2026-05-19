import { EcosystemState } from '../types';

export interface EcosystemEvent {
  id: string;
  name: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  apply: (current: EcosystemState) => EcosystemState;
  mutationSurge?: boolean; // forces an extra genomic mutation when triggered
}

export const ECOSYSTEM_EVENTS: EcosystemEvent[] = [
  {
    id: 'volcanic-eruption',
    name: 'VOLCANIC DETONATION',
    description: 'Tectonic rupture released massive thermal energy and toxins.',
    severity: 'HIGH',
    apply: (prev) => ({
      ...prev,
      ambientTemperatureCelsius: prev.ambientTemperatureCelsius + 25,
      oxygenPercentage: Math.max(5, prev.oxygenPercentage - 8),
    })
  },
  {
    id: 'solar-flare',
    name: 'SOLAR RADIATION SPIKE',
    description: 'Magnetic storm increased atmospheric ionization and ambient heat.',
    severity: 'MEDIUM',
    apply: (prev) => ({
      ...prev,
      ambientTemperatureCelsius: prev.ambientTemperatureCelsius + 15,
    })
  },
  {
    id: 'ice-age',
    name: 'GLACIAL EXPANSION',
    description: 'Rapid planetary cooling initiated a localized ice age.',
    severity: 'CRITICAL',
    apply: (prev) => ({
      ...prev,
      ambientTemperatureCelsius: prev.ambientTemperatureCelsius - 35,
    })
  },
  {
    id: 'oxygen-bloom',
    name: 'PHYTOPLANKTON BLOOM',
    description: 'Photosynthetic boom dramatically increased atmospheric oxygen.',
    severity: 'MEDIUM',
    apply: (prev) => ({
      ...prev,
      oxygenPercentage: Math.min(45, prev.oxygenPercentage + 12),
    })
  },
  {
    id: 'gravity-shift',
    name: 'GRAVITATIONAL ANOMALY',
    description: 'Proximity to dark matter filament localized gravitational distortion.',
    severity: 'HIGH',
    apply: (prev) => ({
      ...prev,
      gravityMultiplier: prev.gravityMultiplier * 1.5,
    })
  },
  {
    id: 'atmospheric-leak',
    name: 'ATMOSPHERIC COLLAPSE',
    description: 'Magnetic field failure led to rapid gas escape into the vacuum.',
    severity: 'CRITICAL',
    apply: (prev) => ({
      ...prev,
      oxygenPercentage: Math.max(2, prev.oxygenPercentage - 15),
    })
  },
  {
    id: 'planetary-impact',
    name: 'METEORIC IMPACT',
    description: 'Asteroid collision raised dust clouds, dropping temperatures and O2.',
    severity: 'HIGH',
    apply: (prev) => ({
      ...prev,
      ambientTemperatureCelsius: prev.ambientTemperatureCelsius - 15,
      oxygenPercentage: Math.max(8, prev.oxygenPercentage - 5),
    })
  },
  {
    id: 'resource-collapse',
    name: 'ECOLOGICAL COLLAPSE',
    description: 'Cascading trophic failure stripped the biosphere of available biomass.',
    severity: 'CRITICAL',
    apply: (prev) => ({
      ...prev,
      nutrientAvailability: Math.max(0.02, prev.nutrientAvailability - 0.5),
      pHLevel: Math.min(14, prev.pHLevel + 1.5),
    })
  },
  {
    id: 'pathogen-bloom',
    name: 'PANDEMIC PATHOGEN BLOOM',
    description: 'Rapid microbial proliferation flooded the biosphere with chemical waste.',
    severity: 'HIGH',
    apply: (prev) => ({
      ...prev,
      toxins: Math.min(1.0, prev.toxins + 0.35),
      nutrientAvailability: Math.max(0.05, prev.nutrientAvailability - 0.15),
    })
  },
  {
    id: 'acid-rain',
    name: 'ACID RAIN STORM',
    description: 'Industrial aerosol deposition collapsed atmospheric pH balance.',
    severity: 'HIGH',
    apply: (prev) => ({
      ...prev,
      pHLevel: Math.max(1.0, 3.5 + Math.random() * 0.8),
      toxins: Math.min(1.0, prev.toxins + 0.1),
    })
  },
  {
    id: 'scorched-earth',
    name: 'SCORCHED EARTH PROTOCOL',
    description: 'Catastrophic surface heating depleted moisture and nutrient reserves.',
    severity: 'CRITICAL',
    apply: (prev) => ({
      ...prev,
      ambientTemperatureCelsius: prev.ambientTemperatureCelsius + 25,
      nutrientAvailability: Math.max(0.02, prev.nutrientAvailability - 0.3),
      toxins: Math.min(1.0, prev.toxins + 0.1),
    })
  },
  {
    id: 'radiation-surge',
    name: 'COSMIC RADIATION SURGE',
    description: 'Intense particle bombardment accelerated genomic mutation across all organisms.',
    severity: 'HIGH',
    apply: (prev) => ({
      ...prev,
      toxins: Math.min(1.0, prev.toxins + 0.15),
      oxygenPercentage: Math.max(5, prev.oxygenPercentage - 3),
    }),
    mutationSurge: true
  }
];
