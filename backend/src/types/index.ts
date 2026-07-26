// ─── Types partagés Radar PME ────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CompanyListItem {
  id: string;
  siren: string;
  name: string;
  nafCode: string;
  nafLabel: string;
  city: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  employeeRange: string | null;
  active: boolean;
  distanceKm: number | null;
  // Derniers financials
  latestRevenue: number | null;
  previousRevenue: number | null;
  latestNetIncome: number | null;
  latestFiscalYear: number | null;
  // Score
  score: number | null;
  revenueChange1Y: number | null;
  // Événements récents
  recentEvents: Array<{
    eventType: string;
    eventDate: string;
    title: string;
  }>;
}

export interface CompanyDetail {
  id: string;
  siren: string;
  name: string;
  nafCode: string;
  nafLabel: string;
  legalForm: string | null;
  headquartersAddress: string | null;
  postalCode: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  employeeRange: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  financialStatements: FinancialStatementDTO[];
  events: CompanyEventDTO[];
  trajectoryScore: TrajectoryScoreDTO | null;
  trajectoryAnalysis: string;
}

export interface FinancialStatementDTO {
  id: string;
  fiscalYear: number;
  closingDate: string | null;
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  equity: number | null;
  debt: number | null;
  cash: number | null;
  source: string;
  sourceUpdatedAt: string | null;
}

export interface CompanyEventDTO {
  id: string;
  eventType: string;
  eventDate: string;
  title: string;
  description: string | null;
  source: string;
  sourceUrl: string | null;
}

export interface TrajectoryScoreDTO {
  score: number;
  revenueChange1Y: number | null;
  revenueChange2Y: number | null;
  netIncomeChange: number | null;
  employeeTrend: number | null;
  eventScore: number;
  calculatedAt: string;
  label: ScoreLabel;
  color: ScoreColor;
}

export type ScoreLabel = 'Stable' | 'Rupture modérée' | 'Rupture forte';
export type ScoreColor = 'green' | 'orange' | 'red';

export interface CompanyFilters {
  latitude?: number;
  longitude?: number;
  radius?: number; // km
  naf?: string;
  revenueMin?: number;
  revenueMax?: number;
  revenueChangeMax?: number; // ex: -20 pour filtrer CA baissé de plus de 20%
  employeeMin?: number;
  employeeMax?: number;
  scoreMin?: number;
  page?: number;
  pageSize?: number;
  sort?: 'score' | 'revenueChange' | 'distance' | 'revenue';
  activeOnly?: boolean;
}

// ─── Interfaces connecteurs ──────────────────────────────────────────────────

export interface CompanyDataProvider {
  name: string;
  fetchCompany(siren: string): Promise<Partial<CompanyRecord> | null>;
  searchByLocation(lat: number, lng: number, radiusKm: number): Promise<Partial<CompanyRecord>[]>;
}

export interface FinancialDataProvider {
  name: string;
  fetchFinancials(siren: string): Promise<Partial<FinancialRecord>[]>;
}

export interface EventDataProvider {
  name: string;
  fetchEvents(siren: string): Promise<Partial<EventRecord>[]>;
}

export interface CompanyRecord {
  siren: string;
  name: string;
  nafCode: string;
  nafLabel: string;
  legalForm: string;
  headquartersAddress: string;
  postalCode: string;
  city: string;
  latitude: number;
  longitude: number;
  employeeRange: string;
  active: boolean;
}

export interface FinancialRecord {
  siren: string;
  fiscalYear: number;
  closingDate: Date;
  revenue: number;
  operatingIncome: number;
  netIncome: number;
  equity: number;
  debt: number;
  cash: number;
  source: string;
}

export interface EventRecord {
  siren: string;
  eventType: string;
  eventDate: Date;
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

export interface ScoringParams {
  revenue_drop_mild: number;        // -10 à -20%
  revenue_drop_moderate: number;    // -20 à -30%
  revenue_drop_significant: number; // -30 à -50%
  revenue_drop_severe: number;      // < -50%
  income_drop_threshold: number;    // baisse > 30%
  income_drop_points: number;
  income_turns_negative_points: number;
  income_two_years_negative_points: number;
  employee_drop_mild: number;       // > 10%
  employee_drop_severe: number;     // > 20%
  event_management_change: number;
  event_branch_closure: number;
}
