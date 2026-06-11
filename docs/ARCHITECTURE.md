# 🏗️ Architecture Technique — NEXUS

## Objectifs

- **Scalabilité** : supporter 4 milliards d'utilisateurs (≈ 500M DAU)
- **Latence** : < 100ms P95 sur la majorité des requêtes
- **Disponibilité** : 99,99% (52 min de downtime/an max)
- **Coût** : < 0,80€ par utilisateur actif annuel
- **Souveraineté** : données stockées dans la région légale de l'utilisateur

## Stack Technique

### Backend
- **Runtime** : Node.js 20 LTS (Fastify) pour API, Go pour services critiques (feed-ranker, crisis-detector)
- **Langages** : TypeScript (services applicatifs), Go (services performance-critical), Python (ML/IA)
- **API** : GraphQL Federation (Apollo) + REST pour les endpoints publics
- **Auth** : JWT (RS256) + OAuth2 + WebAuthn (passkeys par défaut)

### Données
- **PostgreSQL 16** — Source de vérité, sharded par `user_id` (Citus / Vitess)
- **Redis 7** — Cache + sessions + leaderboards + pub/sub
- **Kafka** — Event streaming (posts, likes, follows, transactions)
- **ClickHouse** — Analytics & data warehousing temps-réel
- **Elasticsearch** — Recherche full-text (multi-langues)
- **S3 + IPFS** — Stockage des médias (hot sur S3, archive sur IPFS)
- **Vector DB (Qdrant)** — Embeddings pour recommandation IA

### Infrastructure
- **Kubernetes** sur AWS/GCP/OVH (multi-cloud)
- **Istio** service mesh
- **Cloudflare** CDN + DDoS + Workers (edge compute)
- **Terraform** + ArgoCD pour le déploiement déclaratif
- **Prometheus** + **Grafana** + **OpenTelemetry** + **Loki**

### Frontend
- **Next.js 14** (App Router, RSC) pour le web
- **React Native + Expo** pour mobile
- **Tauri** pour desktop natif léger
- **TailwindCSS** + **shadcn/ui** pour le design système
- **TanStack Query** pour la gestion d'état serveur
- **Zustand** pour l'état client

## Architecture Microservices

```
┌─────────────────────────────────────────────────────────────┐
│                  GATEWAY (Apollo Router)                    │
└──┬───────┬───────┬───────┬───────┬───────┬───────┬─────────┘
   │       │       │       │       │       │       │
┌──▼──┐ ┌─▼───┐ ┌─▼───┐ ┌─▼───┐ ┌─▼──┐ ┌─▼───┐ ┌─▼─────────┐
│Auth │ │Feed │ │Post │ │Msg  │ │Wallet│ │Market│ │AI/Crisis │
└─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └──────────┘
   │       │       │       │       │       │       │
   └───────┴───────┴───┬───┴───────┴───────┴───────┘
                      │
              ┌───────▼────────┐
              │     Kafka      │  ← event bus
              └───────┬────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
    │ Workers │  │ Search  │  │Analytics│
    └─────────┘  └─────────┘  └─────────┘
```

### Services principaux

| Service | Responsabilité | Stack |
|---------|---------------|-------|
| `auth-service` | Inscription, login, MFA, sessions, identités fragmentées | Node.js + PostgreSQL |
| `user-service` | Profils, facettes, cercles concentriques | Node.js + PostgreSQL |
| `post-service` | CRUD posts, time-capsules, médias | Node.js + PostgreSQL + S3 |
| `feed-service` | Ranking, recommandation, dé-doublonnage | **Go** + Redis + Qdrant |
| `messaging-service` | Chat E2E, audio/vidéo, groupes | Node.js + WebRTC + Signal Protocol |
| `wallet-service` | Solde, transactions, payouts, fiscalité | **Go** + PostgreSQL (double-entry) |
| `marketplace-service` | Annonces, paiements, escrow, livraison | Node.js + Stripe |
| `tokenization-service` | Tokens créateurs, smart contracts | Node.js + EVM-compatible chain |
| `ai-service` | Recommandation, modération, vision, NLP | Python + PyTorch |
| `crisis-service` | Détection de détresse + escalade humaine | Python + Node.js |
| `media-service` | Encoding vidéo, transcoding, AR/audio spatial | Go + FFmpeg + WebGPU |
| `notification-service` | Push, email, in-app | Node.js + Kafka |
| `moderation-service` | Pipeline IA → humain → DAO | Python + Node.js |

## Stratégies de Scaling

### Sharding PostgreSQL
- Sharding par `user_id` (modulo N) avec **Citus**
- Réplication multi-région (1 primary + 2 read-replicas par shard)
- Read-replicas géolocalisés (européens lisent en Europe, etc.)

### Cache multi-niveaux
1. **L0** : Cloudflare Workers (edge) — feeds publics, profils
2. **L1** : Redis cluster (régional) — sessions, feed perso (TTL 60s)
3. **L2** : Memcached local (par pod) — config, features flags

### Event-driven
- Toute écriture émet un événement Kafka
- Les services downstream consomment de manière asynchrone
- Garantie at-least-once + idempotency keys

### Feed Ranking
- Pre-compute des feeds pour les **power users** (top 1%) en push
- Pull-based pour les autres avec cache de 60s
- Modèle hybride collaborative-filtering + content-based + graphe social
- Inference latence < 30ms (TensorRT sur GPU)

## Modèle de Données (haut niveau)

### Entités principales

```
User
  ├── Facets (1-N) : Pro, Perso, Créatif, Anonyme
  ├── Wallet (1-1) : solde, transactions, KYC level
  ├── Circles (1-N) : Intime → Public (5 niveaux)
  └── Reputation : score multi-dim (créativité, fiabilité, ...)

Post
  ├── Author (Facet)
  ├── Visibility (Circle min, Time-Capsule, géo)
  ├── Carbon-cost (kg CO2eq)
  ├── Tokens (option monétisation)
  └── Media (images, vidéo, audio spatial, AR)

Transaction (Wallet)
  ├── Type : ad_share, marketplace, tip, token, premium
  ├── Direction : credit/debit
  └── Tax-info : pays, TVA, KYC

CrisisAlert
  ├── User
  ├── Score (0-1)
  ├── Indicators
  └── Status : detected → reviewed → escalated → resolved
```

Voir [database/migrations/](../database/migrations/) pour le schéma complet.

## Sécurité

- **Chiffrement** : TLS 1.3, AES-256 at rest, E2E pour messages (Signal protocol)
- **Identités fragmentées** : chaque facette a sa propre clé cryptographique
- **Anti-fraude** : rate-limiting, fingerprinting, ML anti-bot
- **RGPD** : `dpo-service` dédié, export complet en < 24h, droit à l'oubli
- **Audit** : tous les accès admin loggés sur ledger immutable

## Observabilité

- **Logs** : Loki + structured logging (JSON)
- **Métriques** : Prometheus (RED + USE method)
- **Traces** : OpenTelemetry → Tempo
- **Alerting** : PagerDuty + automated incident response
- **SLOs** : définis par service, error budget tracké

## Estimation des coûts (à 1Md d'utilisateurs)

| Poste | Coût annuel |
|-------|-------------|
| Compute (K8s nodes) | 180M € |
| Storage (PostgreSQL + S3) | 90M € |
| Bandwidth / CDN | 240M € |
| ML/GPU inference | 60M € |
| Sécurité + Compliance | 30M € |
| **Total infra** | **~600M €** |

À 1Md d'users → **0,60€/user/an** d'infra. ✓ Sous l'objectif.
