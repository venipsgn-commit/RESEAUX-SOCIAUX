'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

type Friend = {
  user_id: string;
  handle: string;
  display_name: string | null;
  avatar_emoji: string;
  avatar_url: string | null;
};

export function NewGroupForm() {
  const supabase = createClient();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.rpc('my_friends').then(({ data }) => setFriends((data ?? []) as Friend[]));
  }, [supabase]);

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function create() {
    if (busy || selected.size === 0) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('create_group', {
      p_title: name.trim() || 'Groupe',
      p_members: Array.from(selected),
    });
    setBusy(false);
    if (!error && data) {
      toast({ icon: '👥', title: 'Groupe créé !' });
      router.push(`/messages/${data}`);
    } else {
      toast({ icon: '⚠️', title: 'Oups', text: "Le groupe n'a pas pu être créé." });
    }
  }

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={50}
        placeholder="Nom du groupe (ex : Voisins Bastille)"
        className="w-full bg-surface rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10 shadow-soft"
      />

      <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mt-4 mb-2">
        Ajoute des amis {selected.size > 0 && `· ${selected.size} sélectionné${selected.size > 1 ? 's' : ''}`}
      </div>

      {friends === null ? (
        <div className="py-8 text-center text-sm text-ink-700/50">Chargement…</div>
      ) : friends.length === 0 ? (
        <div className="text-center py-10 text-sm text-ink-700/60">
          Tu n&apos;as pas encore d&apos;amis. Invite des voisins depuis la carte ou la liste des voisins.
        </div>
      ) : (
        <div className="space-y-1">
          {friends.map((f) => {
            const on = selected.has(f.user_id);
            return (
              <button
                key={f.user_id}
                onClick={() => toggle(f.user_id)}
                className="w-full flex items-center gap-3 py-2 px-2 rounded-2xl hover:bg-white/60"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                  {f.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    f.avatar_emoji
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-bold text-sm truncate">{f.display_name || f.handle}</div>
                  <div className="text-[11px] text-ink-700/50 truncate">@{f.handle}</div>
                </div>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    on ? 'bg-forest-500 text-white' : 'border-2 border-ink-900/15'
                  }`}
                >
                  {on ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={create}
        disabled={busy || selected.size === 0}
        className="mt-4 w-full py-3.5 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-full font-extrabold shadow-lift disabled:opacity-50"
      >
        {busy ? 'Création…' : 'Créer le groupe'}
      </button>
    </div>
  );
}
