import { cookies } from 'next/headers';
import { AURA_POS_COOKIE, DEFAULT_POSITION, parsePositionCookie, type AuraPosition } from '@/lib/location';

/** Lit la position de l'utilisateur depuis le cookie (Server Components). */
export function getServerPosition(): AuraPosition {
  const raw = cookies().get(AURA_POS_COOKIE)?.value;
  return parsePositionCookie(raw) ?? DEFAULT_POSITION;
}
