#!/usr/bin/env ts-node
/**
 * Commande d'import événements BODACC
 * Désactivé si DEMO_DATA=true.
 */
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  if (process.env.DEMO_DATA === 'true') {
    console.log('⚠️  DEMO_DATA=true — import BODACC désactivé.');
    process.exit(0);
  }
  console.log('\n📥 Import BODACC — à implémenter\n');
  console.log('  1. API publique : https://bodacc-datadila.opendatasoft.com/api/explore/v2.1');
  console.log('  2. Pas de clé requise pour l\'accès public');
  console.log('  3. BodaccProvider.fetchEvents() est partiellement implémenté');
  process.exit(0);
}

main();
