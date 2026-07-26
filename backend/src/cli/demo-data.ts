/**
 * Jeu de données de démonstration — 120 PME fictives d'Île-de-France
 * 3 exercices fiscaux par entreprise, événements BODACC variés
 */

export interface DemoCompany {
  siren: string;
  name: string;
  nafCode: string;
  nafLabel: string;
  legalForm: string;
  headquartersAddress: string;
  postalCode: string;
  city: string;
  latitude: number;
  longitude: number;
  employeeRange: string;
  active: boolean;
  profile: 'growth' | 'stable' | 'mild_decline' | 'severe_decline' | 'recovery';
}

export interface DemoFinancials {
  siren: string;
  fiscalYear: number;
  revenue: number;
  operatingIncome: number;
  netIncome: number;
  equity: number;
  debt: number;
  cash: number;
}

export interface DemoEvent {
  siren: string;
  eventType: string;
  eventDate: Date;
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
}

// ─── Villes d'Île-de-France avec coordonnées ─────────────────────────────────

const IDF_CITIES = [
  { city: 'Paris 1er', postalCode: '75001', lat: 48.8600, lng: 2.3477 },
  { city: 'Paris 8e', postalCode: '75008', lat: 48.8753, lng: 2.3072 },
  { city: 'Paris 11e', postalCode: '75011', lat: 48.8589, lng: 2.3792 },
  { city: 'Paris 13e', postalCode: '75013', lat: 48.8317, lng: 2.3567 },
  { city: 'Paris 15e', postalCode: '75015', lat: 48.8412, lng: 2.2945 },
  { city: 'Paris 19e', postalCode: '75019', lat: 48.8828, lng: 2.3900 },
  { city: 'Boulogne-Billancourt', postalCode: '92100', lat: 48.8352, lng: 2.2407 },
  { city: 'Neuilly-sur-Seine', postalCode: '92200', lat: 48.8846, lng: 2.2690 },
  { city: 'Levallois-Perret', postalCode: '92300', lat: 48.8952, lng: 2.2872 },
  { city: 'Issy-les-Moulineaux', postalCode: '92130', lat: 48.8237, lng: 2.2714 },
  { city: 'Courbevoie', postalCode: '92400', lat: 48.8967, lng: 2.2533 },
  { city: 'Nanterre', postalCode: '92000', lat: 48.8920, lng: 2.2071 },
  { city: 'Saint-Denis', postalCode: '93200', lat: 48.9362, lng: 2.3574 },
  { city: 'Montreuil', postalCode: '93100', lat: 48.8635, lng: 2.4443 },
  { city: 'Vincennes', postalCode: '94300', lat: 48.8477, lng: 2.4392 },
  { city: 'Créteil', postalCode: '94000', lat: 48.7904, lng: 2.4556 },
  { city: 'Vitry-sur-Seine', postalCode: '94400', lat: 48.7877, lng: 2.3924 },
  { city: 'Massy', postalCode: '91300', lat: 48.7302, lng: 2.2713 },
  { city: 'Vélizy-Villacoublay', postalCode: '78140', lat: 48.7806, lng: 2.1793 },
  { city: 'Versailles', postalCode: '78000', lat: 48.8014, lng: 2.1301 },
  { city: 'Saint-Quentin-en-Yvelines', postalCode: '78180', lat: 48.7764, lng: 2.0559 },
  { city: 'Cergy', postalCode: '95000', lat: 49.0359, lng: 2.0630 },
  { city: 'Argenteuil', postalCode: '95100', lat: 48.9483, lng: 2.2488 },
  { city: 'Evry-Courcouronnes', postalCode: '91000', lat: 48.6319, lng: 2.4428 },
  { city: 'Melun', postalCode: '77000', lat: 48.5404, lng: 2.6601 },
  { city: 'Meaux', postalCode: '77100', lat: 48.9600, lng: 2.8845 },
];

// ─── Secteurs NAF ────────────────────────────────────────────────────────────

const NAF_SECTORS = [
  { code: '4120A', label: 'Construction de maisons individuelles' },
  { code: '4120B', label: 'Construction d\'autres bâtiments' },
  { code: '4619B', label: 'Autres intermédiaires du commerce en produits divers' },
  { code: '4711F', label: 'Hypermarchés' },
  { code: '4752B', label: 'Commerce de détail de matériels de télécommunication' },
  { code: '4941A', label: 'Transports routiers de fret interurbains' },
  { code: '5610A', label: 'Restauration traditionnelle' },
  { code: '5610C', label: 'Restauration rapide' },
  { code: '5812Z', label: 'Édition de répertoires et de fichiers d\'adresses' },
  { code: '6201Z', label: 'Programmation informatique' },
  { code: '6202A', label: 'Conseil en systèmes et logiciels informatiques' },
  { code: '6419Z', label: 'Autres intermédiations monétaires' },
  { code: '6820B', label: 'Location de terrains et d\'autres biens immobiliers' },
  { code: '6910Z', label: 'Activités juridiques' },
  { code: '7010Z', label: 'Activités des sièges sociaux' },
  { code: '7021Z', label: 'Conseil en relations publiques et communication' },
  { code: '7022Z', label: 'Conseil pour les affaires et autres conseils de gestion' },
  { code: '7112B', label: 'Ingénierie, études techniques' },
  { code: '7320Z', label: 'Études de marché et sondages' },
  { code: '7490B', label: 'Activités spécialisées, scientifiques et techniques diverses' },
  { code: '8110Z', label: 'Activités combinées de soutien lié aux bâtiments' },
  { code: '8299Z', label: 'Autres activités de soutien aux entreprises' },
  { code: '2511Z', label: 'Fabrication de structures métalliques et de parties de structures' },
  { code: '2512Z', label: 'Fabrication de portes et fenêtres en métal' },
  { code: '3290Z', label: 'Autres industries manufacturières' },
];

const LEGAL_FORMS = ['SAS', 'SASU', 'SARL', 'SA', 'EURL', 'SNC'];

const COMPANY_NAME_PREFIXES = [
  'MARTIN', 'DUPONT', 'BERNARD', 'THOMAS', 'ROBERT', 'PETIT', 'RICHARD', 'DURAND',
  'LEROY', 'MOREAU', 'SIMON', 'LAURENT', 'LEFEBVRE', 'MICHEL', 'GARCIA', 'DAVID',
  'BERTRAND', 'ROUX', 'VINCENT', 'FOURNIER', 'MOREL', 'GIRARD', 'ANDRE', 'LEFEVRE',
  'MERCIER', 'DUPUIS', 'LAMBERT', 'BONNET', 'FRANCOIS', 'MARTINEZ', 'LEGRAND',
];

const COMPANY_NAME_SUFFIXES = [
  'INDUSTRIES', 'SERVICES', 'SOLUTIONS', 'GROUPE', 'CONSEIL', 'TECHNOLOGIES',
  'CONSTRUCTION', 'TRANSPORT', 'DISTRIBUTION', 'IMMOBILIER', 'SYSTEMES',
  'INGENIERIE', 'BATIMENT', 'LOGISTIQUE', 'INFORMATIQUE', 'RESTAURATION',
];

// ─── Générateur déterministe ─────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function generateSiren(index: number): string {
  const base = (400000000 + index * 7919).toString().padStart(9, '0');
  return base.slice(0, 9);
}

// ─── Profils de trajectoires ─────────────────────────────────────────────────

type Profile = 'growth' | 'stable' | 'mild_decline' | 'severe_decline' | 'recovery';

const PROFILES: { profile: Profile; weight: number }[] = [
  { profile: 'growth', weight: 15 },
  { profile: 'stable', weight: 25 },
  { profile: 'mild_decline', weight: 30 },
  { profile: 'severe_decline', weight: 20 },
  { profile: 'recovery', weight: 10 },
];

function pickProfile(rng: () => number): Profile {
  const total = PROFILES.reduce((s, p) => s + p.weight, 0);
  let r = rng() * total;
  for (const p of PROFILES) {
    r -= p.weight;
    if (r <= 0) return p.profile;
  }
  return 'stable';
}

function generateFinancials(
  siren: string,
  baseRevenue: number,
  profile: Profile,
  rng: () => number,
): DemoFinancials[] {
  const noise = () => 1 + (rng() - 0.5) * 0.05; // ±2.5% bruit

  let revenueN2: number;
  let revenueN1: number;
  let revenueN: number;

  switch (profile) {
    case 'growth':
      revenueN2 = baseRevenue * 0.78 * noise();
      revenueN1 = baseRevenue * 0.89 * noise();
      revenueN = baseRevenue * noise();
      break;
    case 'stable':
      revenueN2 = baseRevenue * (0.97 + rng() * 0.06) * noise();
      revenueN1 = baseRevenue * (0.97 + rng() * 0.06) * noise();
      revenueN = baseRevenue * noise();
      break;
    case 'mild_decline':
      revenueN2 = baseRevenue * 1.18 * noise();
      revenueN1 = baseRevenue * 1.08 * noise();
      revenueN = baseRevenue * noise();
      break;
    case 'severe_decline':
      revenueN2 = baseRevenue * 1.55 * noise();
      revenueN1 = baseRevenue * 1.28 * noise();
      revenueN = baseRevenue * noise();
      break;
    case 'recovery':
      revenueN2 = baseRevenue * 1.35 * noise();
      revenueN1 = baseRevenue * 0.85 * noise();
      revenueN = baseRevenue * noise();
      break;
  }

  function incomeFromRevenue(rev: number, pct: number, neg: boolean): number {
    const val = rev * (pct + (rng() - 0.5) * 0.04);
    return neg ? -Math.abs(val) : val;
  }

  const incomeRatios = {
    growth: [0.06, 0.07, 0.09],
    stable: [0.05, 0.05, 0.05],
    mild_decline: [0.06, 0.04, 0.02],
    severe_decline: [0.07, 0.02, -0.03],
    recovery: [0.07, -0.04, 0.03],
  };

  const [r2, r1, r0] = incomeRatios[profile];
  const netN2 = incomeFromRevenue(revenueN2, Math.abs(r2), r2 < 0);
  const netN1 = incomeFromRevenue(revenueN1, Math.abs(r1), r1 < 0);
  const netN = incomeFromRevenue(revenueN, Math.abs(r0), r0 < 0);

  function makeStatement(fiscalYear: number, rev: number, net: number): DemoFinancials {
    const opIncome = net * (0.8 + rng() * 0.4);
    const equity = rev * (0.15 + rng() * 0.2);
    const debt = rev * (0.1 + rng() * 0.3);
    const cash = rev * (0.05 + rng() * 0.15);
    return {
      siren,
      fiscalYear,
      revenue: Math.round(rev),
      operatingIncome: Math.round(opIncome),
      netIncome: Math.round(net),
      equity: Math.round(equity),
      debt: Math.round(debt),
      cash: Math.round(cash),
    };
  }

  return [
    makeStatement(2021, revenueN2, netN2),
    makeStatement(2022, revenueN1, netN1),
    makeStatement(2023, revenueN, netN),
  ];
}

function generateEvents(siren: string, profile: Profile, rng: () => number): DemoEvent[] {
  const events: DemoEvent[] = [];

  // Dépôt de comptes (quasi systématique)
  events.push({
    siren,
    eventType: 'DEPOT_COMPTES',
    eventDate: new Date(2024, Math.floor(rng() * 6), Math.floor(rng() * 28) + 1),
    title: 'Dépôt des comptes annuels',
    description: 'Dépôt des comptes annuels exercice 2023',
    source: 'BODACC',
    sourceUrl: `https://www.bodacc.fr`,
  });

  if (profile === 'severe_decline' || profile === 'mild_decline') {
    if (rng() > 0.5) {
      events.push({
        siren,
        eventType: 'CHANGEMENT_DIRIGEANT',
        eventDate: new Date(2023, Math.floor(rng() * 12), Math.floor(rng() * 28) + 1),
        title: 'Changement de dirigeant',
        description: 'Modification de la direction — nouveau gérant désigné',
        source: 'BODACC',
        sourceUrl: `https://www.bodacc.fr`,
      });
    }
    if (rng() > 0.65) {
      events.push({
        siren,
        eventType: 'FERMETURE_ETABLISSEMENT',
        eventDate: new Date(2023, Math.floor(rng() * 12), Math.floor(rng() * 28) + 1),
        title: 'Fermeture d\'établissement secondaire',
        description: 'Fermeture d\'un établissement secondaire',
        source: 'BODACC',
        sourceUrl: `https://www.bodacc.fr`,
      });
    }
  }

  if (profile === 'severe_decline' && rng() > 0.75) {
    events.push({
      siren,
      eventType: 'PROCEDURE_COLLECTIVE',
      eventDate: new Date(2024, Math.floor(rng() * 6), Math.floor(rng() * 28) + 1),
      title: 'Ouverture d\'une procédure de sauvegarde',
      description: 'Ouverture d\'une procédure de sauvegarde judiciaire',
      source: 'BODACC',
      sourceUrl: `https://www.bodacc.fr`,
    });
  }

  if (profile === 'growth' && rng() > 0.6) {
    events.push({
      siren,
      eventType: 'MODIFICATION',
      eventDate: new Date(2023, Math.floor(rng() * 12), Math.floor(rng() * 28) + 1),
      title: 'Modification du capital social',
      description: 'Augmentation du capital social',
      source: 'BODACC',
      sourceUrl: `https://www.bodacc.fr`,
    });
  }

  return events;
}

// ─── Génération principale ────────────────────────────────────────────────────

export function generateDemoData(): {
  companies: DemoCompany[];
  financials: DemoFinancials[];
  events: DemoEvent[];
} {
  const companies: DemoCompany[] = [];
  const financials: DemoFinancials[] = [];
  const events: DemoEvent[] = [];

  const COUNT = 120;

  for (let i = 0; i < COUNT; i++) {
    const rng = seededRng(i * 31337 + 42);

    const city = pick(IDF_CITIES, rng);
    const sector = pick(NAF_SECTORS, rng);
    const legalForm = pick(LEGAL_FORMS, rng);
    const prefix = pick(COMPANY_NAME_PREFIXES, rng);
    const suffix = pick(COMPANY_NAME_SUFFIXES, rng);
    const profile = pickProfile(rng);

    // Variation légère de la position GPS (même ville, adresses différentes)
    const latJitter = (rng() - 0.5) * 0.02;
    const lngJitter = (rng() - 0.5) * 0.03;

    const siren = generateSiren(i);

    // CA de base entre 500k et 15M€
    const baseRevenue = 500_000 + Math.floor(rng() * 14_500_000);

    // Effectif
    const empRanges = ['11', '12', '21', '22', '31'];
    const employeeRange = pick(empRanges, rng);

    const streetNumbers = ['1', '3', '5', '8', '12', '15', '22', '35', '47', '64', '78', '92', '105', '123'];
    const streetTypes = ['Rue', 'Avenue', 'Boulevard', 'Allée', 'Impasse', 'Place'];
    const streetNames = [
      'de la République', 'du Commerce', 'des Industries', 'Victor Hugo', 'Jean Jaurès',
      'du Maréchal Foch', 'de la Liberté', 'du Général de Gaulle', 'de l\'Europe',
      'des Entrepreneurs', 'du Moulin', 'de la Paix', 'du Président Wilson',
    ];

    const streetNum = pick(streetNumbers, rng);
    const streetType = pick(streetTypes, rng);
    const streetName = pick(streetNames, rng);

    const company: DemoCompany = {
      siren,
      name: `${prefix} ${suffix} ${legalForm}`,
      nafCode: sector.code,
      nafLabel: sector.label,
      legalForm,
      headquartersAddress: `${streetNum} ${streetType} ${streetName}`,
      postalCode: city.postalCode,
      city: city.city,
      latitude: city.lat + latJitter,
      longitude: city.lng + lngJitter,
      employeeRange,
      active: profile !== 'severe_decline' || rng() > 0.2,
      profile,
    };

    companies.push(company);
    financials.push(...generateFinancials(siren, baseRevenue, profile, rng));
    events.push(...generateEvents(siren, profile, rng));
  }

  return { companies, financials, events };
}
