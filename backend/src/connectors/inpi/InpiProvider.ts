/**
 * Connecteur INPI / RNE
 *
 * API officielle : https://registre-national-entreprises.inpi.fr/api
 * Documentation  : https://www.inpi.fr/fr/services-et-prestations/acces-aux-donnees-du-rne
 *
 * NOTE MVP : les appels réels sont désactivés quand DEMO_DATA=true.
 */
import { FinancialDataProvider, FinancialRecord } from '../../types';

export class InpiProvider implements FinancialDataProvider {
  name = 'INPI/RNE';

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.INPI_API_KEY ?? '';
    this.baseUrl = process.env.INPI_API_URL ?? 'https://registre-national-entreprises.inpi.fr/api';
  }

  async fetchFinancials(siren: string): Promise<Partial<FinancialRecord>[]> {
    if (!this.apiKey) {
      console.warn('[InpiProvider] INPI_API_KEY non configurée — mode DEMO actif');
      return [];
    }

    const url = `${this.baseUrl}/companies/${siren}/attachments`;
    const res = await fetch(url, {
      headers: { 'X-API-KEY': this.apiKey, Accept: 'application/json' },
    });

    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`INPI API error ${res.status}: ${await res.text()}`);

    const json = await res.json() as Record<string, unknown>;
    // TODO: parser les comptes annuels INPI/XBRL
    // Le format des pièces jointes INPI doit être analysé depuis la documentation officielle
    console.warn('[InpiProvider] Parsing comptes annuels INPI à implémenter');
    return [];
  }
}
