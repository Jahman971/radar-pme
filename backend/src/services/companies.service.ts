/* eslint-disable @typescript-eslint/no-explicit-any */
// Prisma types are generated at runtime via `prisma generate`.
// The @ts-ignore comments below suppress errors in environments where
// prisma generate hasn't run yet (CI without DB, sandbox, etc.).
import prisma from '../db/client';
import { haversineDistanceKm, boundingBox } from '../utils/geo';
import { scoreLabel, scoreColor } from '../utils/format';
import {
  CompanyFilters,
  CompanyListItem,
  CompanyDetail,
  PaginatedResponse,
} from '../types';
import { generateAnalysisText } from './scoring/engine';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// ─── Liste filtrée et paginée ───────────────────────────────────────────────

export async function listCompanies(
  filters: CompanyFilters,
): Promise<PaginatedResponse<CompanyListItem>> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * pageSize;

  // ─── Construction du WHERE Prisma ──────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};

  if (filters.activeOnly !== false) {
    where.active = true;
  }

  if (filters.naf) {
    where.nafCode = { startsWith: filters.naf };
  }

  // Pré-filtre géographique (bounding box rapide)
  if (filters.latitude !== undefined && filters.longitude !== undefined && filters.radius) {
    const bb = boundingBox(filters.latitude, filters.longitude, filters.radius);
    where.latitude = { gte: bb.latMin, lte: bb.latMax };
    where.longitude = { gte: bb.lngMin, lte: bb.lngMax };
  }

  // Filtres sur TrajectoryScore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scoreWhere: Record<string, any> = {};
  if (filters.scoreMin !== undefined) {
    scoreWhere.score = { gte: filters.scoreMin };
  }
  if (filters.revenueChangeMax !== undefined) {
    scoreWhere.revenueChange1Y = { lte: filters.revenueChangeMax };
  }

  if (Object.keys(scoreWhere).length > 0) {
    where.trajectoryScore = scoreWhere;
  }

  // ─── Requête ───────────────────────────────────────────────────────────
  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        trajectoryScore: true,
        financialStatements: {
          orderBy: { fiscalYear: 'desc' },
          take: 2,
        },
        events: {
          orderBy: { eventDate: 'desc' },
          take: 3,
        },
      },
      skip,
      take: pageSize * 3, // on prend plus car on va filtrer/trier après le calcul distance
    }),
    prisma.company.count({ where }),
  ]);

  // ─── Post-traitement : calcul distance + filtres restants ──────────────
  let items: CompanyListItem[] = companies
    .map((c: any): CompanyListItem => {
      const distanceKm =
        filters.latitude !== undefined &&
        filters.longitude !== undefined &&
        c.latitude !== null &&
        c.longitude !== null
          ? haversineDistanceKm(filters.latitude, filters.longitude, c.latitude, c.longitude)
          : null;

      const latestFS = c.financialStatements[0] ?? null;
      const previousFS = c.financialStatements[1] ?? null;

      return {
        id: c.id,
        siren: c.siren,
        name: c.name,
        nafCode: c.nafCode,
        nafLabel: c.nafLabel,
        city: c.city,
        postalCode: c.postalCode,
        latitude: c.latitude,
        longitude: c.longitude,
        employeeRange: c.employeeRange,
        active: c.active,
        distanceKm,
        latestRevenue: latestFS?.revenue ?? null,
        previousRevenue: previousFS?.revenue ?? null,
        latestNetIncome: latestFS?.netIncome ?? null,
        latestFiscalYear: latestFS?.fiscalYear ?? null,
        score: c.trajectoryScore?.score ?? null,
        revenueChange1Y: c.trajectoryScore?.revenueChange1Y ?? null,
        recentEvents: c.events.map((e: any) => ({
          eventType: e.eventType,
          eventDate: e.eventDate.toISOString(),
          title: e.title,
        })),
      };
    })
    // Filtre distance précis (après bounding box)
    .filter((c: CompanyListItem) => {
      if (filters.radius && c.distanceKm !== null) {
        return c.distanceKm <= filters.radius;
      }
      return true;
    })
    // Filtres CA
    .filter((c: CompanyListItem) => {
      if (filters.revenueMin !== undefined && c.latestRevenue !== null) {
        if (c.latestRevenue < filters.revenueMin) return false;
      }
      if (filters.revenueMax !== undefined && c.latestRevenue !== null) {
        if (c.latestRevenue > filters.revenueMax) return false;
      }
      return true;
    });

  // ─── Tri ───────────────────────────────────────────────────────────────
  const sort = filters.sort ?? 'score';
  items.sort((a, b) => {
    switch (sort) {
      case 'score':
        return (b.score ?? 0) - (a.score ?? 0);
      case 'revenueChange':
        return (a.revenueChange1Y ?? 0) - (b.revenueChange1Y ?? 0);
      case 'distance':
        return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      case 'revenue':
        return (b.latestRevenue ?? 0) - (a.latestRevenue ?? 0);
      default:
        return (b.score ?? 0) - (a.score ?? 0);
    }
  });

  // Pagination finale
  const paged = items.slice(0, pageSize);

  return {
    data: paged,
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  };
}

// ─── Détail entreprise ──────────────────────────────────────────────────────

export async function getCompanyBySiren(siren: string): Promise<CompanyDetail | null> {
  const company = await prisma.company.findUnique({
    where: { siren },
    include: {
      financialStatements: { orderBy: { fiscalYear: 'desc' }, take: 5 },
      events: { orderBy: { eventDate: 'desc' }, take: 20 },
      trajectoryScore: true,
    },
  });

  if (!company) return null;

  const hasProcedure = company.events.some(
    (e: any) => e.eventType === 'PROCEDURE_COLLECTIVE',
  );

  const latestFiscalYear = company.financialStatements[0]?.fiscalYear ?? null;

  const trajectoryScore = company.trajectoryScore
    ? {
        score: company.trajectoryScore.score,
        revenueChange1Y: company.trajectoryScore.revenueChange1Y,
        revenueChange2Y: company.trajectoryScore.revenueChange2Y,
        netIncomeChange: company.trajectoryScore.netIncomeChange,
        employeeTrend: company.trajectoryScore.employeeTrend,
        eventScore: company.trajectoryScore.eventScore,
        calculatedAt: company.trajectoryScore.calculatedAt.toISOString(),
        label: scoreLabel(company.trajectoryScore.score) as CompanyDetail['trajectoryScore'] extends { label: infer L } ? L : never,
        color: scoreColor(company.trajectoryScore.score) as CompanyDetail['trajectoryScore'] extends { color: infer C } ? C : never,
      }
    : null;

  const analysisText = generateAnalysisText(
    company.name,
    {
      score: company.trajectoryScore?.score ?? 0,
      revenueChange1Y: company.trajectoryScore?.revenueChange1Y ?? null,
      revenueChange2Y: company.trajectoryScore?.revenueChange2Y ?? null,
      netIncomeChange: company.trajectoryScore?.netIncomeChange ?? null,
      employeeTrend: company.trajectoryScore?.employeeTrend ?? null,
      eventScore: company.trajectoryScore?.eventScore ?? 0,
      details: { revenuePoints: 0, incomePoints: 0, employeePoints: 0, eventPoints: 0 },
    },
    latestFiscalYear,
    hasProcedure,
  );

  return {
    id: company.id,
    siren: company.siren,
    name: company.name,
    nafCode: company.nafCode,
    nafLabel: company.nafLabel,
    legalForm: company.legalForm,
    headquartersAddress: company.headquartersAddress,
    postalCode: company.postalCode,
    city: company.city,
    latitude: company.latitude,
    longitude: company.longitude,
    employeeRange: company.employeeRange,
    active: company.active,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
    financialStatements: company.financialStatements.map((fs: any) => ({
      id: fs.id,
      fiscalYear: fs.fiscalYear,
      closingDate: fs.closingDate?.toISOString() ?? null,
      revenue: fs.revenue,
      operatingIncome: fs.operatingIncome,
      netIncome: fs.netIncome,
      equity: fs.equity,
      debt: fs.debt,
      cash: fs.cash,
      source: fs.source,
      sourceUpdatedAt: fs.sourceUpdatedAt?.toISOString() ?? null,
    })),
    events: company.events.map((e: any) => ({
      id: e.id,
      eventType: e.eventType,
      eventDate: e.eventDate.toISOString(),
      title: e.title,
      description: e.description,
      source: e.source,
      sourceUrl: e.sourceUrl,
    })),
    trajectoryScore,
    trajectoryAnalysis: analysisText,
  };
}

// ─── Watchlist ──────────────────────────────────────────────────────────────

export async function addToWatchlist(companyId: string, userId = 'default'): Promise<void> {
  await prisma.userWatchlist.upsert({
    where: { userId_companyId: { userId, companyId } },
    create: { userId, companyId },
    update: {},
  });
}

export async function removeFromWatchlist(companyId: string, userId = 'default'): Promise<void> {
  await prisma.userWatchlist.deleteMany({ where: { userId, companyId } });
}

export async function getWatchlist(userId = 'default'): Promise<CompanyListItem[]> {
  const entries = await prisma.userWatchlist.findMany({
    where: { userId },
    include: {
      company: {
        include: {
          trajectoryScore: true,
          financialStatements: { orderBy: { fiscalYear: 'desc' }, take: 2 },
          events: { orderBy: { eventDate: 'desc' }, take: 3 },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return entries.map((entry: any): CompanyListItem => {
    const c = entry.company;
    const latestFS = c.financialStatements[0] ?? null;
    const previousFS = c.financialStatements[1] ?? null;
    return {
      id: c.id,
      siren: c.siren,
      name: c.name,
      nafCode: c.nafCode,
      nafLabel: c.nafLabel,
      city: c.city,
      postalCode: c.postalCode,
      latitude: c.latitude,
      longitude: c.longitude,
      employeeRange: c.employeeRange,
      active: c.active,
      distanceKm: null,
      latestRevenue: latestFS?.revenue ?? null,
      previousRevenue: previousFS?.revenue ?? null,
      latestNetIncome: latestFS?.netIncome ?? null,
      latestFiscalYear: latestFS?.fiscalYear ?? null,
      score: c.trajectoryScore?.score ?? null,
      revenueChange1Y: c.trajectoryScore?.revenueChange1Y ?? null,
      recentEvents: c.events.map((e: any) => ({
        eventType: e.eventType,
        eventDate: e.eventDate.toISOString(),
        title: e.title,
      })),
    };
  });
}
