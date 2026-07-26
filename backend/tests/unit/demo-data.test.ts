import { generateDemoData } from '../../src/cli/demo-data';

describe('generateDemoData', () => {
  let data: ReturnType<typeof generateDemoData>;

  beforeAll(() => {
    data = generateDemoData();
  });

  it('génère au moins 100 entreprises', () => {
    expect(data.companies.length).toBeGreaterThanOrEqual(100);
  });

  it('chaque entreprise a un SIREN de 9 chiffres unique', () => {
    const sirens = data.companies.map((c) => c.siren);
    const unique = new Set(sirens);
    expect(unique.size).toBe(sirens.length);
    for (const siren of sirens) {
      expect(siren).toMatch(/^\d{9}$/);
    }
  });

  it('génère 3 exercices par entreprise', () => {
    const byCompany = new Map<string, number>();
    for (const fs of data.financials) {
      byCompany.set(fs.siren, (byCompany.get(fs.siren) ?? 0) + 1);
    }
    for (const [, count] of byCompany) {
      expect(count).toBe(3);
    }
  });

  it('couvre plusieurs secteurs NAF', () => {
    const codes = new Set(data.companies.map((c) => c.nafCode));
    expect(codes.size).toBeGreaterThan(5);
  });

  it('couvre plusieurs villes d\'Île-de-France', () => {
    const cities = new Set(data.companies.map((c) => c.city));
    expect(cities.size).toBeGreaterThan(5);
  });

  it('contient des résultats positifs et négatifs', () => {
    const netIncomes = data.financials.map((f) => f.netIncome);
    const hasPositive = netIncomes.some((n) => n > 0);
    const hasNegative = netIncomes.some((n) => n < 0);
    expect(hasPositive).toBe(true);
    expect(hasNegative).toBe(true);
  });

  it('les coordonnées sont dans la zone Île-de-France', () => {
    for (const c of data.companies) {
      expect(c.latitude).toBeGreaterThan(48.0);
      expect(c.latitude).toBeLessThan(49.5);
      expect(c.longitude).toBeGreaterThan(1.4);
      expect(c.longitude).toBeLessThan(3.6);
    }
  });

  it('génère des événements', () => {
    expect(data.events.length).toBeGreaterThan(0);
  });

  it('les profils sont variés', () => {
    const profiles = new Set(data.companies.map((c) => c.profile));
    expect(profiles.size).toBeGreaterThan(2);
  });

  it('est idempotent (même graine → mêmes données)', () => {
    const data2 = generateDemoData();
    expect(data2.companies[0].siren).toBe(data.companies[0].siren);
    expect(data2.financials[0].revenue).toBe(data.financials[0].revenue);
  });
});
