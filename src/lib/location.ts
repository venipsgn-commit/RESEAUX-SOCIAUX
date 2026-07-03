// Gestion de la position de l'utilisateur (aura).
// La position réelle vient du GPS navigateur (composant client), est stockée
// dans un cookie 'aura_pos' lisible par les Server Components pour le feed.

export const AURA_POS_COOKIE = 'aura_pos';

export type AuraPosition = {
  lat: number;
  lng: number;
  quartier: string;
  /** true = position GPS réelle, false = fallback par défaut */
  real: boolean;
};

// Fallback : Bastille, Paris 11ᵉ (là où sont les voisins de démo)
export const DEFAULT_POSITION: AuraPosition = {
  lat: 48.8531,
  lng: 2.3692,
  quartier: 'Bastille · Paris 11ᵉ',
  real: false,
};

export const DEFAULT_RADIUS_M = 500;

/** Parse la valeur brute du cookie en AuraPosition (ou null si invalide). */
export function parsePositionCookie(raw: string | undefined | null): AuraPosition | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (
      typeof parsed?.lat === 'number' &&
      typeof parsed?.lng === 'number' &&
      Number.isFinite(parsed.lat) &&
      Number.isFinite(parsed.lng)
    ) {
      return {
        lat: parsed.lat,
        lng: parsed.lng,
        quartier: typeof parsed.quartier === 'string' ? parsed.quartier : 'Ma position',
        real: parsed.real !== false,
      };
    }
  } catch {
    // cookie corrompu → fallback
  }
  return null;
}

export function serializePositionCookie(pos: AuraPosition): string {
  return encodeURIComponent(JSON.stringify(pos));
}

/** Lit la position depuis le cookie côté navigateur (ou fallback). */
export function getClientPosition(): AuraPosition {
  if (typeof document === 'undefined') return DEFAULT_POSITION;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${AURA_POS_COOKIE}=`));
  const raw = match?.split('=').slice(1).join('=');
  return parsePositionCookie(raw) ?? DEFAULT_POSITION;
}
