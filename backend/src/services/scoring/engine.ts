import { ScoringParams } from '../../types';
import { DEFAULT_SCORING_PARAMS } from './config';

export interface FinancialYearData {
  fiscalYear: number;
  revenue: number | null;
  netIncome: number | null;
}

export interface EventData {
  eventType: string;
}

export interface ScoreBreakdown {
  score: number;
  revenueChange1Y: number | null;
  revenueChange2Y: number | null;
  netIncomeChange: number | null;
  employeeTrend: number | null;
  eventScore: number;
  details: {
    revenuePoints: number;
    incomePoints: number;
    employeePoints: number;
    eventPoints: number;
  };
}

/**
 * Calcule le variation en % entre deux valeurs.
 * Retourne null si l'une des valeurs est nulle, zéro ou absente.
 */
export function computeVariation(valueN: number | null, valueN1: number | null): number | null {
  if (valueN === null || valueN === undefined) return null;
  if (valueN1 === null || valueN1 === undefined) return null;
  if (valueN1 === 0) return null; // division par zéro
  return ((valueN - valueN1) / Math.abs(valueN1)) * 100;
}

/**
 * Points attribués pour la variation de CA
 */
function revenueDropPoints(change1Y: number | null, params: ScoringParams): number {
  if (change1Y === null) return 0;
  if (change1Y >= -10) return 0;                    // baisse < 10% ou croissance
  if (change1Y >= -20) return params.revenue_drop_mild;         // -10 à -20%
  if (change1Y >= -30) return params.revenue_drop_moderate;     // -20 à -30%
  if (change1Y >= -50) return params.revenue_drop_significant;  // -30 à -50%
  return params.revenue_drop_severe;                             // < -50%
}

/**
 * Points attribués pour la dégradation du résultat net
 */
function incomePoints(
  statements: FinancialYearData[],
  netIncomeChange: number | null,
  params: ScoringParams,
): number {
  if (statements.length < 2) return 0;

  const sorted = [...statements].sort((a, b) => b.fiscalYear - a.fiscalYear);
  const latest = sorted[0];
  const previous = sorted[1];
  const twoYearsAgo = sorted[2] ?? null;

  let points = 0;

  const latestIncome = latest.netIncome;
  const prevIncome = previous?.netIncome ?? null;
  const twoYearIncome = twoYearsAgo?.netIncome ?? null;

  // Baisse > seuil
  if (netIncomeChange !== null && netIncomeChange < -params.income_drop_threshold) {
    points += params.income_drop_points;
  }

  // Résultat devient négatif (précédent positif, actuel négatif)
  if (latestIncome !== null && latestIncome < 0 && prevIncome !== null && prevIncome >= 0) {
    points += params.income_turns_negative_points;
  }

  // Négatif deux années consécutives
  if (
    latestIncome !== null && latestIncome < 0 &&
    prevIncome !== null && prevIncome < 0
  ) {
    points += params.income_two_years_negative_points;
  }

  // Ou négatif années N et N-2 (signal persistant)
  if (
    latestIncome !== null && latestIncome < 0 &&
    twoYearIncome !== null && twoYearIncome < 0 &&
    (prevIncome === null || prevIncome < 0)
  ) {
    // Déjà compté ci-dessus si trois années consécutives — pas de double comptage
  }

  return points;
}

/**
 * Points attribués pour la variation d'effectif
 */
function employeePoints(employeeTrend: number | null, params: ScoringParams): number {
  if (employeeTrend === null) return 0;
  if (employeeTrend < -20) return params.employee_drop_severe;
  if (employeeTrend < -10) return params.employee_drop_mild;
  return 0;
}

/**
 * Points attribués pour les événements récents (hors procédures collectives)
 */
function computeEventScore(events: EventData[], params: ScoringParams): number {
  let pts = 0;
  for (const evt of events) {
    if (evt.eventType === 'CHANGEMENT_DIRIGEANT') pts += params.event_management_change;
    if (evt.eventType === 'FERMETURE_ETABLISSEMENT') pts += params.event_branch_closure;
  }
  return pts;
}

/**
 * Calcule le score de rupture de trajectoire complet.
 * Plafond à 100.
 */
export function computeTrajectoryScore(
  statements: FinancialYearData[],
  events: EventData[],
  employeeTrend: number | null,
  params: ScoringParams = DEFAULT_SCORING_PARAMS,
): ScoreBreakdown {
  // Tri par exercice décroissant
  const sorted = [...statements].sort((a, b) => b.fiscalYear - a.fiscalYear);

  const latest = sorted[0] ?? null;
  const previous = sorted[1] ?? null;
  const twoYearsAgo = sorted[2] ?? null;

  const revenueChange1Y = computeVariation(
    latest?.revenue ?? null,
    previous?.revenue ?? null,
  );
  const revenueChange2Y = computeVariation(
    latest?.revenue ?? null,
    twoYearsAgo?.revenue ?? null,
  );
  const netIncomeChange = computeVariation(
    latest?.netIncome ?? null,
    previous?.netIncome ?? null,
  );

  const revPoints = revenueDropPoints(revenueChange1Y, params);
  const incPoints = incomePoints(sorted, netIncomeChange, params);
  const empPoints = employeePoints(employeeTrend, params);
  const evtScore = computeEventScore(events, params);

  const raw = revPoints + incPoints + empPoints + evtScore;
  const score = Math.min(100, Math.max(0, raw));

  return {
    score,
    revenueChange1Y,
    revenueChange2Y,
    netIncomeChange,
    employeeTrend,
    eventScore: evtScore,
    details: {
      revenuePoints: revPoints,
      incomePoints: incPoints,
      employeePoints: empPoints,
      eventPoints: evtScore,
    },
  };
}

/**
 * Génère un texte d'analyse déterministe basé sur les données observables.
 * Ne prédit pas une faillite. Ne juge pas l'entreprise.
 */
export function generateAnalysisText(
  companyName: string,
  score: ScoreBreakdown,
  latestFiscalYear: number | null,
  hasProcedureCollective: boolean,
): string {
  const lines: string[] = [];

  if (score.revenueChange1Y !== null) {
    const pct = score.revenueChange1Y.toFixed(1);
    const sign = score.revenueChange1Y > 0 ? '+' : '';
    if (score.revenueChange1Y < -30) {
      lines.push(`Le chiffre d'affaires diminue de ${Math.abs(score.revenueChange1Y).toFixed(1)} % sur le dernier exercice disponible${latestFiscalYear ? ` (${latestFiscalYear})` : ''}, une baisse significative.`);
    } else if (score.revenueChange1Y < -10) {
      lines.push(`Le chiffre d'affaires recule de ${Math.abs(score.revenueChange1Y).toFixed(1)} % sur le dernier exercice disponible${latestFiscalYear ? ` (${latestFiscalYear})` : ''}.`);
    } else if (score.revenueChange1Y > 10) {
      lines.push(`Le chiffre d'affaires progresse de ${sign}${pct} % sur le dernier exercice disponible${latestFiscalYear ? ` (${latestFiscalYear})` : ''}.`);
    } else {
      lines.push(`Le chiffre d'affaires reste stable sur le dernier exercice disponible${latestFiscalYear ? ` (${latestFiscalYear})` : ''} (${sign}${pct} %).`);
    }
  }

  if (score.revenueChange2Y !== null && score.revenueChange1Y !== null) {
    if (score.revenueChange2Y < -10 && score.revenueChange1Y < -10) {
      lines.push(`Cette tendance s'inscrit dans une baisse continue sur deux exercices consécutifs (${score.revenueChange2Y.toFixed(1)} % sur deux ans).`);
    }
  }

  if (score.netIncomeChange !== null) {
    if (score.details.incomePoints >= 20) {
      lines.push(`Le résultat net est devenu négatif sur le dernier exercice, ce qui représente un changement de signe par rapport à l'exercice précédent.`);
    } else if (score.details.incomePoints >= 25) {
      lines.push(`Le résultat net est négatif pour le deuxième exercice consécutif.`);
    } else if (score.netIncomeChange < -30) {
      lines.push(`Le résultat net se dégrade de ${Math.abs(score.netIncomeChange).toFixed(1)} % par rapport à l'exercice précédent.`);
    }
  }

  if (score.employeeTrend !== null && score.employeeTrend < -10) {
    lines.push(`L'effectif estimé est en baisse de ${Math.abs(score.employeeTrend).toFixed(0)} %.`);
  }

  if (score.eventScore > 0) {
    lines.push(`Des événements récents ont été enregistrés (changement de direction, fermeture d'établissement).`);
  }

  if (hasProcedureCollective) {
    lines.push(`Une procédure collective a été ouverte : consultez les détails dans la section événements.`);
  }

  if (lines.length === 0) {
    lines.push(`Aucune rupture de trajectoire significative n'est détectée sur les exercices disponibles.`);
  }

  return lines.join(' ');
}
