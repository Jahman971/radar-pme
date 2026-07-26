import prisma from '../../db/client';
import { computeTrajectoryScore } from './engine';
import { DEFAULT_SCORING_PARAMS } from './config';
import { ScoringParams } from '../../types';
import { employeeRangeToMidpoint } from '../../utils/geo';

/**
 * Charge les paramètres de scoring depuis la DB (ou utilise les défauts)
 */
async function loadScoringParams(): Promise<ScoringParams> {
  const configs = await prisma.scoringConfig.findMany();
  if (configs.length === 0) return DEFAULT_SCORING_PARAMS;

  const overrides: Partial<ScoringParams> = {};
  for (const cfg of configs) {
    (overrides as Record<string, number>)[cfg.key] = cfg.value;
  }
  return { ...DEFAULT_SCORING_PARAMS, ...overrides };
}

/**
 * Calcule et persiste le score d'une entreprise donnée
 */
export async function calculateScoreForCompany(companyId: string): Promise<void> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      financialStatements: { orderBy: { fiscalYear: 'desc' }, take: 3 },
      events: {
        where: {
          eventDate: { gte: new Date(Date.now() - 365 * 24 * 3600 * 1000 * 2) }, // 2 ans
        },
      },
    },
  });

  if (!company) return;

  const params = await loadScoringParams();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statements = company.financialStatements.map((fs: any) => ({
    fiscalYear: fs.fiscalYear,
    revenue: fs.revenue,
    netIncome: fs.netIncome,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = company.events.map((e: any) => ({ eventType: e.eventType.toString() }));

  // Estimation variation effectif : non disponible directement → null pour le MVP
  const employeeTrend: number | null = null;

  const breakdown = computeTrajectoryScore(statements, events, employeeTrend, params);

  await prisma.trajectoryScore.upsert({
    where: { companyId },
    create: {
      companyId,
      score: breakdown.score,
      revenueChange1Y: breakdown.revenueChange1Y,
      revenueChange2Y: breakdown.revenueChange2Y,
      netIncomeChange: breakdown.netIncomeChange,
      employeeTrend: breakdown.employeeTrend,
      eventScore: breakdown.eventScore,
    },
    update: {
      score: breakdown.score,
      revenueChange1Y: breakdown.revenueChange1Y,
      revenueChange2Y: breakdown.revenueChange2Y,
      netIncomeChange: breakdown.netIncomeChange,
      employeeTrend: breakdown.employeeTrend,
      eventScore: breakdown.eventScore,
      calculatedAt: new Date(),
    },
  });
}

/**
 * Recalcule tous les scores (batch)
 */
export async function calculateAllScores(batchSize = 500): Promise<{ updated: number }> {
  let offset = 0;
  let updated = 0;
  let batch: { id: string }[];

  do {
    batch = await prisma.company.findMany({
      select: { id: true },
      skip: offset,
      take: batchSize,
    });

    await Promise.all(batch.map((c) => calculateScoreForCompany(c.id)));
    updated += batch.length;
    offset += batchSize;

    console.log(`[scoring] Scores calculés : ${updated}`);
  } while (batch.length === batchSize);

  return { updated };
}
