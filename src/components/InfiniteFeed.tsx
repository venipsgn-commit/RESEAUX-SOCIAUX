'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FeedCard } from './FeedCard';
import type { NearbyPost } from '@/lib/types';

const PAGE = 20;

export function InfiniteFeed({
  initialPosts,
  initialLiked,
  lat,
  lng,
  radius,
}: {
  initialPosts: NearbyPost[];
  initialLiked: string[];
  lat: number;
  lng: number;
  radius: number;
}) {
  const supabase = createClient();
  const [posts, setPosts] = useState<NearbyPost[]>(initialPosts);
  const [liked, setLiked] = useState<Set<string>>(new Set(initialLiked));
  const [done, setDone] = useState(initialPosts.length < 50);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || done) return;
    setLoading(true);
    const next = posts.length + PAGE;
    const { data } = await supabase.rpc('posts_nearby', {
      user_lat: lat,
      user_lng: lng,
      radius_m: radius,
      max_results: next,
    });
    const all = (data ?? []) as NearbyPost[];
    if (all.length <= posts.length) {
      setDone(true);
      setLoading(false);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: myLikes } = await supabase
        .from('reactions')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('kind', 'like')
        .in('post_id', all.map((p) => p.id));
      setLiked(new Set((myLikes ?? []).map((r) => r.post_id as string)));
    }
    setPosts(all);
    if (all.length < next) setDone(true);
    setLoading(false);
  }, [supabase, lat, lng, radius, posts.length, loading, done]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || done) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '500px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore, done]);

  return (
    <>
      {posts.map((p) => (
        <FeedCard key={p.id} post={p} likedByMe={liked.has(p.id)} />
      ))}
      {!done && (
        <div ref={sentinel} className="py-6 text-center text-[11px] text-ink-700/40">
          Chargement des annonces…
        </div>
      )}
    </>
  );
}
