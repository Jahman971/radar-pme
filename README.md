# Radar PME

> Détecter les PME dont la trajectoire économique évolue sur votre territoire.

Radar PME est un outil d'analyse de trajectoire économique pour les PME françaises. Il agrège des données publiques (SIRENE, INPI, BODACC) et calcule un **score de rupture de trajectoire** permettant d'identifier les entreprises dont la situation se dégrade.

---

## Démarrage rapide

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) v2
- (développement local uniquement) Node.js ≥ 20

### Lancement avec Docker

```bash
# 1. Cloner et configurer
git clone <repo>
cd radar-pme
cp .env.example .env          # éditer si nécessaire

# 2. Construire et démarrer
docker compose up --build -d

# 3. Charger les données de démonstration
docker compose exec backend npm run seed:demo

# 4. Ouvrir l'application
# → Frontend : http://localhost:3000
# → API      : http://localhost:3001
# → Health   : http://localhost:3001/health
```

---

## Configuration

Copiez `.env.example` en `.env` et ajustez les valeurs :

| Variable | Défaut | Description |
|---|---|---|
| `DEMO_DATA` | `true` | `true` = données fictives, `false` = API officielles |
| `POSTGRES_USER` | `radar` | Utilisateur PostgreSQL |
| `POSTGRES_PASSWORD` | `radar_secret` | Mot de passe PostgreSQL |
| `POSTGRES_DB` | `radar_pme` | Nom de la base |
| `PORT` | `3001` | Port du backend |
| `CORS_ORIGIN` | `http://localhost:3000` | Origine autorisée CORS |
| `SIRENE_API_KEY` | — | Clé API INSEE (si DEMO_DATA=false) |
| `INPI_API_KEY` | — | Clé API INPI (si DEMO_DATA=false) |

---

## Installation locale (sans Docker)

```bash
# Base de données (PostgreSQL requis)
createdb radar_pme

# Backend
cd backend
npm install
cp ../.env.example .env       # adapter DATABASE_URL
npx prisma migrate dev
npm run seed:demo             # charge les 120 entreprises de démo
npm run dev                   # démarre sur :3001

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev                   # démarre sur :3000
```

---

## Base de données

### Migrations

```bash
cd backend

# Créer une nouvelle migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer en production
npx prisma migrate deploy

# Réinitialiser (supprime toutes les données !)
npx prisma migrate reset --force

# Explorer les données
npx prisma studio
```

### Schéma principal

| Table | Description |
|---|---|
| `Company` | Entreprise (SIREN, NAF, adresse, coordonnées GPS) |
| `FinancialStatement` | Compte annuel par exercice (CA, résultat, dettes…) |
| `CompanyEvent` | Événements BODACC (procédures, modifications…) |
| `TrajectoryScore` | Score de rupture calculé (0–100) |
| `UserWatchlist` | Liste de suivi utilisateur |
| `ScoringConfig` | Paramètres du moteur de scoring |

---

## Jeu de données de démonstration

Le seed génère **120 PME fictives** d'Île-de-France avec :
- 5 profils de trajectoire : croissance, stable, baisse légère, baisse sévère, redressement
- 3 exercices fiscaux (2021–2023) par entreprise
- Secteurs variés : BTP, informatique, conseil, restauration, transport, immobilier…
- Événements BODACC : changements de dirigeant, fermetures, dépôts de comptes, procédures

```bash
# Charger les données de démo
npm run seed:demo

# Recalculer uniquement les scores
npm run calculate:scores
```

---

## Import des données officielles

Pour passer en mode production (`DEMO_DATA=false`) :

```bash
# 1. Configurer les clés API dans .env
# 2. Importer les entreprises depuis SIRENE
npm run import:sirene

# 3. Importer les comptes annuels depuis INPI
npm run import:financials

# 4. Importer les événements BODACC
npm run import:bodacc

# 5. Calculer les scores
npm run calculate:scores
```

> **Note :** Les connecteurs SIRENE et INPI sont des stubs documentés. Ils doivent être implémentés en lisant la documentation officielle des APIs avant utilisation (voir `src/connectors/`).

---

## API

Base URL : `http://localhost:3001`

### Entreprises

```
GET  /companies                    Liste filtrée et paginée
GET  /companies/:siren             Détail d'une entreprise
GET  /companies/:siren/financials  Comptes annuels
GET  /companies/:siren/events      Événements BODACC
GET  /companies/:siren/trajectory  Score + analyse de trajectoire
```

**Filtres disponibles pour `GET /companies` :**

| Paramètre | Type | Description |
|---|---|---|
| `latitude` | number | Latitude du centre de recherche |
| `longitude` | number | Longitude du centre de recherche |
| `radius` | number | Rayon en km (1–500) |
| `naf` | string | Préfixe code NAF (ex: `62` pour informatique) |
| `revenueMin` | number | CA minimum (€) |
| `revenueMax` | number | CA maximum (€) |
| `revenueChangeMax` | number | Variation CA max (ex: `-20` pour baisses > 20%) |
| `scoreMin` | number | Score de rupture minimum (0–100) |
| `page` | number | Page (défaut: 1) |
| `pageSize` | number | Résultats par page (max: 100, défaut: 20) |
| `sort` | string | `score` \| `revenueChange` \| `distance` \| `revenue` |

### Watchlist

```
GET    /companies/watchlist          Liste de suivi
POST   /companies/watchlist          Ajouter { companyId }
DELETE /companies/watchlist/:id      Retirer
```

---

## Architecture

```
radar-pme/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── middleware/     # errorHandler
│   │   │   └── routes/         # companies.routes.ts
│   │   ├── cli/                # seed-demo, calculate-scores, imports
│   │   ├── connectors/
│   │   │   ├── sirene/         # SireneProvider (stub)
│   │   │   ├── inpi/           # InpiProvider (stub)
│   │   │   └── bodacc/         # BodaccProvider (partiellement impl.)
│   │   ├── db/                 # Prisma client singleton
│   │   ├── services/
│   │   │   ├── companies.service.ts  # logique métier principale
│   │   │   └── scoring/
│   │   │       ├── config.ts   # paramètres par défaut
│   │   │       ├── engine.ts   # calcul du score (pur, testable)
│   │   │       └── calculator.ts # persistance des scores
│   │   ├── types/              # interfaces TypeScript
│   │   └── utils/              # geo (Haversine), format
│   ├── prisma/
│   │   └── schema.prisma
│   └── tests/
│       └── unit/               # scoring, geo, demo-data
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── radar/          # page principale Radar
│       │   ├── companies/[siren]/  # fiche entreprise
│       │   └── watchlist/      # liste de suivi
│       ├── components/
│       │   ├── charts/         # RevenueChart, NetIncomeChart
│       │   └── ui/             # CompanyCard, FilterPanel, ScoreBadge
│       └── lib/
│           └── api.ts          # client API + helpers de formatage
└── docker-compose.yml
```

### Principes de conception

- **Pas de microservices** : monolithe simple, facile à déployer
- **Connecteurs isolés** : chaque source externe est derrière une interface (`CompanyDataProvider`, `FinancialDataProvider`, `EventDataProvider`)
- **Scoring pur** : `engine.ts` est une fonction pure sans effets de bord → facile à tester et configurer
- **Pagination serveur** : jamais de chargement intégral en frontend
- **Mode démo / prod** : basculement via `DEMO_DATA=true/false`

---

## Tests

```bash
cd backend

# Tous les tests
npm test

# Tests unitaires uniquement
npm run test:unit
```

Les tests couvrent :
- `scoring.test.ts` — moteur de scoring (cas limites : CA N-1=0, null, exercice unique, doublon SIREN, plafond 100)
- `geo.test.ts` — Haversine, bounding box, tranches d'effectif
- `demo-data.test.ts` — génération déterministe, structure, couverture

---

## Scoring

Le **score de rupture de trajectoire** (0–100) est calculé comme suit :

| Critère | Condition | Points |
|---|---|---|
| Variation CA | -10 à -20 % | 10 |
| Variation CA | -20 à -30 % | 20 |
| Variation CA | -30 à -50 % | 30 |
| Variation CA | < -50 % | 40 |
| Résultat net | Baisse > 30 % | 10 |
| Résultat net | Devient négatif | 20 |
| Résultat net | Négatif 2 ans consécutifs | 25 |
| Effectif | Baisse > 10 % | 5 |
| Effectif | Baisse > 20 % | 10 |
| Événement | Changement de dirigeant | 5 |
| Événement | Fermeture d'établissement | 10 |

> La procédure collective est affichée séparément et n'est pas intégrée au score global (pour ne pas créer de confusion).

Les paramètres sont configurables dans la table `ScoringConfig` ou dans `src/services/scoring/config.ts`.

---

## Limitations du MVP

- Authentification : un seul utilisateur "default" — pas de comptes multi-utilisateurs
- Les connecteurs SIRENE et INPI sont des stubs documentés (non implémentés)
- Le connecteur BODACC est partiellement implémenté (structure API à valider)
- La géolocalisation utilise une liste statique de villes en mode démo
- Pas de carte interactive (Leaflet/Mapbox)
- Pas d'export des données
- Variation d'effectif estimée à partir des tranches INSEE (pas de données précises)

---

## Roadmap (hors scope MVP)

- Alertes email hebdomadaires
- Comptes utilisateurs et authentification
- Carte interactive (Leaflet)
- Exports Excel/PDF
- Import SIRENE complet (fichier stock)
- Connecteurs INPI et BODACC complets
- Tableau de bord agrégé par territoire
- API commerciale avec rate limiting par token

---

## Sécurité

- Pas de données personnelles des dirigeants
- Pas de scraping LinkedIn
- Secrets dans variables d'environnement (jamais en dur)
- Rate limiting : 1000 req / 15 min par IP
- Headers sécurité via Helmet
- CORS restreint à l'origine configurée
- Logs sans données sensibles
