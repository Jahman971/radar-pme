#!/usr/bin/env ts-node
/**
 * Commande d'import SIRENE
 * Usage : npm run import:sirene
 *
 * Ce script est un squelette à compléter avec les appels API SIRENE réels.
 * Désactivé si DEMO_DATA=true.
 */
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  if (process.env.DEMO_DATA === 'true') {
    console.log('⚠️  DEMO_DATA=true — import SIRENE désactivé. Utilisez npm run seed:demo.');
    process.exit(0);
  }

  console.log('\n📥 Import SIRENE — à implémenter\n');
  console.log('  1. Lire la doc : https://api.insee.fr/catalogue/');
  console.log('  2. Configurer SIRENE_API_KEY dans .env');
  console.log('  3. Implémenter SireneProvider.fetchCompany()');
  console.log('  4. Boucler sur les SIREN cibles et insérer en base\n');
  process.exit(0);
}

main();
