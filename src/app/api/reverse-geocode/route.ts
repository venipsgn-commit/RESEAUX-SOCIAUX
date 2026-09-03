import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Reverse-geocoding via Nominatim (OpenStreetMap), appelé côté serveur.
 *
 * Nominatim exige un `User-Agent` identifiant l'application et bloque/limite
 * fortement les appels faits directement depuis le navigateur (impossible d'y
 * fixer un User-Agent). En passant par le serveur, on envoie un User-Agent
 * conforme et on obtient de façon fiable le nom du quartier plutôt que de
 * retomber sur les coordonnées brutes.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ label: null }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'MonAura/1.0 (application de voisinage)',
          'Accept-Language': 'fr',
        },
        // Met en cache 24 h : la correspondance coordonnées → quartier est stable.
        next: { revalidate: 60 * 60 * 24 },
      },
    );
    if (!res.ok) throw new Error('geocode');
    const data = await res.json();
    const a = data?.address ?? {};
    const quartier =
      a.neighbourhood || a.suburb || a.quarter || a.city_district || a.village || a.town;
    const ville = a.city || a.town || a.municipality || a.county;

    let label: string | null = null;
    if (quartier && ville && quartier !== ville) label = `${quartier} · ${ville}`;
    else label = quartier || ville || null;

    return NextResponse.json({ label });
  } catch {
    return NextResponse.json({ label: null }, { status: 200 });
  }
}
