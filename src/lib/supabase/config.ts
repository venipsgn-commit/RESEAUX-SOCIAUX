// Clés publiques Supabase (protégées par Row Level Security).
// Les variables d'environnement les remplacent si définies (Vercel, .env.local).
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://eqwtcnbqwrosuwjhkrnj.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxd3RjbmJxd3Jvc3V3amhrcm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5ODgxMTMsImV4cCI6MjA5ODU2NDExM30.sgisAsXh4CNYXo7mdP7bqdTuNDarhyMOgd7mw1r5tLI';

// Position par défaut tant que la géolocalisation (étape 2) n'est pas branchée
export const DEFAULT_POSITION = { lat: 48.8531, lng: 2.3692, quartier: 'Bastille · Paris 11ᵉ' };
export const DEFAULT_RADIUS_M = 500;
