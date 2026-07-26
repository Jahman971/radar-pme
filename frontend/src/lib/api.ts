const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  latestRevenue: number | null;
  previousRevenue: number | null;
  latestNetIncome: number | null;
  latestFiscalYear: number | null;
  score: number | null;
  revenueChange1Y: number | null;
  recentEvents: Array<{ eventType: string; eventDate: string; title: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FinancialStatement {
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

export interface CompanyEvent {
  id: string;
  eventType: string;
  eventDate: string;
  title: string;
  description: string | null;
  source: string;
  sourceUrl: string | null;
}

export interface TrajectoryScore {
  score: number;
  revenueChange1Y: number | null;
  revenueChange2Y: number | null;
  netIncomeChange: number | null;
  employeeTrend: number | null;
  eventScore: number;
  calculatedAt: string;
  label: string;
  color: string;
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
  financialStatements: FinancialStatement[];
  events: CompanyEvent[];
  trajectoryScore: TrajectoryScore | null;
  trajectoryAnalysis: string;
}

export interface SearchFilters {
  latitude?: number;
  longitude?: number;
  radius?: number;
  naf?: string;
  revenueMin?: number;
  revenueMax?: number;
  revenueChangeMax?: number;
  scoreMin?: number;
  page?: number;
  pageSize?: number;
  sort?: 'score' | 'revenueChange' | 'distance' | 'revenue';
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  companies: {
    list: (filters: SearchFilters): Promise<PaginatedResponse<CompanyListItem>> => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          params.set(k, String(v));
        }
      });
      return apiFetch<PaginatedResponse<CompanyListItem>>(`/companies?${params}`);
    },

    getBySiren: (siren: string): Promise<CompanyDetail> =>
      apiFetch<CompanyDetail>(`/companies/${siren}`),
  },

  watchlist: {
    get: (): Promise<CompanyListItem[]> =>
      apiFetch<CompanyListItem[]>('/companies/watchlist'),

    add: (companyId: string): Promise<void> =>
      apiFetch<void>('/companies/watchlist', {
        method: 'POST',
        body: JSON.stringify({ companyId }),
      }),

    remove: (companyId: string): Promise<void> =>
      apiFetch<void>(`/companies/watchlist/${companyId}`, { method: 'DELETE' }),
  },
};

// ─── Helpers de formatage ─────────────────────────────────────────────────────

export function formatEuros(amount: number | null): string {
  if (amount === null || amount === undefined) return '—';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace('.', ',')} M€`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)} k€`;
  return `${sign}${abs.toLocaleString('fr-FR')} €`;
}

export function formatPct(value: number | null): string {
  if (value === null || value === undefined) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)} %`;
}

export function scoreColor(score: number | null): 'green' | 'orange' | 'red' {
  if (score === null) return 'green';
  if (score >= 60) return 'red';
  if (score >= 30) return 'orange';
  return 'green';
}

export function scoreLabel(score: number | null): string {
  if (score === null) return '—';
  if (score >= 60) return 'Rupture forte';
  if (score >= 30) return 'Rupture modérée';
  return 'Stable';
}

export function employeeLabel(range: string | null): string {
  if (!range) return 'NC';
  const map: Record<string, string> = {
    '00': '0', '01': '1–2', '02': '3–5', '03': '6–9',
    '11': '10–19', '12': '20–49', '21': '50–99', '22': '100–199',
    '31': '200–249', '32': '250–499', '41': '500–999', '42': '1000–1999',
    '51': '2000–4999', '52': '5000–9999', '53': '10 000+',
  };
  return map[range] ?? range;
}

export function eventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    CREATION: 'Création',
    MODIFICATION: 'Modification',
    CESSION: 'Cession',
    RADIATION: 'Radiation',
    PROCEDURE_COLLECTIVE: 'Procédure collective',
    CHANGEMENT_DIRIGEANT: 'Changement de dirigeant',
    FERMETURE_ETABLISSEMENT: 'Fermeture d\'établissement',
    DEPOT_COMPTES: 'Dépôt des comptes',
    AUTRE: 'Autre',
  };
  return labels[type] ?? type;
}
