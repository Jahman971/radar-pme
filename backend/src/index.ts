import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import companiesRouter from './api/routes/companies.routes';
import { errorHandler, notFoundHandler } from './api/middleware/errorHandler';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ─── Sécurité ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE'],
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Parsing ─────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', demoData: process.env.DEMO_DATA === 'true', ts: new Date().toISOString() });
});

app.use('/companies', companiesRouter);

// Alias raccourcis pratiques
app.post('/watchlist', companiesRouter);
app.delete('/watchlist/:companyId', companiesRouter);
app.get('/watchlist', companiesRouter);

// ─── Erreurs ─────────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Démarrage ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const mode = process.env.DEMO_DATA === 'true' ? '📊 MODE DÉMO' : '🔌 MODE PRODUCTION';
  console.log(`\n🚀 Radar PME API démarrée sur http://localhost:${PORT}`);
  console.log(`   ${mode}`);
  console.log(`   Environnement : ${process.env.NODE_ENV ?? 'development'}\n`);
});

export default app;
