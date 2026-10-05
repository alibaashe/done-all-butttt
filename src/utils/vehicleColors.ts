export interface VehicleColorDefinition {
  id: string;
  name: string;
  somaliName: string;
  hex: string;
  secondaryHex: string;
  borderHex: string;
  textClass: string;
  bgClass: string;
  isDark: boolean;
}

export const POPULAR_VEHICLE_COLORS: VehicleColorDefinition[] = [
  {
    id: 'white',
    name: 'White',
    somaliName: 'Cadaan',
    hex: '#F8FAFC',
    secondaryHex: '#E2E8F0',
    borderHex: '#94A3B8',
    textClass: 'text-slate-800',
    bgClass: 'bg-white',
    isDark: false,
  },
  {
    id: 'blue',
    name: 'Blue',
    somaliName: 'Buluug',
    hex: '#2563EB',
    secondaryHex: '#1D4ED8',
    borderHex: '#1E40AF',
    textClass: 'text-blue-600',
    bgClass: 'bg-blue-600',
    isDark: true,
  },
  {
    id: 'silver',
    name: 'Silver / Metallic',
    somaliName: 'Qalin (Silver)',
    hex: '#CBD5E1',
    secondaryHex: '#94A3B8',
    borderHex: '#64748B',
    textClass: 'text-slate-600',
    bgClass: 'bg-slate-300',
    isDark: false,
  },
  {
    id: 'black',
    name: 'Black',
    somaliName: 'Madow',
    hex: '#1E293B',
    secondaryHex: '#0F172A',
    borderHex: '#020617',
    textClass: 'text-slate-900 dark:text-white',
    bgClass: 'bg-slate-900',
    isDark: true,
  },
  {
    id: 'red',
    name: 'Red',
    somaliName: 'Cas (Casaan)',
    hex: '#DC2626',
    secondaryHex: '#B91C1C',
    borderHex: '#991B1B',
    textClass: 'text-red-600',
    bgClass: 'bg-red-600',
    isDark: true,
  },
  {
    id: 'grey',
    name: 'Grey / Charcoal',
    somaliName: 'Dambas (Grey)',
    hex: '#64748B',
    secondaryHex: '#475569',
    borderHex: '#334155',
    textClass: 'text-slate-500',
    bgClass: 'bg-slate-600',
    isDark: true,
  },
  {
    id: 'yellow',
    name: 'Yellow / Gold',
    somaliName: 'Jaalle / Dahabi',
    hex: '#EAB308',
    secondaryHex: '#CA8A04',
    borderHex: '#A16207',
    textClass: 'text-amber-500',
    bgClass: 'bg-amber-400',
    isDark: false,
  },
  {
    id: 'green',
    name: 'Green',
    somaliName: 'Cagaar',
    hex: '#16A34A',
    secondaryHex: '#15803D',
    borderHex: '#166534',
    textClass: 'text-emerald-600',
    bgClass: 'bg-emerald-600',
    isDark: true,
  },
  {
    id: 'darkblue',
    name: 'Navy Blue',
    somaliName: 'Buluug Madow',
    hex: '#1E3A8A',
    secondaryHex: '#172554',
    borderHex: '#0F172A',
    textClass: 'text-blue-900',
    bgClass: 'bg-blue-950',
    isDark: true,
  },
];

export const POPULAR_SOMALILAND_CAR_MODELS = [
  'Toyota Vitz',
  'Toyota Corolla Fielder',
  'Toyota Probox',
  'Toyota Ractis',
  'Toyota Passo',
  'Toyota Belta',
  'Toyota Axio',
  'Toyota Premio',
  'Toyota Noah / Voxy',
  'Honda Grace',
  'Honda Fit',
  'Suzuki Swift',
  'Nissan Note',
  'Hyundai Accent',
];

/**
 * Normalizes any car color string (Somali, English, or Hex) into a rich color definition
 */
export function resolveVehicleColor(rawColor?: string): VehicleColorDefinition {
  if (!rawColor) {
    return POPULAR_VEHICLE_COLORS[0]; // Default White
  }

  const str = rawColor.trim().toLowerCase();

  // If user provided a raw Hex code
  if (str.startsWith('#')) {
    return {
      id: 'custom',
      name: rawColor,
      somaliName: rawColor,
      hex: rawColor,
      secondaryHex: rawColor,
      borderHex: '#334155',
      textClass: 'text-slate-800 dark:text-white',
      bgClass: 'bg-slate-700',
      isDark: true,
    };
  }

  // Check Blue / Buluug
  if (str.includes('blue') || str.includes('buluug') || str.includes('bulug') || str.includes('navy')) {
    if (str.includes('navy') || str.includes('madow')) {
      return POPULAR_VEHICLE_COLORS[8]; // Navy
    }
    return POPULAR_VEHICLE_COLORS[1]; // Blue
  }

  // Check White / Cadaan
  if (str.includes('white') || str.includes('cadaan') || str.includes('cad') || str.includes('pearl')) {
    return POPULAR_VEHICLE_COLORS[0]; // White
  }

  // Check Silver / Qalin
  if (str.includes('silver') || str.includes('qalin') || str.includes('metallic') || str.includes('chrome')) {
    return POPULAR_VEHICLE_COLORS[2]; // Silver
  }

  // Check Black / Madow
  if (str.includes('black') || str.includes('madow') || str.includes('madaw')) {
    return POPULAR_VEHICLE_COLORS[3]; // Black
  }

  // Check Red / Cas
  if (str.includes('red') || str.includes('cas') || str.includes('casaan') || str.includes('burgundy') || str.includes('maroon')) {
    return POPULAR_VEHICLE_COLORS[4]; // Red
  }

  // Check Grey / Dambas
  if (str.includes('grey') || str.includes('gray') || str.includes('dambas') || str.includes('dambaska') || str.includes('charcoal')) {
    return POPULAR_VEHICLE_COLORS[5]; // Grey
  }

  // Check Yellow / Jaalle / Gold
  if (str.includes('yellow') || str.includes('jaalle') || str.includes('jaale') || str.includes('gold') || str.includes('dahabi')) {
    return POPULAR_VEHICLE_COLORS[6]; // Yellow
  }

  // Check Green / Cagaar
  if (str.includes('green') || str.includes('cagaar') || str.includes('cagaaran')) {
    return POPULAR_VEHICLE_COLORS[7]; // Green
  }

  // Default to White
  return POPULAR_VEHICLE_COLORS[0];
}
