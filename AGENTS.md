# AGENTS.md — Radar PME

Fichier de configuration pour agents IA (Codex, Claude, etc.).
Lis ce fichier en entier avant toute modification du code.

---

## Présentation du projet

**Radar PME** est un outil d'analyse de trajectoire économique pour les PME françaises.
Il agrège des données publiques (SIRENE, INPI, BODACC) et calcule un **score de rupture de trajectoire** (0–100) pour identifier les entreprises dont la situation se dégrade.

Repository : https://github.com/Jahman971/radar-pme

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | Node.js 20, TypeScript, Express, Prisma ORM |
| Base de données | PostgreSQL 16 |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Tests | Jest + ts-jest |
| Infra | Docker Compose |

---

## Structure du projet

```
radar-pme/
├── backend/
│   ├── prisma/schema.prisma        # Schéma DB — ne pas modifier sans migration
│   ├── src/
│   │   ├── api/routes/             # Routes Express
│   │   ├── cli/                    # Scripts CLI (seed, import, scores)
│   │   ├── connectors/             # Connecteurs sources externes
│   │   │   ├── sirene/             # SireneProvider (stub à implémenter)
│   │   │   ├── inpi/               # InpiProvider (stub à implémenter)
│   │   │   └── bodacc/             # BodaccProvider (partiellement implémenté)
│   │   ├── db/client.ts            # Singleton Prisma
│   │   ├── services/
│   │   │   ├── companies.service.ts # Logique métier principale
│   │   │   └── scoring/
│   │   │       ├── engine.ts       # Calcul du score — FONCTION PURE
│   │   │       ├── calculator.ts   # Persistance des scores
│   │   │       └── config.ts       # Paramètres par défaut
│   │   ├── types/index.ts          # Interfaces TypeScript partagées
│   │   └── utils/                  # geo (Haversine), format
│   └── tests/unit/                 # 53 tests Jest
├── frontend/
│   └── src/
│       ├── app/radar/              # Page principale Radar
│       ├── app/companies/[siren]/  # Fiche entreprise
│       ├── app/watchlist/          # Liste de suivi
│       ├── components/             # CompanyCard, FilterPanel, ScoreBadge, Charts
│       └── lib/api.ts              # Client API + helpers
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Commandes essentielles

```bash
# Backend
cd backend
npm install
npm run dev                  # :3001
npm test                     # 53 tests unitaires
npm run seed:demo            # Charge 120 PME fictives IDF
npm run calculate:scores     # Recalcule tous les scores
npx prisma migrate dev       # Migrations
npx prisma studio            # Explorer la DB

# Frontend
cd frontend
npm install
npm run dev                  # :3000
```

---

## Variables d'environnement

Fichier `.env` à la racine de `backend/` (copier depuis `../.env.example`) :

```
DATABASE_URL=postgresql://radar:radar_secret@localhost:5432/radar_pme
PORT=3001
NODE_ENV=development
DEMO_DATA=true               # false = connecteurs API réels
CORS_ORIGIN=http://localhost:3000
SIRENE_API_KEY=              # Optionnel si DEMO_DATA=true
INPI_API_KEY=                # Optionnel si DEMO_DATA=true
```

---

## Règles de développement — à respecter impérativement

### Architecture
- **Pas de microservices.** Monolithe simple, une seule machine.
- **Connecteurs isolés.** Toute source externe passe par une interface (`CompanyDataProvider`, `FinancialDataProvider`, `EventDataProvider`). Pas d'appels API directs dans les contrôleurs.
- **Scoring pur.** `engine.ts` est une fonction pure sans effets de bord. Ne jamais y ajouter d'appels DB ou réseau.
- **Pagination serveur obligatoire.** Ne jamais charger toutes les entreprises en mémoire ou en frontend.

### Sources de données
- **Ne jamais supposer un schéma API.** Lire la documentation officielle avant d'implémenter un connecteur.
- Sources officielles :
  - SIRENE : https://api.insee.fr/catalogue/
  - INPI/RNE : https://registre-national-entreprises.inpi.fr/api
  - BODACC : https://bodacc-datadila.opendatasoft.com/api/explore/v2.1 (public, sans clé)

### Sécurité
- Pas de données personnelles des dirigeants.
- Pas de scraping LinkedIn ou de sources non officielles.
- Secrets uniquement dans les variables d'environnement, jamais en dur.
- Logs sans données sensibles.

### Analyse textuelle
- Le texte généré par `generateAnalysisText()` est **déterministe** (basé sur des faits observables).
- Ne jamais écrire "cette entreprise est en difficulté" ou prédire une faillite.
- Les procédures collectives s'affichent séparément — elles ne sont **pas** intégrées au score global.

### Tests
- Tout nouveau calcul ou utilitaire doit avoir des tests unitaires.
- Tester impérativement : CA N-1 = 0, exercice manquant, valeur NULL, entreprise avec un seul exercice, doublons SIREN.

---

## Score de rupture de trajectoire (0–100)

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
| Changement dirigeant | — | 5 |
| Fermeture établissement | — | 10 |

Les paramètres sont configurables dans la table `ScoringConfig` ou dans `src/services/scoring/config.ts`.

---

## API REST

```
GET  /companies                    Liste filtrée et paginée
     ?latitude&longitude&radius    Géographie (Haversine)
     &naf                          Préfixe code NAF
     &revenueMin&revenueMax        CA en €
     &revenueChangeMax             Variation CA max (ex: -20)
     &scoreMin                     Score minimum (0–100)
     &page&pageSize&sort

GET  /companies/:siren             Détail complet
GET  /companies/:siren/financials  Comptes annuels
GET  /companies/:siren/events      Événements BODACC
GET  /companies/:siren/trajectory  Score + analyse textuelle
GET  /companies/watchlist          Liste de suivi
POST /companies/watchlist          { companyId }
DELETE /companies/watchlist/:id
GET  /health
```

---

## Roadmap — ne pas implémenter sauf instruction explicite

- Alertes email hebdomadaires
- Comptes utilisateurs avancés / authentification
- Paiement Stripe
- IA générative / résumés LLM
- CRM intégré
- Exports Excel / PDF
- Carte interactive (Leaflet/Mapbox)
- Prédiction / machine learning
- Enrichissement contacts dirigeants
- API commerciale avec rate limiting par token

---

## État actuel du MVP (V0)

- ✅ Architecture complète backend + frontend
- ✅ Schéma Prisma + migrations
- ✅ Moteur de scoring configurable
- ✅ 120 PME fictives IDF (seed démo)
- ✅ Toutes les routes API
- ✅ Frontend Next.js complet (Radar, fiche, watchlist)
- ✅ 53 tests unitaires
- ⏳ Connecteur SIRENE (stub documenté)
- ⏳ Connecteur INPI (stub documenté)
- ⏳ Connecteur BODACC (partiellement implémenté)
- ⏳ Authentification utilisateurs
- ⏳ Carte interactive
