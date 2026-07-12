'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AURA_POS_COOKIE, serializePositionCookie, type AuraPosition } from '@/lib/location';

function writeCookie(pos: AuraPosition) {
  document.cookie = `${AURA_POS_COOKIE}=${serializePositionCookie(pos)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      { headers: { 'Accept-Language': 'fr' } },
    );
    if (!res.ok) throw new Error('geocode');
    const data = await res.json();
    const a = data?.address ?? {};
    const quartier = a.neighbourhood || a.suburb || a.quarter || a.city_district || a.village || a.town;
    const ville = a.city || a.town || a.municipality || a.county;
    if (quartier && ville && quartier !== ville) return `${quartier} · ${ville}`;
    return quartier || ville || `Ma position · ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  } catch {
    return `Ma position · ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  }
}

/** Bouton pour redemander la position GPS réelle de l'utilisateur. */
export function RelocateButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  function relocate() {
    if (!('geolocation' in navigator)) {
      setErr(true);
      return;
    }
    setErr(false);
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const { latitude, longitude } = p.coords;
        const provisional: AuraPosition = {
          lat: latitude,
          lng: longitude,
          quartier: `Ma position · ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
          real: true,
        };
        writeCookie(provisional);
        router.refresh();
        const quartier = await reverseGeocode(latitude, longitude);
        writeCookie({ ...provisional, quartier });
        router.refresh();
        setBusy(false);
      },
      () => {
        setBusy(false);
        setErr(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  return (
    <button
      onClick={relocate}
      disabled={busy}
      aria-label="Redemander ma position"
      title="Actualiser ma position GPS"
      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 active:scale-90 transition ${
        err ? 'text-coral-500' : 'text-forest-600'
      } ${busy ? 'animate-spin' : ''}`}
    >
      {busy ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M21 12a9 9 0 1 1-6.2-8.5" />
        </svg>
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="7" />
          <line x1="12" y1="1.5" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22.5" />
          <line x1="1.5" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22.5" y2="12" />
          <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
        </svg>
      )}
    </button>
  );
}
