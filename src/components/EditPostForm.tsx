'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import type { PostType } from '@/lib/types';

export function EditPostForm({
  post,
}: {
  post: { id: string; title: string; body: string | null; price_cents: number | null; type: PostType };
}) {
  const supabase = createClient();
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body ?? '');
  const [price, setPrice] = useState(post.price_cents != null ? String(post.price_cents / 100) : '');
  const [saving, setSaving] = useState(false);

  const hasPrice = post.type === 'sell' || post.type === 'service';

  async function save() {
    if (saving || !title.trim()) return;
    setSaving(true);
    const update: Record<string, unknown> = { title: title.trim(), body: body.trim() || null };
    if (hasPrice) {
      const n = price.trim() ? Math.round(parseFloat(price.replace(',', '.')) * 100) : null;
      update.price_cents = Number.isFinite(n as number) ? n : null;
    }
    const { error } = await supabase.from('posts').update(update).eq('id', post.id);
    setSaving(false);
    if (!error) {
      toast({ icon: '✅', title: 'Annonce modifiée !' });
      router.push(`/post/${post.id}`);
      router.refresh();
    } else {
      toast({ icon: '⚠️', title: 'Oups', text: 'La modification a échoué.' });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50">Titre</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          className="mt-1.5 w-full bg-white rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10 shadow-soft"
        />
      </div>
      <div>
        <label className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50">Description</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={1000}
          className="mt-1.5 w-full bg-white rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10 shadow-soft resize-none"
        />
      </div>
      {hasPrice && (
        <div>
          <label className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50">Prix (€)</label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="ex : 25"
            className="mt-1.5 w-full bg-white rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10 shadow-soft"
          />
        </div>
      )}
      <button
        onClick={save}
        disabled={saving || !title.trim()}
        className="w-full py-3.5 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-full font-extrabold shadow-lift disabled:opacity-60"
      >
        {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
      </button>
    </div>
  );
}
