/**
 * Formule Haversine — distance entre deux points géographiques (km)
 */
export function haversineDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371; // rayon terrestre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Bounding box approximative autour d'un point pour pré-filtre rapide
 */
export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.0;
  const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));
  return {
    latMin: lat - latDelta,
    latMax: lat + latDelta,
    lngMin: lng - lngDelta,
    lngMax: lng + lngDelta,
  };
}

/**
 * Convertit les tranches d'effectif INSEE en bornes numériques
 */
export const EMPLOYEE_RANGES: Record<string, [number, number]> = {
  '00': [0, 0],
  '01': [1, 2],
  '02': [3, 5],
  '03': [6, 9],
  '11': [10, 19],
  '12': [20, 49],
  '21': [50, 99],
  '22': [100, 199],
  '31': [200, 249],
  '32': [250, 499],
  '41': [500, 999],
  '42': [1000, 1999],
  '51': [2000, 4999],
  '52': [5000, 9999],
  '53': [10000, Infinity],
};

export function employeeRangeToMidpoint(range: string | null): number | null {
  if (!range) return null;
  const bounds = EMPLOYEE_RANGES[range];
  if (!bounds) return null;
  const [min, max] = bounds;
  return max === Infinity ? min : Math.round((min + max) / 2);
}

export function employeeRangeLabel(range: string | null): string {
  if (!range) return 'NC';
  const bounds = EMPLOYEE_RANGES[range];
  if (!bounds) return range;
  const [min, max] = bounds;
  if (min === 0 && max === 0) return '0';
  if (max === Infinity) return `${min.toLocaleString('fr-FR')}+`;
  return `${min.toLocaleString('fr-FR')}–${max.toLocaleString('fr-FR')}`;
}
