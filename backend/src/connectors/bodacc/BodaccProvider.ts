/**
 * Connecteur BODACC
 *
 * API publique (sans clé) : https://bodacc-datadila.opendatasoft.com/api/explore/v2.1
 * Documentation           : https://www.bodacc.fr/pages/accueil-bodacc/
 *
 * NOTE MVP : les appels réels sont désactivés quand DEMO_DATA=true.
 */
import { EventDataProvider, EventRecord } from '../../types';

interface BodaccRecord {
  registre?: string;
  dateparution?: string;
  familleavis_lib?: string;
  listepersonnes?: Array<{
    denomination?: string;
    siren?: string;
  }>;
  publicationavis?: string;
  jugement?: { complementjugement?: string };
  depot?: { datecloture?: string };
}

export class BodaccProvider implements EventDataProvider {
  name = 'BODACC';

  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.BODACC_API_URL
      ?? 'https://bodacc-datadila.opendatasoft.com/api/explore/v2.1';
  }

  async fetchEvents(siren: string): Promise<Partial<EventRecord>[]> {
    const url = new URL(`${this.baseUrl}/catalog/datasets/annonces-commerciales/records`);
    url.searchParams.set('where', `siren="${siren}"`);
    url.searchParams.set('limit', '50');
    url.searchParams.set('order_by', 'dateparution DESC');

    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });

    if (!res.ok) {
      console.error(`[BodaccProvider] Erreur ${res.status} pour SIREN ${siren}`);
      return [];
    }

    const json = await res.json() as { results?: BodaccRecord[] };
    const records = json.results ?? [];

    return records.map((r): Partial<EventRecord> => ({
      siren,
      eventType: this.mapEventType(r.familleavis_lib ?? ''),
      eventDate: r.dateparution ? new Date(r.dateparution) : new Date(),
      title: r.familleavis_lib ?? 'Annonce BODACC',
      description: r.publicationavis ?? undefined,
      source: 'BODACC',
      sourceUrl: `https://www.bodacc.fr/annonce/detail-annonce/${r.registre ?? ''}`,
    }));
  }

  private mapEventType(familleavis: string): string {
    const f = familleavis.toLowerCase();
    if (f.includes('procédure')) return 'PROCEDURE_COLLECTIVE';
    if (f.includes('cessation') || f.includes('cession')) return 'CESSION';
    if (f.includes('radiation')) return 'RADIATION';
    if (f.includes('création') || f.includes('immatriculation')) return 'CREATION';
    if (f.includes('dépôt') || f.includes('comptes')) return 'DEPOT_COMPTES';
    if (f.includes('modifi')) return 'MODIFICATION';
    return 'AUTRE';
  }
}
