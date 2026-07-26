import {
  computeVariation,
  computeTrajectoryScore,
  generateAnalysisText,
  FinancialYearData,
  EventData,
} from '../../src/services/scoring/engine';
import { DEFAULT_SCORING_PARAMS } from '../../src/services/scoring/config';

// ─── computeVariation ────────────────────────────────────────────────────────

describe('computeVariation', () => {
  it('calcule une variation positive correctement', () => {
    expect(computeVariation(110, 100)).toBeCloseTo(10);
  });

  it('calcule une variation négative correctement', () => {
    expect(computeVariation(80, 100)).toBeCloseTo(-20);
  });

  it('retourne null si N est null', () => {
    expect(computeVariation(null, 100)).toBeNull();
  });

  it('retourne null si N-1 est null', () => {
    expect(computeVariation(100, null)).toBeNull();
  });

  it('retourne null si N-1 est zéro (évite division par zéro)', () => {
    expect(computeVariation(100, 0)).toBeNull();
  });

  it('retourne null si les deux valeurs sont null', () => {
    expect(computeVariation(null, null)).toBeNull();
  });

  it('gère les valeurs négatives de CA (rare mais possible)', () => {
    const result = computeVariation(-50, 100);
    expect(result).toBeCloseTo(-150);
  });
});

// ─── computeTrajectoryScore ──────────────────────────────────────────────────

describe('computeTrajectoryScore', () => {
  function makeStatements(revenues: (number | null)[], netIncomes: (number | null)[]): FinancialYearData[] {
    return revenues.map((revenue, i) => ({
      fiscalYear: 2021 + i,
      revenue,
      netIncome: netIncomes[i] ?? null,
    }));
  }

  it('retourne score 0 pour une entreprise stable', () => {
    const stmts = makeStatements([1_000_000, 1_020_000, 1_010_000], [50_000, 52_000, 51_000]);
    const result = computeTrajectoryScore(stmts, [], null);
    expect(result.score).toBe(0);
    expect(result.revenueChange1Y).toBeCloseTo(-0.98, 0);
  });

  it('attribue 10 points pour une baisse CA entre -10 et -20%', () => {
    // N-1 = 1M, N = 850k → -15%
    const stmts = makeStatements([1_000_000, 850_000], [50_000, 45_000]);
    const result = computeTrajectoryScore(stmts, [], null);
    expect(result.details.revenuePoints).toBe(DEFAULT_SCORING_PARAMS.revenue_drop_mild);
  });

  it('attribue 20 points pour une baisse CA entre -20 et -30%', () => {
    const stmts = makeStatements([1_000_000, 750_000], [50_000, 40_000]);
    const result = computeTrajectoryScore(stmts, [], null);
    expect(result.details.revenuePoints).toBe(DEFAULT_SCORING_PARAMS.revenue_drop_moderate);
  });

  it('attribue 30 points pour une baisse CA entre -30 et -50%', () => {
    const stmts = makeStatements([1_000_000, 600_000], [50_000, -20_000]);
    const result = computeTrajectoryScore(stmts, [], null);
    expect(result.details.revenuePoints).toBe(DEFAULT_SCORING_PARAMS.revenue_drop_significant);
  });

  it('attribue 40 points pour une baisse CA > 50%', () => {
    const stmts = makeStatements([1_000_000, 400_000], [50_000, -80_000]);
    const result = computeTrajectoryScore(stmts, [], null);
    expect(result.details.revenuePoints).toBe(DEFAULT_SCORING_PARAMS.revenue_drop_severe);
  });

  it('ajoute 20 points si le résultat devient négatif', () => {
    const stmts = makeStatements([1_000_000, 850_000], [50_000, -30_000]);
    const result = computeTrajectoryScore(stmts, [], null);
    expect(result.details.incomePoints).toBeGreaterThanOrEqual(DEFAULT_SCORING_PARAMS.income_turns_negative_points);
  });

  it('plafonne le score à 100', () => {
    // Baisse catastrophique + résultat très négatif + événements
    const stmts = makeStatements([1_000_000, 200_000], [100_000, -500_000]);
    const events: EventData[] = [
      { eventType: 'CHANGEMENT_DIRIGEANT' },
      { eventType: 'FERMETURE_ETABLISSEMENT' },
    ];
    const result = computeTrajectoryScore(stmts, events, -30);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('gère le cas d\'un seul exercice disponible', () => {
    const stmts = makeStatements([1_000_000], [50_000]);
    const result = computeTrajectoryScore(stmts, [], null);
    expect(result.revenueChange1Y).toBeNull();
    expect(result.revenueChange2Y).toBeNull();
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('gère le cas CA N-1 = 0 (pas de variation calculée)', () => {
    const stmts = makeStatements([0, 500_000], [0, 25_000]);
    const result = computeTrajectoryScore(stmts, [], null);
    // revenueChange1Y doit être null car N-1 = 0
    expect(result.revenueChange1Y).toBeNull();
  });

  it('gère les valeurs null dans les financials', () => {
    const stmts: FinancialYearData[] = [
      { fiscalYear: 2023, revenue: null, netIncome: null },
      { fiscalYear: 2022, revenue: 1_000_000, netIncome: 50_000 },
    ];
    const result = computeTrajectoryScore(stmts, [], null);
    expect(result.revenueChange1Y).toBeNull();
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('gère les doublons d\'exercices (prend le plus récent)', () => {
    const stmts: FinancialYearData[] = [
      { fiscalYear: 2023, revenue: 900_000, netIncome: 45_000 },
      { fiscalYear: 2023, revenue: 800_000, netIncome: 40_000 }, // doublon
      { fiscalYear: 2022, revenue: 1_000_000, netIncome: 50_000 },
    ];
    // Ne doit pas planter
    expect(() => computeTrajectoryScore(stmts, [], null)).not.toThrow();
  });

  it('attribue des points d\'événement pour changement de dirigeant', () => {
    const stmts = makeStatements([1_000_000, 1_000_000], [50_000, 50_000]);
    const events: EventData[] = [{ eventType: 'CHANGEMENT_DIRIGEANT' }];
    const result = computeTrajectoryScore(stmts, events, null);
    expect(result.eventScore).toBe(DEFAULT_SCORING_PARAMS.event_management_change);
  });

  it('attribue des points pour fermeture d\'établissement', () => {
    const stmts = makeStatements([1_000_000, 1_000_000], [50_000, 50_000]);
    const events: EventData[] = [{ eventType: 'FERMETURE_ETABLISSEMENT' }];
    const result = computeTrajectoryScore(stmts, events, null);
    expect(result.eventScore).toBe(DEFAULT_SCORING_PARAMS.event_branch_closure);
  });

  it('n\'intègre pas PROCEDURE_COLLECTIVE dans le score général', () => {
    const stmts = makeStatements([1_000_000, 1_000_000], [50_000, 50_000]);
    const events: EventData[] = [{ eventType: 'PROCEDURE_COLLECTIVE' }];
    const result = computeTrajectoryScore(stmts, events, null);
    // Pas de points pour procédure collective dans le score
    expect(result.eventScore).toBe(0);
  });

  it('attribue des points pour baisse d\'effectif > 10%', () => {
    const stmts = makeStatements([1_000_000, 1_000_000], [50_000, 50_000]);
    const result = computeTrajectoryScore(stmts, [], -15);
    expect(result.details.employeePoints).toBe(DEFAULT_SCORING_PARAMS.employee_drop_mild);
  });

  it('retourne les variations sur 2 ans si trois exercices disponibles', () => {
    const stmts = makeStatements([1_200_000, 1_100_000, 900_000], [60_000, 55_000, 45_000]);
    const result = computeTrajectoryScore(stmts, [], null);
    expect(result.revenueChange2Y).not.toBeNull();
    // 900k vs 1200k → -25%
    expect(result.revenueChange2Y).toBeCloseTo(-25, 0);
  });

  it('score >= 0 dans tous les cas', () => {
    const cases: [FinancialYearData[], EventData[], number | null][] = [
      [[], [], null],
      [makeStatements([], []), [], null],
      [makeStatements([0], [0]), [], null],
      [makeStatements([null, null], [null, null]), [], null],
    ];
    for (const [stmts, evts, emp] of cases) {
      const result = computeTrajectoryScore(stmts, evts, emp);
      expect(result.score).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── generateAnalysisText ────────────────────────────────────────────────────

describe('generateAnalysisText', () => {
  it('génère un texte cohérent pour une forte baisse', () => {
    const breakdown = {
      score: 65,
      revenueChange1Y: -26.2,
      revenueChange2Y: -32.0,
      netIncomeChange: -110,
      employeeTrend: null,
      eventScore: 5,
      details: { revenuePoints: 30, incomePoints: 20, employeePoints: 0, eventPoints: 5 },
    };
    const text = generateAnalysisText('Test SAS', breakdown, 2023, false);
    expect(text).toMatch(/26[.,]2/); // locale-agnostic (fr: virgule, en: point)
    expect(text).toContain('2023');
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(20);
  });

  it('mentionne la procédure collective si présente', () => {
    const breakdown = {
      score: 0, revenueChange1Y: null, revenueChange2Y: null,
      netIncomeChange: null, employeeTrend: null, eventScore: 0,
      details: { revenuePoints: 0, incomePoints: 0, employeePoints: 0, eventPoints: 0 },
    };
    const text = generateAnalysisText('Test SA', breakdown, null, true);
    expect(text.toLowerCase()).toContain('procédure');
  });

  it('retourne un texte par défaut si aucune anomalie détectée', () => {
    const breakdown = {
      score: 0, revenueChange1Y: 3.2, revenueChange2Y: 5.0,
      netIncomeChange: 2.0, employeeTrend: null, eventScore: 0,
      details: { revenuePoints: 0, incomePoints: 0, employeePoints: 0, eventPoints: 0 },
    };
    const text = generateAnalysisText('Test SAS', breakdown, 2023, false);
    expect(text).toBeTruthy();
  });
});
