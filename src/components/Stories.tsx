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
  like_count: number;
  viewer_liked: boolean;
  view_count: number;
  comment_count: number;
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

function HeartIcon({ filled, size = 30 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#ff3b5c' : 'none'}
      stroke={filled ? '#ff3b5c' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H2v6h4l5 4z" />
      {muted ? (
        <path d="M23 9l-6 6M17 9l6 6" />
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 5a9 9 0 0 1 0 14" />
        </>
      )}
    </svg>
  );
}

/** Détecte une story vidéo d'après l'extension de l'URL. */
function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|m4v|ogg)(\?|$)/i.test(url);
}

const QUICK_REACTIONS = ['😂', '😮', '😍', '😢', '🔥', '👏'];

/** Miniature ronde du contenu de la story (façon Instagram). */
function StoryThumb({ story, dim = false }: { story: StoryRow; dim?: boolean }) {
  const cls = `w-full h-full object-cover ${dim ? 'story-thumb--seen' : ''}`;
  if (isVideoUrl(story.image_url)) {
    return (
      <div className={`w-full h-full relative ${dim ? 'story-thumb--seen' : ''}`}>
        <video
          src={`${story.image_url}#t=0.1`}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="white" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }}>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={story.image_url} alt="" className={cls} />;
}

/**
 * Barre de stories façon Instagram en tête du Voisinage.
 * - « Toi » : choisir une photo → écran d'aperçu (légende) → publier.
 * - Anneau dégradé = story non vue ; anneau gris = déjà vue.
 * - Lecteur plein écran : progression, avance auto, tap gauche/droite,
 *   glisser pour changer de voisin, J'aime ❤️ et nombre de vues 👁.
 */
export function Stories({ lat, lng }: { lat: number; lng: number }) {
  const supabase = createClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [pending, setPending] = useState<{ file: File; url: string; isVideo: boolean } | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('stories_feed', {
      user_lat: lat,
      user_lng: lng,
      radius_m: 500,
    });
    setGroups(groupStories((data as StoryRow[]) ?? []));
  }, [supabase, lat, lng]);

  useEffect(() => {
    load();
  }, [load]);

  // Mise à jour en direct : une nouvelle story d'un voisin apparaît sans recharger.
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

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCaption('');
    setPending({ file, url: URL.createObjectURL(file), isVideo: file.type.startsWith('video') });
  }

  function closeComposer() {
    if (pending) URL.revokeObjectURL(pending.url);
    setPending(null);
    setCaption('');
  }

  async function publish() {
    if (!pending || uploading) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/connexion');
      return;
    }
    setUploading(true);
    try {
      const file = pending.file;
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      // Le 1er dossier doit être l'id de l'utilisateur (règle du bucket).
      const path = `${user.id}/story-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('message-media')
        .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('message-media').getPublicUrl(path);
      const p = getClientPosition();
      const { error } = await supabase.from('stories').insert({
        user_id: user.id,
        image_url: data.publicUrl,
        caption: caption.trim() || null,
        lat: p.lat,
        lng: p.lng,
      });
      if (error) throw error;
      toast({ icon: '✨', title: 'Story publiée !', text: 'Visible 24h par tes voisins.' });
      closeComposer();
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
    // IMPORTANT : une requête supabase ne part que si on l'attend/.then() —
    // sinon le « vu » n'est jamais enregistré et l'anneau redevient coloré.
    void supabase.rpc('mark_story_seen', { p_story_id: storyId }).then(() => {});
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*,video/*" onChange={onPick} className="hidden" />

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
                  <div className="story-ring">
                    <div className="story-ring-inner overflow-hidden">
                      <StoryThumb story={mine.stories[mine.stories.length - 1]} />
                    </div>
                  </div>
                ) : (
                  <div className="story-ring story-ring--add">
                    <div className="story-ring-inner text-ink-700/40" style={{ fontSize: 26, fontWeight: 300 }}>
                      ＋
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
                <div className="story-ring-inner overflow-hidden">
                  <StoryThumb story={g.stories[g.stories.length - 1]} dim={!g.hasUnseen} />
                </div>
              </div>
              <div className="text-[10px] mt-1 font-bold truncate text-ink-700/70">
                {g.handle} · {timeAgo(g.stories[g.stories.length - 1].created_at)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Aperçu avant publication (façon Instagram) */}
      {pending && (
        <StoryComposer
          url={pending.url}
          isVideo={pending.isVideo}
          caption={caption}
          setCaption={setCaption}
          uploading={uploading}
          onCancel={closeComposer}
          onPublish={publish}
        />
      )}

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

// ── Écran d'aperçu / composition ───────────────────────────────────────
function StoryComposer({
  url,
  isVideo,
  caption,
  setCaption,
  uploading,
  onCancel,
  onPublish,
}: {
  url: string;
  isVideo: boolean;
  caption: string;
  setCaption: (v: string) => void;
  uploading: boolean;
  onCancel: () => void;
  onPublish: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[130] bg-black flex flex-col">
      {isVideo ? (
        <video
          src={url}
          className="absolute inset-0 w-full h-full object-contain"
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Aperçu" className="absolute inset-0 w-full h-full object-contain" />
      )}

      {/* Haut : fermer + titre */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 bg-gradient-to-b from-black/55 to-transparent pb-8">
        <button onClick={onCancel} aria-label="Annuler" className="text-white p-1">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <span className="text-white font-bold text-sm">Aperçu de ta story</span>
        <span className="w-7" />
      </div>

      <div className="flex-1" />

      {/* Bas : légende + bouton publier */}
      <div className="relative z-10 px-4 pb-8 pt-16 bg-gradient-to-t from-black/70 to-transparent">
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={140}
          placeholder="Ajoute un texte… (ex : on va changer le monde)"
          className="w-full bg-white/15 backdrop-blur text-white placeholder-white/60 rounded-2xl px-4 py-3 text-[15px] outline-none border border-white/20"
        />
        <button
          onClick={onPublish}
          disabled={uploading}
          className="mt-3 w-full py-3.5 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-full font-extrabold text-[15px] shadow-lift disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {uploading ? (
            'Publication…'
          ) : (
            <>
              Partager ma story
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>,
    document.body,
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
  const [likes, setLikes] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [viewers, setViewers] = useState<
    { handle: string; avatar_emoji: string; liked: boolean; reaction: string | null }[] | null
  >(null);
  const [burst, setBurst] = useState(0);
  const [reactBurst, setReactBurst] = useState<{ id: number; emoji: string } | null>(null);
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [comments, setComments] = useState<
    { handle: string; avatar_emoji: string; body: string }[] | null
  >(null);

  const group = groups[gi];
  const story = group?.stories[si];
  const isVid = story ? isVideoUrl(story.image_url) : false;

  // Navigation dans une même personne (tap) ------------------------------
  function next() {
    if (!group) return onClose();
    if (si < group.stories.length - 1) setSi(si + 1);
    else if (gi < groups.length - 1) {
      setGi(gi + 1);
      setSi(0);
    } else onClose();
  }
  function prev() {
    if (si > 0) setSi(si - 1);
    else if (gi > 0) {
      setGi(gi - 1);
      setSi(0);
    } else setProgress(0);
  }
  // Navigation d'une personne à l'autre (glisser) ------------------------
  function nextPerson() {
    if (gi < groups.length - 1) {
      setGi(gi + 1);
      setSi(0);
    } else onClose();
  }
  function prevPerson() {
    if (gi > 0) {
      setGi(gi - 1);
      setSi(0);
    } else setProgress(0);
  }
  const nextRef = useRef(next);
  nextRef.current = next;

  // Avance AUTOMATIQUE : à la fin des stories de la personne ouverte, on ferme
  // (on n'enchaîne PAS sur les voisins, sinon on marquerait « vues » des
  // stories qu'on n'a pas vraiment regardées).
  function autoAdvance() {
    if (!group) return onClose();
    if (si < group.stories.length - 1) setSi(si + 1);
    else onClose();
  }
  const autoRef = useRef(autoAdvance);
  autoRef.current = autoAdvance;

  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
    swipedRef.current = false;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const s = touchRef.current;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (dy > 90 && dy > Math.abs(dx)) {
      swipedRef.current = true;
      onClose();
      return;
    }
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      swipedRef.current = true;
      if (dx < 0) nextPerson();
      else prevPerson();
      setTimeout(() => {
        swipedRef.current = false;
      }, 350);
    }
  }

  // Tap = naviguer ; double-tap = J'aime (avec gros cœur), façon Instagram.
  const lastTapRef = useRef(0);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function likeBurst() {
    setBurst((b) => b + 1);
    if (story && !story.is_mine) {
      const cur = likes[story.id] ?? { liked: story.viewer_liked, count: story.like_count };
      if (!cur.liked) toggleLike();
    }
  }
  function tapNav(dir: 'prev' | 'next') {
    if (swipedRef.current) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
      lastTapRef.current = 0;
      likeBurst();
      return;
    }
    lastTapRef.current = now;
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    navTimerRef.current = setTimeout(() => {
      navTimerRef.current = null;
      if (dir === 'prev') prev();
      else next();
    }, 230);
  }

  useEffect(() => setMounted(true), []);

  // Scroll verrouillé + clavier
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

  // Nouvelle story : reset + marque comme vue
  useEffect(() => {
    if (!story) return;
    setProgress(0);
    onSeen(story.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  // Avance automatique (5 s) pour les PHOTOS — en pause si on maintient / feuille ouverte
  useEffect(() => {
    if (!story || isVid || paused || viewers || comments) return;
    const DURATION = 5000;
    const STEP = 40;
    const t = setInterval(() => {
      setProgress((p) => Math.min(100, p + (STEP / DURATION) * 100));
    }, STEP);
    return () => clearInterval(t);
  }, [story?.id, isVid, paused, viewers, comments]);

  useEffect(() => {
    if (progress >= 100) autoRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  // VIDÉO : lecture/pause selon l'état (maintien, feuilles ouvertes)
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVid) return;
    if (paused || viewers || comments) {
      v.pause();
    } else {
      v.play().catch(() => {
        // autoplay avec son bloqué → on coupe le son et on relance
        v.muted = true;
        setMuted(true);
        v.play().catch(() => {});
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, viewers, comments, story?.id, isVid]);

  async function deleteStory() {
    if (!story) return;
    await supabase.from('stories').delete().eq('id', story.id);
    toast({ icon: '🗑️', title: 'Story supprimée' });
    onClose();
    onDeleted();
  }

  async function toggleLike() {
    if (!story || story.is_mine) return;
    const cur = likes[story.id] ?? { liked: story.viewer_liked, count: story.like_count };
    const nextLiked = !cur.liked;
    setLikes((prev) => ({
      ...prev,
      [story.id]: { liked: nextLiked, count: Math.max(0, cur.count + (nextLiked ? 1 : -1)) },
    }));
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (nextLiked) {
      await supabase.from('story_likes').insert({ story_id: story.id, user_id: user.id });
    } else {
      await supabase.from('story_likes').delete().eq('story_id', story.id).eq('user_id', user.id);
    }
  }

  async function react(emoji: string) {
    if (!story || story.is_mine) return;
    setReactBurst({ id: Date.now(), emoji });
    setTimeout(() => setReactBurst((r) => (r && Date.now() - r.id > 1000 ? null : r)), 1200);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('story_reactions')
      .upsert({ story_id: story.id, user_id: user.id, emoji }, { onConflict: 'story_id,user_id' });
  }

  async function openViewers() {
    if (!story) return;
    setPaused(true);
    const { data } = await supabase.rpc('story_viewers', { p_story_id: story.id });
    setViewers(
      ((data as { handle: string; avatar_emoji: string; liked: boolean; reaction: string | null }[]) ?? []).map(
        (v) => ({
          handle: v.handle,
          avatar_emoji: v.avatar_emoji,
          liked: v.liked,
          reaction: v.reaction,
        }),
      ),
    );
  }
  function closeViewers() {
    setViewers(null);
    setPaused(false);
  }

  async function sendComment() {
    if (!story || story.is_mine || replySending) return;
    const text = replyText.trim();
    if (!text) return;
    setReplySending(true);
    // Envoie la réponse comme un vrai message : le voisin la reçoit dans ses
    // messages et peut te répondre (façon Instagram).
    const { error } = await supabase.rpc('reply_to_story', {
      p_story_id: story.id,
      p_body: text,
    });
    setReplySending(false);
    if (!error) {
      setReplyText('');
      toast({ icon: '💬', title: 'Réponse envoyée', text: `${group.handle} peut te répondre en message.` });
    } else {
      toast({ icon: '⚠️', title: 'Oups', text: "La réponse n'est pas partie." });
    }
  }

  async function openComments() {
    if (!story) return;
    setPaused(true);
    const { data } = await supabase.rpc('story_comments_list', { p_story_id: story.id });
    setComments(
      ((data as { handle: string; avatar_emoji: string; body: string }[]) ?? []).map((c) => ({
        handle: c.handle,
        avatar_emoji: c.avatar_emoji,
        body: c.body,
      })),
    );
  }
  function closeComments() {
    setComments(null);
    setPaused(false);
  }

  if (!mounted || !group || !story) return null;

  const likeInfo = likes[story.id] ?? { liked: story.viewer_liked, count: story.like_count };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-black flex items-center justify-center select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {isVid ? (
        <video
          key={story.id}
          ref={videoRef}
          src={story.image_url}
          className="max-h-full max-w-full w-auto h-auto object-contain"
          autoPlay
          playsInline
          muted={muted}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration) setProgress(Math.min(99.5, (v.currentTime / v.duration) * 100));
          }}
          onEnded={() => autoRef.current()}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={story.image_url}
          alt=""
          className="max-h-full max-w-full w-auto h-auto object-contain"
          draggable={false}
        />
      )}

      {/* Zones de tap (précédent / suivant) + pause au maintien.
          Double-tap = J'aime (façon Instagram). */}
      <button
        className="absolute left-0 top-16 bottom-24 w-1/3 z-10"
        onClick={() => tapNav('prev')}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        aria-label="Précédent"
      />
      <button
        className="absolute right-0 top-16 bottom-24 w-2/3 z-10"
        onClick={() => tapNav('next')}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        aria-label="Suivant"
      />

      {/* Gros cœur au double-tap */}
      {burst > 0 && (
        <div
          key={burst}
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
        >
          <div className="animate-heart-burst" style={{ filter: 'drop-shadow(0 6px 24px rgba(0,0,0,0.45))' }}>
            <HeartIcon filled size={130} />
          </div>
        </div>
      )}

      {/* Emoji de réaction qui s'envole */}
      {reactBurst && (
        <div
          key={reactBurst.id}
          className="absolute inset-x-0 bottom-28 z-30 flex items-center justify-center pointer-events-none"
        >
          <span className="animate-react-float text-7xl" style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }}>
            {reactBurst.emoji}
          </span>
        </div>
      )}

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
          {isVid && (
            <button
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Activer le son' : 'Couper le son'}
              className="text-white/90 p-1.5"
            >
              <SpeakerIcon muted={muted} />
            </button>
          )}
          {group.is_mine && (
            <button onClick={deleteStory} aria-label="Supprimer" className="text-white/85 p-1.5 text-lg">
              🗑️
            </button>
          )}
          <button onClick={onClose} aria-label="Fermer" className="text-white p-1.5 -mr-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Légende + réactions rapides + barre du bas (J'aime ❤️ / vues 👁) */}
      <div className="absolute bottom-0 inset-x-0 z-30 px-4 pb-7 pt-12 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
        {story.caption && (
          <p className="text-white text-[15px] font-medium text-center drop-shadow mb-3">{story.caption}</p>
        )}

        {/* Réactions rapides (stories des voisins) */}
        {!story.is_mine && (
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => react(emoji)}
                aria-label={`Réagir ${emoji}`}
                className="pointer-events-auto text-[30px] leading-none px-1 active:scale-125 transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {story.is_mine ? (
          // Mes stories : vues + réponses
          <div className="flex items-center gap-2">
            <button
              onClick={openViewers}
              className="pointer-events-auto flex items-center gap-2.5 text-white/95 bg-white/10 backdrop-blur px-3.5 py-2 rounded-full text-sm font-semibold"
            >
              <span className="flex items-center gap-1.5">
                <EyeIcon />
                {story.view_count}
              </span>
              {story.like_count > 0 && (
                <span className="flex items-center gap-1 text-[#ff8fa3]">
                  <HeartIcon filled size={16} />
                  {story.like_count}
                </span>
              )}
            </button>
            {story.comment_count > 0 && (
              <button
                onClick={openComments}
                className="pointer-events-auto flex items-center gap-1.5 text-white/95 bg-white/10 backdrop-blur px-3.5 py-2 rounded-full text-sm font-semibold"
              >
                💬 {story.comment_count}
              </button>
            )}
          </div>
        ) : (
          // Stories des voisins : répondre + J'aime
          <div className="flex items-center gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendComment();
              }}
              maxLength={200}
              placeholder={`Répondre à ${group.handle}…`}
              className="pointer-events-auto flex-1 min-w-0 bg-white/15 backdrop-blur text-white placeholder-white/60 rounded-full px-4 py-2.5 text-sm outline-none border border-white/25"
            />
            {replyText.trim() ? (
              <button
                onClick={sendComment}
                disabled={replySending}
                aria-label="Envoyer"
                className="pointer-events-auto text-white p-1.5 disabled:opacity-50"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={toggleLike}
                aria-label="J'aime"
                className="pointer-events-auto flex items-center gap-1 text-white active:scale-110 transition"
              >
                <HeartIcon filled={likeInfo.liked} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Feuille « Vu par » (mes stories) */}
      {viewers && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={closeViewers}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-cream-50 rounded-t-3xl max-h-[70%] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-3 pb-2 flex flex-col items-center">
              <div className="w-10 h-1 rounded-full bg-ink-900/15 mb-3" />
              <div className="font-black text-ink-900">
                {viewers.length} {viewers.length === 1 ? 'personne a vu' : 'personnes ont vu'}
                {viewers.some((v) => v.liked) && (
                  <span className="text-coral-500">
                    {' · '}
                    {viewers.filter((v) => v.liked).length} ❤️
                  </span>
                )}
              </div>
            </div>
            <div className="overflow-y-auto px-4 pb-8">
              {viewers.length === 0 ? (
                <p className="text-center text-sm text-ink-700/60 py-8">
                  Personne n&apos;a encore vu cette story.
                </p>
              ) : (
                viewers.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-lg">
                      {v.avatar_emoji}
                    </div>
                    <span className="font-bold text-sm text-ink-900 flex-1">{v.handle}</span>
                    {v.reaction && <span className="text-xl" title="A réagi">{v.reaction}</span>}
                    {v.liked && (
                      <span className="text-[#ff3b5c]" title="A admiré ta story">
                        <HeartIcon filled size={18} />
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feuille « Réponses » (mes stories) */}
      {comments && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={closeComments}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-cream-50 rounded-t-3xl max-h-[70%] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-3 pb-2 flex flex-col items-center">
              <div className="w-10 h-1 rounded-full bg-ink-900/15 mb-3" />
              <div className="font-black text-ink-900">
                💬 {comments.length} {comments.length === 1 ? 'réponse' : 'réponses'}
              </div>
            </div>
            <div className="overflow-y-auto px-4 pb-8">
              {comments.length === 0 ? (
                <p className="text-center text-sm text-ink-700/60 py-8">
                  Aucune réponse pour l&apos;instant.
                </p>
              ) : (
                comments.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 py-2.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-lg flex-shrink-0">
                      {c.avatar_emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-ink-900">{c.handle}</div>
                      <div className="text-sm text-ink-700/85 break-words">{c.body}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
