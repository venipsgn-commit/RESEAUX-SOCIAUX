'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import 'leaflet/dist/leaflet.css';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { type PostType } from '@/lib/types';

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

const PIN_COLOR: Record<PostType, string> = {
  sell: '#4ba3e8',
  service: '#ff6b6b',
  event: '#ff9a3c',
  question: '#ff9a3c',
  geolock: '#9b7dd1',
  story: '#7eac8a',
};

export function LiveMap({ center, radiusM, posts, people = [], className = '' }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const LRef = useRef<typeof import('leaflet') | null>(null);
  const overlayRef = useRef<import('leaflet').LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(0);

  async function sayHi(userId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/connexion');
      return;
    }
    // Invitation obligatoire avant de discuter (ou ouverture du chat si connectés)
    const { data: res } = await supabase.rpc('request_follow', { other: userId });
    if (res === 'accepted') {
      const { data } = await supabase.rpc('get_or_create_dm', { other: userId });
      if (data) router.push(`/messages/${data}`);
    } else if (res === 'pending_out') {
      toast({
        icon: '👋',
        title: 'Invitation envoyée !',
        text: 'Tu pourras discuter dès que la personne aura accepté.',
      });
    }
  }

  // Initialisation de la carte (une fois par position/rayon)
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      const L = (await import('leaflet')).default;
      const el = containerRef.current;
      if (cancelled || !el) return;
      if ((el as unknown as { _leaflet_id?: number })._leaflet_id) {
        mapRef.current?.remove();
        mapRef.current = null;
      }
      if (mapRef.current) return;

      const map = L.map(el, {
        center: [center.lat, center.lng],
        zoom: 16,
        minZoom: 2,
        zoomControl: false,
        attributionControl: false,
        worldCopyJump: false,
        maxBounds: [
          [-85, -180],
          [85, 180],
        ],
        maxBoundsViscosity: 1,
      });
      mapRef.current = map;
      LRef.current = L;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        crossOrigin: true,
        noWrap: true,
        bounds: [
          [-85.06, -180],
          [85.06, 180],
        ],
        attribution: '© OpenStreetMap',
      }).addTo(map);

      L.control.zoom({ position: 'bottomleft' }).addTo(map);
      resizeObserver = new ResizeObserver(() => map.invalidateSize());
      resizeObserver.observe(el);

      const auraCircle = L.circle([center.lat, center.lng], {
        radius: radiusM,
        color: '#2d5a3d',
        weight: 2,
        dashArray: '6 6',
        opacity: 0.5,
        fillColor: '#2d5a3d',
        fillOpacity: 0.08,
      }).addTo(map);

      const youIcon = L.divIcon({
        className: '',
        html: '<div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#4a8161,#2d5a3d);border:4px solid #fff;box-shadow:0 6px 14px rgba(45,90,61,0.5);"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([center.lat, center.lng], { icon: youIcon, zIndexOffset: 1000 }).addTo(map);

      // Couche des marqueurs (posts + voisins), redessinée quand le filtre change
      overlayRef.current = L.layerGroup().addTo(map);

      map.fitBounds(auraCircle.getBounds(), { padding: [40, 40], maxZoom: 16 });
      [50, 200, 500, 1000].forEach((ms) => setTimeout(() => map.invalidateSize(), ms));
      if (!cancelled) setMapReady((n) => n + 1);
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      overlayRef.current = null;
      setMapReady(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, radiusM]);

  // (Re)dessine les marqueurs quand posts/people changent (filtre) — sans
  // réinitialiser la carte.
  useEffect(() => {
    const L = LRef.current;
    const layer = overlayRef.current;
    if (!L || !layer || !mapReady) return;
    layer.clearLayers();

    posts.forEach((post) => {
      const color = PIN_COLOR[post.type];
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2.5px solid #fff;box-shadow:0 6px 12px rgba(31,26,18,0.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:16px;">${post.emoji}</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });
      L.marker([post.lat, post.lng], { icon })
        .on('click', () => router.push(`/post/${post.id}`))
        .addTo(layer);
    });

    people.forEach((person) => {
      const firstName = person.display_name.split(' ')[0];
      const icon = L.divIcon({
        className: '',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;">
            <div class="${person.is_online ? 'snap-online' : ''}" style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#fdfaf5,#f5efe3);border:3px solid ${person.is_online ? '#2d5a3d' : '#fff'};box-shadow:0 6px 14px rgba(31,26,18,0.28);display:flex;align-items:center;justify-content:center;font-size:23px;">${person.avatar_emoji}</div>
            <div style="background:#1f1a12;color:#fdfaf5;font-size:10px;font-weight:800;padding:2px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(31,26,18,0.2);">${firstName}${person.is_online ? ' 🟢' : ''}</div>
          </div>`,
        iconSize: [60, 64],
        iconAnchor: [30, 64],
      });
      L.marker([person.lat, person.lng], { icon })
        .on('click', () => sayHi(person.user_id))
        .addTo(layer);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, posts, people]);

  function recenter() {
    mapRef.current?.setView([center.lat, center.lng], 16, { animate: true });
  }

  return (
    <div className={className} style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          background: '#e8e6e1',
        }}
      />
      <button
        onClick={recenter}
        aria-label="Recentrer sur ma position"
        className="absolute bottom-28 lg:bottom-24 right-3 lg:right-6 z-[500] w-11 h-11 bg-forest-500 text-white rounded-2xl shadow-pin flex items-center justify-center text-lg"
      >
        🎯
      </button>
    </div>
  );
}
