'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AURA_POS_COOKIE, serializePositionCookie, type AuraPosition } from '@/lib/location';
import { toast } from '@/lib/toast';

function writeCookie(pos: AuraPosition) {
  document.cookie = `${AURA_POS_COOKIE}=${serializePositionCookie(pos)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallback = `Ma position · ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  try {
    // Passe par notre route serveur (User-Agent conforme Nominatim).
    const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
    if (!res.ok) throw new Error('geocode');
    const data = await res.json();
    return typeof data?.label === 'string' && data.label ? data.label : fallback;
  } catch {
    return fallback;
  }
}

/** Bouton pour redemander la position GPS réelle de l'utilisateur. */
export function RelocateButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  function relocate() {
    // La géolocalisation exige un contexte sécurisé (HTTPS ou localhost).
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      setErr(true);
      toast({
        icon: '🔒',
        title: 'Connexion non sécurisée',
        text: 'La géolocalisation nécessite une connexion HTTPS.',
      });
      return;
    }
    if (!('geolocation' in navigator)) {
      setErr(true);
      toast({
        icon: '🧭',
        title: 'GPS indisponible',
        text: 'Ton navigateur ne prend pas en charge la géolocalisation.',
      });
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
        toast({ icon: '📍', title: 'Position mise à jour', text: quartier });
      },
      (e) => {
        setBusy(false);
        setErr(true);
        // Message adapté au type d'erreur pour que l'utilisateur sache quoi faire.
        if (e.code === e.PERMISSION_DENIED) {
          toast({
            icon: '🚫',
            title: 'Localisation refusée',
            text: "Autorise l'accès à ta position dans les réglages de ton navigateur, puis réessaie.",
          });
        } else if (e.code === e.POSITION_UNAVAILABLE) {
          toast({
            icon: '📡',
            title: 'Position introuvable',
            text: 'Impossible de te localiser pour le moment. Vérifie ta connexion ou le GPS.',
          });
        } else if (e.code === e.TIMEOUT) {
          toast({
            icon: '⏳',
            title: 'Délai dépassé',
            text: 'La localisation a pris trop de temps. Réessaie.',
          });
        } else {
          toast({
            icon: '🧭',
            title: 'Localisation impossible',
            text: 'Une erreur est survenue. Réessaie dans un instant.',
          });
        }
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
