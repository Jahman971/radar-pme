#!/usr/bin/env ts-node
/**
 * Commande d'import comptes annuels INPI/RNE
 * Désactivé si DEMO_DATA=true.
 */
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  if (process.env.DEMO_DATA === 'true') {
    console.log('⚠️  DEMO_DATA=true — import INPI désactivé.');
    process.exit(0);
  }
  console.log('\n📥 Import INPI — à implémenter\n');
  console.log('  1. Lire la doc : https://registre-national-entreprises.inpi.fr/api');
  console.log('  2. Configurer INPI_API_KEY dans .env');
  console.log('  3. Implémenter InpiProvider.fetchFinancials()');
  process.exit(0);
}

main();
