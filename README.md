# 🌍 NEXUS — Le Premier Réseau Social à Économie Inversée

> **Un réseau social conçu pour 4 milliards d'utilisateurs où l'humain reprend le contrôle.**

NEXUS révolutionne l'industrie des réseaux sociaux en inversant le modèle économique : ce sont les **utilisateurs qui sont rémunérés**, pas l'inverse. Une plateforme multi-sensorielle, scalable, éthique et rentable.

---

## 🎯 La Vision

Aucun réseau social existant ne combine simultanément :
- Une **économie inversée** (70% des revenus pub reversés aux users)
- Des **identités fragmentées** (multi-facettes : pro, perso, créatif, anonyme)
- Des **Time-Capsules** (posts qui s'ouvrent dans le futur)
- Une **détection de détresse** avec assistance humaine réelle
- Une **empreinte carbone visible** sur chaque action
- Un **mode "Vraie Vie"** (limite d'usage par défaut, débloquée par création utile)
- Une **tokenisation native** du contenu (créateurs monétisés en direct)
- Un **marketplace P2P** intégré (commerce sans intermédiaire)
- Des **cercles concentriques** de confiance (au lieu d'amis "plats")
- Une expérience **multi-sensorielle** (texte, audio spatial, AR, vidéo)

## 💰 Modèle Économique (4 milliards d'utilisateurs)

| Source | % Revenus | Détail |
|--------|-----------|--------|
| Publicité éthique | 30% | Opt-in, contextuelle, partagée 70/30 avec users |
| Marketplace P2P | 25% | Commission 5–15% sur transactions |
| Abonnement Premium | 20% | 4,99€/mois — fonctionnalités avancées |
| NEXUS Business | 15% | Outils pros, analytics, API |
| Data agrégée (anonyme) | 5% | Recherche, gouvernements, ONG (opt-in) |
| Tokens créateurs | 5% | Commission 2% sur les transactions de tokens |

**Projection à maturité (4 Mds d'utilisateurs)** : ~180 Mds €/an de revenus brut, ~45 Mds € EBITDA.

Voir [docs/BUSINESS_MODEL.md](./docs/BUSINESS_MODEL.md) pour le détail complet.

## 🏗️ Architecture

NEXUS est conçu **cloud-native** pour scaler horizontalement à des milliards d'utilisateurs :

```
┌────────────────────────────────────────────────────────────────┐
│                       CDN Global (Edge)                        │
├────────────────────────────────────────────────────────────────┤
│  Mobile (iOS/Android)  │  Web (Next.js)  │  Desktop (Tauri)    │
├────────────────────────────────────────────────────────────────┤
│              API Gateway (GraphQL + REST)                      │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│  Auth        │  Feed        │  Wallet      │  Marketplace      │
│  Service     │  Service     │  Service     │  Service          │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│  Messaging   │  Media       │  AI/Crisis   │  Tokenization     │
│  Service     │  Service     │  Service     │  Service          │
├──────────────┴──────────────┴──────────────┴──────────────────┤
│       Kafka (events) | Redis (cache) | Elasticsearch          │
├────────────────────────────────────────────────────────────────┤
│  PostgreSQL (shards)  │  S3/IPFS (media)  │  ClickHouse (BI)  │
└────────────────────────────────────────────────────────────────┘
```

Voir [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) pour les détails.

## 🚀 Démarrage Rapide

```bash
# Cloner et installer
git clone <repo>
cd RESEAUX-SOCIAUX

# Backend
cd backend && npm install && npm run dev

# Frontend
cd ../frontend && npm install && npm run dev

# Base de données (via Docker)
docker-compose up -d
```

## 📁 Structure du Projet

```
RESEAUX-SOCIAUX/
├── backend/              # API Node.js (microservices)
│   └── src/
│       ├── config/       # Configuration centralisée
│       ├── routes/       # Routes API REST + GraphQL
│       ├── controllers/  # Logique des endpoints
│       ├── services/     # Logique métier (Wallet, Feed, AI, ...)
│       ├── models/       # Modèles de données
│       ├── middleware/   # Auth, rate-limit, logger
│       ├── workers/      # Jobs asynchrones (Kafka consumers)
│       └── utils/        # Helpers partagés
├── frontend/             # Application Web (Next.js 14)
├── mobile/               # App mobile (React Native — à venir)
├── database/             # Migrations & seeds SQL
├── infrastructure/       # Docker, Kubernetes, Terraform
├── shared/               # Types TypeScript partagés
└── docs/                 # Documentation technique & business
```

## 🛡️ Sécurité & Éthique

- **Chiffrement E2E** des messages privés
- **Zero-knowledge proof** pour les vérifications d'identité
- **RGPD natif** : droit à l'oubli en 1 clic, export complet des données
- **Modération hybride** : IA + humain + démocratique (jurys d'utilisateurs)
- **Transparence algorithmique** : chaque user peut voir pourquoi un post est dans son feed
- **No-dark-pattern** : pas de notifications addictives, pas d'infinite scroll par défaut

## 📍 Roadmap

- **Phase 1 (Mois 1–6)** : MVP — Auth, posts, feed, cercles, wallet basique
- **Phase 2 (Mois 7–12)** : Marketplace, Time-Capsules, Crisis Detection
- **Phase 3 (Mois 13–18)** : Tokenisation, AR, audio spatial
- **Phase 4 (Mois 19–24)** : Mode "Vraie Vie", DAO de modération
- **Phase 5 (An 3+)** : Scaling global, fédération inter-instances

## 📜 Licence

AGPL-3.0 — Le code est libre et ouvert pour garantir la transparence.

---

**NEXUS** — Reconnectons l'humain au-dessus du profit.
