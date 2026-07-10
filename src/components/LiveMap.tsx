'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createClient } from '@/lib/supabase/client';
import { POST_TYPE_META, type PostType } from '@/lib/types';

export type MapPost = {
  id: string;
  type: PostType;
  emoji: string;
  title: string;
  lat: number;
  lng: number;
};

export type MapPerson = {
  user_id: string;
  handle: string;
  display_name: string;
  avatar_emoji: string;
  lat: number;
  lng: number;
  is_online: boolean;
};

type Props = {
  center: { lat: number; lng: number };
  radiusM: number;
  posts: MapPost[];
  people?: MapPerson[];
  className?: string;
};

// Couleur de pin par type (repris du design system)
const PIN_COLOR: Record<PostType, string> = {
  sell: '#4ba3e8',
  service: '#ff6b6b',
  event: '#ff9a3c',
  question: '#ff9a3c',
  geolock: '#9b7dd1',
  story: '#7eac8a',
};

/** Polygone approximant un cercle géographique de `radiusM` mètres. */
function circlePolygon(lat: number, lng: number, radiusM: number, points = 64) {
  const coords: [number, number][] = [];
  const earth = 6378137;
  const dLat = (radiusM / earth) * (180 / Math.PI);
  const dLng = dLat / Math.cos((lat * Math.PI) / 180);
  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(theta), lat + dLat * Math.sin(theta)]);
  }
  return coords;
}

export function LiveMap({ center, radiusM, posts, people = [], className = '' }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('maplibre-gl').Map | null>(null);

  async function sayHi(userId: string) {
    const { data, error } = await supabase.rpc('get_or_create_dm', { other: userId });
    if (error || !data) {
      router.push('/connexion');
      return;
    }
    router.push(`/messages/${data}`);
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        // Style raster CARTO Positron — gratuit, clair, sans clé API
        style: {
          version: 8,
          sources: {
            carto: {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
                'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
                'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap © CARTO',
            },
          },
          layers: [{ id: 'carto', type: 'raster', source: 'carto' }],
        },
        center: [center.lng, center.lat],
        zoom: 15.5,
        attributionControl: false,
      });
      mapRef.current = map;

      map.on('load', () => {
        // ── Aura : cercle de rayon réel ──
        map.addSource('aura', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [circlePolygon(center.lat, center.lng, radiusM)] },
          },
        });
        map.addLayer({
          id: 'aura-fill',
          type: 'fill',
          source: 'aura',
          paint: { 'fill-color': '#2d5a3d', 'fill-opacity': 0.08 },
        });
        map.addLayer({
          id: 'aura-line',
          type: 'line',
          source: 'aura',
          paint: { 'line-color': '#2d5a3d', 'line-width': 2, 'line-dasharray': [2, 2], 'line-opacity': 0.5 },
        });

        // ── Marqueur "toi" ──
        const youEl = document.createElement('div');
        youEl.style.cssText =
          'width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#4a8161,#2d5a3d);border:4px solid #fff;box-shadow:0 6px 14px rgba(45,90,61,0.5);';
        new maplibregl.Marker({ element: youEl }).setLngLat([center.lng, center.lat]).addTo(map);

        // ── Pins des posts ──
        posts.forEach((post) => {
          const color = PIN_COLOR[post.type];
          const el = document.createElement('button');
          el.setAttribute('aria-label', post.title);
          el.style.cssText =
            'width:38px;height:38px;border:none;background:transparent;cursor:pointer;transform-origin:bottom center;transition:transform .2s;';
          el.innerHTML = `
            <div style="position:relative;width:38px;height:38px;">
              <div style="width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2.5px solid #fff;box-shadow:0 6px 12px rgba(31,26,18,0.3);display:flex;align-items:center;justify-content:center;">
                <span style="transform:rotate(45deg);font-size:17px;">${post.emoji}</span>
              </div>
            </div>`;
          el.addEventListener('mouseenter', () => (el.style.transform = 'scale(1.15) translateY(-4px)'));
          el.addEventListener('mouseleave', () => (el.style.transform = 'scale(1)'));
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            router.push(`/post/${post.id}`);
          });
          new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([post.lng, post.lat])
            .addTo(map);
        });

        // ── Avatars des voisins (façon Snap Map) ──
        people.forEach((person) => {
          const firstName = person.display_name.split(' ')[0];
          const el = document.createElement('button');
          el.setAttribute('aria-label', person.display_name);
          el.style.cssText =
            'border:none;background:transparent;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;transform-origin:bottom center;transition:transform .2s;';
          el.innerHTML = `
            <div class="${person.is_online ? 'snap-online' : ''}" style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#fdfaf5,#f5efe3);border:3px solid ${person.is_online ? '#2d5a3d' : '#fff'};box-shadow:0 6px 14px rgba(31,26,18,0.28);display:flex;align-items:center;justify-content:center;font-size:24px;">
              ${person.avatar_emoji}
            </div>
            <div style="background:#1f1a12;color:#fdfaf5;font-size:10px;font-weight:800;padding:2px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(31,26,18,0.2);">
              ${firstName}${person.is_online ? ' 🟢' : ''}
            </div>`;
          el.addEventListener('mouseenter', () => (el.style.transform = 'scale(1.12) translateY(-3px)'));
          el.addEventListener('mouseleave', () => (el.style.transform = 'scale(1)'));
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            sayHi(person.user_id);
          });
          new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([person.lng, person.lat])
            .addTo(map);
        });

        // Ajuste le cadrage pour inclure toute l'aura
        map.fitBounds(
          [
            [center.lng - 0.006, center.lat - 0.006],
            [center.lng + 0.006, center.lat + 0.006],
          ],
          { padding: 40, duration: 0, maxZoom: 16 },
        );
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, radiusM]);

  function recenter() {
    mapRef.current?.flyTo({ center: [center.lng, center.lat], zoom: 15.5, duration: 800 });
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />
      {/* Recentrer */}
      <button
        onClick={recenter}
        aria-label="Recentrer sur ma position"
        className="absolute bottom-28 lg:bottom-24 right-3 lg:right-6 z-20 w-11 h-11 bg-forest-500 text-white rounded-2xl shadow-pin flex items-center justify-center text-lg"
      >
        🎯
      </button>
    </div>
  );
}
