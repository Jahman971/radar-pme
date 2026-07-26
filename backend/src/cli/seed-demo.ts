#!/usr/bin/env ts-node
import dotenv from 'dotenv';
dotenv.config();

import prisma from '../db/client';
import { generateDemoData } from './demo-data';
import { calculateAllScores } from '../services/scoring/calculator';

async function main() {
  console.log('\n🌱 Chargement du jeu de données de démonstration...\n');

  const { companies, financials, events } = generateDemoData();

  // ─── Nettoyage préalable ────────────────────────────────────────────────
  console.log('  → Nettoyage des données existantes...');
  await prisma.trajectoryScore.deleteMany();
  await prisma.userWatchlist.deleteMany();
  await prisma.companyEvent.deleteMany();
  await prisma.financialStatement.deleteMany();
  await prisma.company.deleteMany();

  // ─── Insertion des entreprises ─────────────────────────────────────────
  console.log(`  → Insertion de ${companies.length} entreprises...`);
  await prisma.company.createMany({
    data: companies.map((c) => ({
      siren: c.siren,
      name: c.name,
      nafCode: c.nafCode,
      nafLabel: c.nafLabel,
      legalForm: c.legalForm,
      headquartersAddress: c.headquartersAddress,
      postalCode: c.postalCode,
      city: c.city,
      latitude: c.latitude,
      longitude: c.longitude,
      employeeRange: c.employeeRange,
      active: c.active,
    })),
    skipDuplicates: true,
  });

  // ─── Insertion des financials ──────────────────────────────────────────
  console.log(`  → Insertion de ${financials.length} comptes annuels...`);
  const companyMap = await prisma.company.findMany({ select: { id: true, siren: true } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sirenToId = Object.fromEntries(companyMap.map((c: any) => [c.siren, c.id]));

  for (const fs of financials) {
    const companyId = sirenToId[fs.siren];
    if (!companyId) continue;
    await prisma.financialStatement.upsert({
      where: { companyId_fiscalYear: { companyId, fiscalYear: fs.fiscalYear } },
      create: {
        companyId,
        fiscalYear: fs.fiscalYear,
        closingDate: new Date(fs.fiscalYear, 11, 31),
        revenue: fs.revenue,
        operatingIncome: fs.operatingIncome,
        netIncome: fs.netIncome,
        equity: fs.equity,
        debt: fs.debt,
        cash: fs.cash,
        source: 'DEMO',
        sourceUpdatedAt: new Date(),
      },
      update: {},
    });
  }

  // ─── Insertion des événements ──────────────────────────────────────────
  console.log(`  → Insertion de ${events.length} événements...`);
  for (const evt of events) {
    const companyId = sirenToId[evt.siren];
    if (!companyId) continue;
    await prisma.companyEvent.create({
      data: {
        companyId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eventType: evt.eventType as any,
        eventDate: evt.eventDate,
        title: evt.title,
        description: evt.description,
        source: evt.source,
        sourceUrl: evt.sourceUrl,
      },
    });
  }

  // ─── Paramètres de scoring (valeurs par défaut) ─────────────────────────
  console.log('  → Initialisation des paramètres de scoring...');
  const scoringDefaults = [
    { key: 'revenue_drop_mild', value: 10, label: 'Points baisse CA -10 à -20%' },
    { key: 'revenue_drop_moderate', value: 20, label: 'Points baisse CA -20 à -30%' },
    { key: 'revenue_drop_significant', value: 30, label: 'Points baisse CA -30 à -50%' },
    { key: 'revenue_drop_severe', value: 40, label: 'Points baisse CA < -50%' },
    { key: 'income_drop_threshold', value: 30, label: 'Seuil de baisse résultat (%)' },
    { key: 'income_drop_points', value: 10, label: 'Points baisse résultat > seuil' },
    { key: 'income_turns_negative_points', value: 20, label: 'Points résultat devient négatif' },
    { key: 'income_two_years_negative_points', value: 25, label: 'Points résultat négatif 2 ans' },
    { key: 'employee_drop_mild', value: 5, label: 'Points baisse effectif > 10%' },
    { key: 'employee_drop_severe', value: 10, label: 'Points baisse effectif > 20%' },
    { key: 'event_management_change', value: 5, label: 'Points changement dirigeant' },
    { key: 'event_branch_closure', value: 10, label: 'Points fermeture établissement' },
  ];

  for (const cfg of scoringDefaults) {
    await prisma.scoringConfig.upsert({
      where: { key: cfg.key },
      create: cfg,
      update: { value: cfg.value },
    });
  }

  // ─── Calcul des scores ─────────────────────────────────────────────────
  console.log('  → Calcul des scores de rupture...');
  const { updated } = await calculateAllScores();

  console.log('\n✅ Démonstration chargée avec succès !');
  console.log(`   Entreprises  : ${companies.length}`);
  console.log(`   Financials   : ${financials.length}`);
  console.log(`   Événements   : ${events.length}`);
  console.log(`   Scores       : ${updated}`);
  console.log('\n   Lancez maintenant : npm run dev\n');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Erreur seed:', err);
  process.exit(1);
});
