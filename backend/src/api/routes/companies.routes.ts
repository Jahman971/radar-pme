import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  listCompanies,
  getCompanyBySiren,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
} from '../../services/companies.service';
import { CompanyFilters } from '../../types';

const router = Router();

// ─── Validation schémas ─────────────────────────────────────────────────────

const listQuerySchema = z.object({
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radius: z.coerce.number().min(1).max(500).optional(),
  naf: z.string().optional(),
  revenueMin: z.coerce.number().optional(),
  revenueMax: z.coerce.number().optional(),
  revenueChangeMax: z.coerce.number().max(0).optional(),
  employeeMin: z.coerce.number().optional(),
  employeeMax: z.coerce.number().optional(),
  scoreMin: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['score', 'revenueChange', 'distance', 'revenue']).default('score'),
  activeOnly: z.coerce.boolean().default(true),
});

// ─── GET /companies ─────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Paramètres invalides', details: parsed.error.flatten() });
    return;
  }

  const filters: CompanyFilters = parsed.data;
  const result = await listCompanies(filters);
  res.json(result);
});

// ─── GET /companies/:siren ──────────────────────────────────────────────────

router.get('/:siren', async (req: Request, res: Response) => {
  const { siren } = req.params;
  if (!/^\d{9}$/.test(siren)) {
    res.status(400).json({ error: 'SIREN invalide (9 chiffres requis)' });
    return;
  }

  const company = await getCompanyBySiren(siren);
  if (!company) {
    res.status(404).json({ error: 'Entreprise introuvable' });
    return;
  }

  res.json(company);
});

// ─── GET /companies/:siren/financials ───────────────────────────────────────

router.get('/:siren/financials', async (req: Request, res: Response) => {
  const { siren } = req.params;
  if (!/^\d{9}$/.test(siren)) {
    res.status(400).json({ error: 'SIREN invalide' });
    return;
  }

  const company = await getCompanyBySiren(siren);
  if (!company) {
    res.status(404).json({ error: 'Entreprise introuvable' });
    return;
  }

  res.json(company.financialStatements);
});

// ─── GET /companies/:siren/events ───────────────────────────────────────────

router.get('/:siren/events', async (req: Request, res: Response) => {
  const { siren } = req.params;
  if (!/^\d{9}$/.test(siren)) {
    res.status(400).json({ error: 'SIREN invalide' });
    return;
  }

  const company = await getCompanyBySiren(siren);
  if (!company) {
    res.status(404).json({ error: 'Entreprise introuvable' });
    return;
  }

  res.json(company.events);
});

// ─── GET /companies/:siren/trajectory ──────────────────────────────────────

router.get('/:siren/trajectory', async (req: Request, res: Response) => {
  const { siren } = req.params;
  if (!/^\d{9}$/.test(siren)) {
    res.status(400).json({ error: 'SIREN invalide' });
    return;
  }

  const company = await getCompanyBySiren(siren);
  if (!company) {
    res.status(404).json({ error: 'Entreprise introuvable' });
    return;
  }

  res.json({
    trajectoryScore: company.trajectoryScore,
    trajectoryAnalysis: company.trajectoryAnalysis,
    financialStatements: company.financialStatements,
  });
});

// ─── POST /watchlist ────────────────────────────────────────────────────────

router.post('/watchlist', async (req: Request, res: Response) => {
  const { companyId } = req.body as { companyId?: string };
  if (!companyId) {
    res.status(400).json({ error: 'companyId requis' });
    return;
  }

  await addToWatchlist(companyId);
  res.status(201).json({ message: 'Ajouté à la liste' });
});

// ─── DELETE /watchlist/:companyId ───────────────────────────────────────────

router.delete('/watchlist/:companyId', async (req: Request, res: Response) => {
  const { companyId } = req.params;
  await removeFromWatchlist(companyId);
  res.json({ message: 'Retiré de la liste' });
});

// ─── GET /watchlist ─────────────────────────────────────────────────────────

router.get('/watchlist', async (_req: Request, res: Response) => {
  const list = await getWatchlist();
  res.json(list);
});

export default router;
