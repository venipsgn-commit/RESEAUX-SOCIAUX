'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

/**
 * Bannière de couverture du profil (façon Facebook) : la photo si elle existe,
 * sinon le dégradé AURA. On tape « Modifier » pour changer sa couverture.
 */
export function CoverUpload({ coverUrl }: { coverUrl: string | null }) {
  const supabase = createClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(coverUrl);

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
      const path = `${user.id}/cover-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('post-images')
        .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('post-images').getPublicUrl(path);
      const { error } = await supabase.from('profiles').update({ cover_url: data.publicUrl }).eq('id', user.id);
      if (error) throw error;
      setUrl(data.publicUrl);
      toast({ icon: '🖼️', title: 'Couverture mise à jour !' });
      router.refresh();
    } catch {
      toast({ icon: '⚠️', title: 'Oups', text: "La couverture n'a pas pu être changée." });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />

      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Couverture" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-forest-400 via-forest-500 to-forest-600">
          <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full border border-white/15" />
          <div className="absolute -top-8 -right-2 w-40 h-40 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -left-10 w-56 h-56 rounded-full border border-white/10" />
        </div>
      )}

      {/* Bouton modifier la couverture */}
      <button
        onClick={() => fileRef.current?.click()}
        className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-cream-50/95 backdrop-blur text-ink-900 text-[11px] font-bold px-2.5 py-1.5 rounded-full shadow-soft active:scale-95 transition"
      >
        {uploading ? (
          '⏳'
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        )}
        Couverture
      </button>
    </div>
  );
}
