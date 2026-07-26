import { haversineDistanceKm, boundingBox, employeeRangeToMidpoint, employeeRangeLabel } from '../../src/utils/geo';

describe('haversineDistanceKm', () => {
  it('retourne 0 pour le même point', () => {
    expect(haversineDistanceKm(48.8566, 2.3522, 48.8566, 2.3522)).toBeCloseTo(0, 3);
  });

  it('calcule correctement Paris → Lyon (~392 km)', () => {
    const dist = haversineDistanceKm(48.8566, 2.3522, 45.7640, 4.8357);
    expect(dist).toBeGreaterThan(380);
    expect(dist).toBeLessThan(410);
  });

  it('calcule Paris centre → La Défense (~9 km)', () => {
    const dist = haversineDistanceKm(48.8566, 2.3522, 48.8924, 2.2360);
    expect(dist).toBeGreaterThan(7);
    expect(dist).toBeLessThan(12);
  });

  it('est symétrique (A→B = B→A)', () => {
    const d1 = haversineDistanceKm(48.8566, 2.3522, 45.7640, 4.8357);
    const d2 = haversineDistanceKm(45.7640, 4.8357, 48.8566, 2.3522);
    expect(d1).toBeCloseTo(d2, 5);
  });

  it('gère des coordonnées aux pôles sans planter', () => {
    expect(() => haversineDistanceKm(90, 0, -90, 0)).not.toThrow();
  });
});

describe('boundingBox', () => {
  it('retourne une boîte englobante cohérente', () => {
    const bb = boundingBox(48.8566, 2.3522, 25);
    expect(bb.latMin).toBeLessThan(48.8566);
    expect(bb.latMax).toBeGreaterThan(48.8566);
    expect(bb.lngMin).toBeLessThan(2.3522);
    expect(bb.lngMax).toBeGreaterThan(2.3522);
  });

  it('la boîte s\'élargit avec le rayon', () => {
    const bb25 = boundingBox(48.8566, 2.3522, 25);
    const bb50 = boundingBox(48.8566, 2.3522, 50);
    expect(bb50.latMax - bb50.latMin).toBeGreaterThan(bb25.latMax - bb25.latMin);
  });

  it('le rayon = 0 donne une boîte dégénérée (point)', () => {
    const bb = boundingBox(48.8566, 2.3522, 0);
    expect(bb.latMin).toBeCloseTo(bb.latMax, 5);
  });
});

describe('employeeRangeToMidpoint', () => {
  it('retourne null pour null', () => {
    expect(employeeRangeToMidpoint(null)).toBeNull();
  });

  it('retourne null pour une tranche inconnue', () => {
    expect(employeeRangeToMidpoint('99')).toBeNull();
  });

  it('retourne 0 pour la tranche 00', () => {
    expect(employeeRangeToMidpoint('00')).toBe(0);
  });

  it('retourne le milieu pour 11 (10–19 → 14 ou 15)', () => {
    const mid = employeeRangeToMidpoint('11');
    expect(mid).toBe(15);
  });

  it('retourne la borne basse pour 53 (10000+)', () => {
    expect(employeeRangeToMidpoint('53')).toBe(10000);
  });
});

describe('employeeRangeLabel', () => {
  it('retourne NC pour null', () => {
    expect(employeeRangeLabel(null)).toBe('NC');
  });

  it('formate correctement 12 → 20–49', () => {
    expect(employeeRangeLabel('12')).toBe('20–49');
  });

  it('formate correctement 53 → 10 000+', () => {
    expect(employeeRangeLabel('53')).toContain('+');
  });
});
