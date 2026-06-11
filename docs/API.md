# 📡 API Reference — NEXUS

API REST v1, JSON. Base URL : `https://api.nexus.social/api/v1` (prod) ou `http://localhost:4000/api/v1` (dev).

## Authentification

Toutes les routes sauf `/auth/*` et certaines lectures publiques requièrent un JWT dans le header :

```
Authorization: Bearer <token>
```

---

## Auth

### `POST /auth/signup`
Crée un compte + premier facet (perso) + cercles concentriques + wallet.

```json
{
  "email": "marie@example.com",
  "password": "motDePasseSolide!2025",
  "handle": "marie",
  "displayName": "Marie Dupont",
  "country": "FR",
  "locale": "fr-FR"
}
```

Réponse 201 :
```json
{
  "token": "eyJ...",
  "user": { "id": "uuid", "email": "marie@example.com", "kyc_level": 0 },
  "facet": { "id": "uuid", "handle": "marie", "display_name": "Marie Dupont", "facet_type": "perso" }
}
```

### `POST /auth/login`
```json
{ "email": "marie@example.com", "password": "..." }
```

### `POST /auth/facets`
Crée une nouvelle facet (jusqu'à 4 par utilisateur).
```json
{ "handle": "marie_pro", "displayName": "Marie Dupont — Pro", "facetType": "pro", "bio": "..." }
```

### `GET /auth/facets`
Liste les facets de l'utilisateur courant.

### `DELETE /auth/account`
Suppression de compte (RGPD). Soft delete, purge dure à J+30.

---

## Posts

### `POST /posts`
```json
{
  "facetId": "uuid",
  "content": "Bonjour le monde",
  "mediaUrls": ["https://..."],
  "visibility": 3,
  "timeCapsuleAt": "2030-01-01T00:00:00Z"
}
```
`visibility` : 1 (intime) → 5 (public).

### `GET /posts/:id`
Récupère un post. Si time-capsule scellée, ne renvoie que les métadonnées.

### `DELETE /posts/:id`
Soft-delete d'un de ses propres posts.

### `POST /posts/:id/react`
```json
{ "facetId": "uuid", "reactionType": "love" }
```
Types : `like` | `love` | `support` | `think` | `celebrate`.

### `POST /posts/:id/comment`
```json
{ "facetId": "uuid", "content": "Super post !", "parentId": null }
```

---

## Feed

### `GET /feed?facetId=<uuid>&cursor=<id>&limit=20`
Feed personnalisé d'une facet (posts des cercles + posts publics ranked).

### `GET /feed/discover?limit=20&language=fr`
Top posts publics 24h. Cache 60s.

---

## Wallet

### `GET /wallet`
Solde courant.
```json
{
  "user_id": "uuid",
  "balance_cents": 1632,
  "pending_cents": 0,
  "currency": "EUR"
}
```

### `GET /wallet/transactions?limit=50&type=ad_share`
Historique paginé.

### `POST /wallet/payout`
```json
{ "amountCents": 5000 }
```

---

## Cercles

### `GET /circles/:facetId`
Liste les 5 cercles d'une facet.

### `POST /circles/:circleId/members`
```json
{ "memberFacetId": "uuid" }
```

### `DELETE /circles/:circleId/members/:facetId`

---

## Marketplace

### `GET /marketplace/listings?category=...&limit=30`

### `POST /marketplace/listings`
```json
{
  "sellerFacetId": "uuid",
  "title": "Vélo électrique",
  "description": "...",
  "priceCents": 89900,
  "currency": "EUR",
  "category": "mobility",
  "condition": "used"
}
```

### `POST /marketplace/listings/:id/buy`
Débite l'acheteur, crédite le vendeur (après commission 10%).

---

## Crisis

### `GET /crisis/resources?lang=fr`
Ressources d'aide accessibles à tous (numéros d'urgence, etc.).

### `GET /crisis/alerts` *(staff)*
Liste des alertes ouvertes.

### `POST /crisis/alerts/:id/resolve` *(staff)*
```json
{ "status": "resolved", "notes": "Appel passé avec l'utilisateur." }
```

---

## Rate limits

- 1000 req/min par IP par défaut.
- 100 req/min pour les endpoints d'écriture authentifiés.

## Versioning

L'API est versionnée par préfixe (`/api/v1`). Les breaking changes déclenchent une nouvelle version. L'ancienne reste disponible 12 mois minimum.
