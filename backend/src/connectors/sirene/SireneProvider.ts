/**
 * Connecteur SIRENE / INSEE
 *
 * API officielle : https://api.insee.fr/catalogue/site/themes/wso2/subthemes/insee/pages/item-info.jag?name=Sirene&version=V3&provider=insee
 * Documentation  : https://www.sirene.fr/sirene/public/accueil
 *
 * NOTE MVP : les appels réels sont désactivés quand DEMO_DATA=true.
 * Implémenter les méthodes ci-dessous quand DEMO_DATA=false et SIRENE_API_KEY défini.
 */
import { CompanyDataProvider, CompanyRecord } from '../../types';

export class SireneProvider implements CompanyDataProvider {
  name = 'SIRENE/INSEE';

  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.insee.fr/entreprises/sirene/V3.11';

  constructor() {
    this.apiKey = process.env.SIRENE_API_KEY ?? '';
  }

  async fetchCompany(siren: string): Promise<Partial<CompanyRecord> | null> {
    if (!this.apiKey) {
      console.warn('[SireneProvider] SIRENE_API_KEY non configurée — mode DEMO actif');
      return null;
    }

    const url = `${this.baseUrl}/siren/${siren}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Sirene API error ${res.status}: ${await res.text()}`);

    const json = await res.json() as Record<string, unknown>;
    // TODO: mapper la réponse SIRENE V3.11 vers CompanyRecord
    // Le schéma exact doit être lu depuis la documentation avant implémentation
    console.warn('[SireneProvider] Mapping réponse SIRENE V3.11 à implémenter');
    return null;
  }

  async searchByLocation(
    _lat: number,
    _lng: number,
    _radiusKm: number,
  ): Promise<Partial<CompanyRecord>[]> {
    // SIRENE ne propose pas de recherche géographique directe par rayon.
    // Utiliser le fichier SIRENE complet ou l'API avec filtres sur code INSEE/postal.
    console.warn('[SireneProvider] Recherche géographique non disponible via SIRENE API');
    return [];
  }
}
