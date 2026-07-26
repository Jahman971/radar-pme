#!/usr/bin/env ts-node
import dotenv from 'dotenv';
dotenv.config();

import prisma from '../db/client';
import { calculateAllScores } from '../services/scoring/calculator';

async function main() {
  console.log('\n📊 Calcul des scores de rupture de trajectoire...\n');
  const start = Date.now();
  const { updated } = await calculateAllScores();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ ${updated} scores calculés en ${elapsed}s\n`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
