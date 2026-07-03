'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AURA_POS_COOKIE,
  DEFAULT_POSITION,
  serializePositionCookie,
  type AuraPosition,
} from '@/lib/location';

const DISMISS_KEY = 'aura_geo_dismissed';

function writeCookie(pos: AuraPosition) {
  // 30 jours, SameSite=Lax pour que les Server Components le lisent
  document.cookie = `${AURA_POS_COOKIE}=${serializePositionCookie(pos)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

/** Coordonnées arrondies (fallback si le reverse-geocoding échoue). */
function coordsLabel(lat: number, lng: number): string {
  return `Ma position · ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
}

/**
 * Reverse-geocoding via Nominatim (OpenStreetMap) pour obtenir le nom du
 * quartier. Gratuit, sans clé. En cas d'échec (réseau, quota), on retombe
 * sur les coordonnées.
 */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      { headers: { 'Accept-Language': 'fr' } },
    );
    if (!res.ok) throw new Error('geocode failed');
    const data = await res.json();
    const a = data?.address ?? {};
    const quartier =
      a.neighbourhood || a.suburb || a.quarter || a.city_district || a.village || a.town;
    const ville = a.city || a.town || a.municipality || a.county;
    if (quartier && ville && quartier !== ville) return `${quartier} · ${ville}`;
    if (quartier) return quartier;
    if (ville) return ville;
    return coordsLabel(lat, lng);
  } catch {
    return coordsLabel(lat, lng);
  }
}

/**
 * Bannière discrète qui propose d'activer la géolocalisation.
 * Une fois la position obtenue, elle est écrite dans un cookie et la page
 * serveur est rafraîchie pour recalculer l'aura autour de la vraie position.
 */
export function LocationGate() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'asking' | 'granted' | 'denied' | 'hidden'>('idle');

  useEffect(() => {
    // Déjà rejeté ou déjà positionné pendant cette session ?
    const dismissed = typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1';
    const hasCookie = typeof document !== 'undefined' && document.cookie.includes(`${AURA_POS_COOKIE}=`);
    if (dismissed || hasCookie) {
      setStatus('hidden');
      return;
    }
    // Si la permission est déjà accordée, on capture directement
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((res) => {
          if (res.state === 'granted') capture();
        })
        .catch(() => {});
    }
  }, []);

  function capture() {
    if (!('geolocation' in navigator)) {
      setStatus('denied');
      return;
    }
    setStatus('asking');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Écrit d'abord avec un label provisoire pour ne pas bloquer l'UI…
        const provisional: AuraPosition = {
          lat: latitude,
          lng: longitude,
          quartier: coordsLabel(latitude, longitude),
          real: true,
        };
        writeCookie(provisional);
        setStatus('granted');
        router.refresh();
        // …puis complète avec le vrai nom de quartier
        const quartier = await reverseGeocode(latitude, longitude);
        writeCookie({ ...provisional, quartier });
        router.refresh();
      },
      () => {
        setStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setStatus('hidden');
  }

  function useDemo() {
    writeCookie(DEFAULT_POSITION);
    dismiss();
    router.refresh();
  }

  if (status === 'hidden' || status === 'granted') return null;

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-3 right-3 lg:left-auto lg:right-6 lg:w-96 z-50 animate-fade-up">
      <div className="bg-ink-900 text-cream-50 rounded-3xl p-4 shadow-lift">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📍</div>
          <div className="flex-1">
            <div className="font-extrabold text-sm">Active ta géolocalisation</div>
            <p className="text-xs text-cream-50/70 mt-0.5">
              {status === 'denied'
                ? "Géolocalisation refusée. Tu peux explorer le quartier de démo (Bastille) en attendant."
                : "Pour voir les voisins et annonces réellement autour de toi, autorise l'accès à ta position."}
            </p>
            <div className="flex gap-2 mt-3">
              {status !== 'denied' && (
                <button
                  onClick={capture}
                  disabled={status === 'asking'}
                  className="px-4 py-2 bg-forest-500 text-white rounded-full text-xs font-bold disabled:opacity-60"
                >
                  {status === 'asking' ? 'Localisation…' : 'Activer'}
                </button>
              )}
              <button
                onClick={useDemo}
                className="px-4 py-2 bg-cream-50/10 text-cream-50 rounded-full text-xs font-bold"
              >
                Explorer Bastille
              </button>
              <button onClick={dismiss} className="px-2 py-2 text-cream-50/50 text-xs font-bold">
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
