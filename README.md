# 🗺️ AURA

> **Le réseau social de ton quartier.**
> Ton aura de 500m est ton univers. Le reste du monde n'existe pas.

AURA n'affiche que ce qui est dans ton rayon de 500m : tes voisins, leurs ventes, leurs services, leurs événements. Quand tu te déplaces, ton univers se déplace avec toi.

## Les 6 idées que personne n'a faites à grande échelle

1. **🗺 Carte vivante** — Pas de timeline, une carte. Tu vois où sont tes voisins en temps réel.
2. **🤝 Auras qui fusionnent** — Croise un voisin IRL → ton chat se débloque (Bluetooth + GPS).
3. **🏘 Voisins, pas followers** — Pas de course aux abonnés. Un **Score de Voisinage**.
4. **🔮 Posts géo-verrouillés** — Certains posts ne s'ouvrent qu'en visitant un lieu physique.
5. **📡 Bluetooth mesh** — Marche dans le métro, indoor, sans GPS.
6. **🛠 Tout entre voisins** — Marketplace + babysitting + bricolage + cours + portages…

## Stack

- **Next.js 14** (App Router) — Frontend universel (web + mobile responsive)
- **TailwindCSS** — Design system
- **TypeScript** strict
- Déployé sur **Vercel**

## Pages

| Route | Description |
|-------|-------------|
| `/` | Carte vivante (par défaut) |
| `/voisinage` | Feed du quartier (style Instagram) |
| `/compose` | Publier (vente, service, event, géo-verrou…) |
| `/marche` | Marketplace par distance |
| `/profil` | Score voisinage, aura settings, impact |

## Design

- **Couleurs** : cream paper, vert forêt, sunset, coral, lilas, sand
- **Typographie** : Inter (sans-serif) + Caveat (handwriting pour moments émotionnels)
- **Mobile-first** avec bottom tab bar Instagram-style
- **Desktop** : sidebar nav + layouts multi-colonnes

## Démarrer

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Économie

Pub locale (5× plus chère car ultra-ciblée) + commission marketplace 8% + booking services + abonnement Pro + ticketing events.
**Cible : 150 Mds €/an à 4 milliards d'utilisateurs.**

## Licence

AGPL-3.0
