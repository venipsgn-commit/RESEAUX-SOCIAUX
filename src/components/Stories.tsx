'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getClientPosition } from '@/lib/location';
import { timeAgo } from '@/lib/types';
import { toast } from '@/lib/toast';

type StoryRow = {
  id: string;
  user_id: string;
  handle: string;
  avatar_emoji: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  distance_m: number | null;
  seen: boolean;
  is_mine: boolean;
};

type Group = {
  user_id: string;
  handle: string;
  avatar_emoji: string;
  is_mine: boolean;
  stories: StoryRow[];
  hasUnseen: boolean;
};

function groupStories(rows: StoryRow[]): Group[] {
  const map = new Map<string, Group>();
  const order: string[] = [];
  for (const r of rows) {
    let g = map.get(r.user_id);
    if (!g) {
      g = {
        user_id: r.user_id,
        handle: r.handle,
        avatar_emoji: r.avatar_emoji,
        is_mine: r.is_mine,
        stories: [],
        hasUnseen: false,
      };
      map.set(r.user_id, g);
      order.push(r.user_id);
    }
    g.stories.push(r);
    if (!r.seen && !r.is_mine) g.hasUnseen = true;
  }
  return order.map((id) => map.get(id)!);
}

/**
 * Barre de stories façon Instagram en tête du Voisinage.
 * - « Toi » : ajoute une story (photo) visible 24h par les voisins < 500m.
 * - Anneau dégradé = story non vue ; anneau gris = déjà vue.
 * - Tap sur un anneau : lecteur plein écran (barres de progression,
 *   avance auto, tap gauche/droite, passe au voisin suivant).
 */
export function Stories({ lat, lng }: { lat: number; lng: number }) {
  const supabase = createClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('stories_feed', {
      user_lat: lat,
      user_lng: lng,
      radius_m: 500,
    });
    setGroups(groupStories((data as StoryRow[]) ?? []));
  }, [supabase, lat, lng]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
    load();
  }, [supabase, load]);

  // Mise à jour en direct : une nouvelle story d'un voisin apparaît sans
  // recharger (RLS limite déjà aux stories non expirées ; le RPC re-filtre
  // par distance).
  useEffect(() => {
    const channel = supabase
      .channel('stories-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  const mine = groups.find((g) => g.is_mine) ?? null;
  const others = groups.filter((g) => !g.is_mine);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/connexion');
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `stories/${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('message-media')
        .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('message-media').getPublicUrl(path);
      const p = getClientPosition();
      const { error } = await supabase.from('stories').insert({
        user_id: user.id,
        image_url: data.publicUrl,
        lat: p.lat,
        lng: p.lng,
      });
      if (error) throw error;
      toast({ icon: '✨', title: 'Story publiée !', text: 'Visible 24h par tes voisins.' });
      await load();
    } catch {
      toast({ icon: '⚠️', title: 'Oups', text: "La story n'a pas pu être publiée." });
    } finally {
      setUploading(false);
    }
  }

  function markSeen(storyId: string) {
    setGroups((prev) =>
      prev.map((g) => {
        if (!g.stories.some((s) => s.id === storyId)) return g;
        const stories = g.stories.map((s) => (s.id === storyId ? { ...s, seen: true } : s));
        return { ...g, stories, hasUnseen: stories.some((s) => !s.seen && !s.is_mine) };
      }),
    );
    supabase.rpc('mark_story_seen', { p_story_id: storyId });
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />

      <div className="overflow-x-auto -mx-1 [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-3 px-1 pb-1">
          {/* Toi — ajouter / voir mes stories */}
          <div className="text-center flex-shrink-0 w-16">
            <div className="relative w-16 h-16">
              <button
                onClick={() => (mine ? setOpen(groups.indexOf(mine)) : fileRef.current?.click())}
                className="w-16 h-16 flex items-center justify-center"
                aria-label={mine ? 'Voir ma story' : 'Ajouter une story'}
              >
                {mine ? (
                  <div className={`story-ring ${mine.hasUnseen ? '' : 'story-ring--seen'}`}>
                    <div className="story-ring-inner">{mine.avatar_emoji}</div>
                  </div>
                ) : (
                  <div className="story-ring story-ring--add">
                    <div
                      className="story-ring-inner text-ink-700/40"
                      style={{ fontSize: 26, fontWeight: 300 }}
                    >
                      {uploading ? '⏳' : '＋'}
                    </div>
                  </div>
                )}
              </button>
              {mine && (
                <button
                  onClick={() => fileRef.current?.click()}
                  aria-label="Ajouter une story"
                  className="absolute bottom-0 right-0 w-5 h-5 bg-forest-500 rounded-full flex items-center justify-center text-white text-[14px] leading-none font-black border-2 border-cream-50 shadow-soft"
                >
                  +
                </button>
              )}
            </div>
            <div className="text-[10px] mt-1 font-bold text-ink-700/70">Toi</div>
          </div>

          {/* Stories des voisins */}
          {others.map((g) => (
            <button
              key={g.user_id}
              onClick={() => setOpen(groups.indexOf(g))}
              className="text-center flex-shrink-0 w-16"
            >
              <div className={`story-ring ${g.hasUnseen ? '' : 'story-ring--seen'}`}>
                <div className="story-ring-inner">{g.avatar_emoji}</div>
              </div>
              <div className="text-[10px] mt-1 font-bold truncate text-ink-700/70">
                {g.handle} · {timeAgo(g.stories[g.stories.length - 1].created_at)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {open !== null && groups[open] && (
        <StoryViewer
          groups={groups}
          startIndex={open}
          onClose={() => setOpen(null)}
          onSeen={markSeen}
          onDeleted={load}
        />
      )}
    </>
  );
}

// ── Lecteur plein écran ────────────────────────────────────────────────
function StoryViewer({
  groups,
  startIndex,
  onClose,
  onSeen,
  onDeleted,
}: {
  groups: Group[];
  startIndex: number;
  onClose: () => void;
  onSeen: (storyId: string) => void;
  onDeleted: () => void;
}) {
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [gi, setGi] = useState(startIndex);
  const [si, setSi] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const group = groups[gi];
  const story = group?.stories[si];

  // Fonctions de navigation (recréées à chaque rendu → toujours à jour).
  function next() {
    if (!group) return onClose();
    if (si < group.stories.length - 1) {
      setSi(si + 1);
    } else if (gi < groups.length - 1) {
      setGi(gi + 1);
      setSi(0);
    } else {
      onClose();
    }
  }
  function prev() {
    if (si > 0) {
      setSi(si - 1);
    } else if (gi > 0) {
      const pg = groups[gi - 1];
      setGi(gi - 1);
      setSi(pg.stories.length - 1);
    } else {
      setProgress(0);
    }
  }
  const nextRef = useRef(next);
  nextRef.current = next;

  useEffect(() => setMounted(true), []);

  // Verrouille le scroll du fond + touches clavier
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') nextRef.current();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // À chaque story : remet la progression à zéro + marque comme vue
  useEffect(() => {
    if (!story) return;
    setProgress(0);
    onSeen(story.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  // Avance automatique (5 s par image)
  useEffect(() => {
    if (!story || paused) return;
    const DURATION = 5000;
    const STEP = 40;
    const t = setInterval(() => {
      setProgress((p) => Math.min(100, p + (STEP / DURATION) * 100));
    }, STEP);
    return () => clearInterval(t);
  }, [story?.id, paused]);

  // Quand une image est finie → story suivante
  useEffect(() => {
    if (progress >= 100) nextRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  async function deleteStory() {
    if (!story) return;
    await supabase.from('stories').delete().eq('id', story.id);
    toast({ icon: '🗑️', title: 'Story supprimée' });
    onClose();
    onDeleted();
  }

  if (!mounted || !group || !story) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-black flex items-center justify-center select-none">
      {/* Image */}
      <img
        src={story.image_url}
        alt=""
        className="max-h-full max-w-full w-auto h-auto object-contain"
        draggable={false}
      />

      {/* Zones de tap (précédent / suivant) + pause au maintien */}
      <button
        className="absolute left-0 top-16 bottom-0 w-1/3 z-10"
        onClick={prev}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        aria-label="Précédent"
      />
      <button
        className="absolute right-0 top-16 bottom-0 w-2/3 z-10"
        onClick={next}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        aria-label="Suivant"
      />

      {/* En-tête : progression + auteur */}
      <div className="absolute top-0 inset-x-0 z-20 pt-3 px-3 pb-6 bg-gradient-to-b from-black/55 to-transparent pointer-events-none">
        <div className="flex gap-1">
          {group.stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: i < si ? '100%' : i === si ? `${progress}%` : '0%',
                  transition: i === si ? 'width 40ms linear' : 'none',
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2.5 mt-3 pointer-events-auto">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-base border border-white/40 flex-shrink-0">
            {group.avatar_emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-bold truncate">
              {group.handle}
              {group.is_mine && <span className="text-white/60 font-medium"> · toi</span>}
            </div>
            <div className="text-white/70 text-[11px]">
              {timeAgo(story.created_at)}
              {story.distance_m != null && ` · 📍 ${Math.round(story.distance_m)}m`}
            </div>
          </div>
          {group.is_mine && (
            <button onClick={deleteStory} aria-label="Supprimer" className="text-white/85 p-1.5 text-lg">
              🗑️
            </button>
          )}
          <button onClick={onClose} aria-label="Fermer" className="text-white p-1.5 -mr-1">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Légende */}
      {story.caption && (
        <div className="absolute bottom-0 inset-x-0 z-20 px-5 pb-8 pt-10 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
          <p className="text-white text-[15px] font-medium text-center drop-shadow">{story.caption}</p>
        </div>
      )}
    </div>,
    document.body,
  );
}
