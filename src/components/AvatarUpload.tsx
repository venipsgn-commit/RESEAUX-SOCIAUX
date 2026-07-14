'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';

/**
 * Avatar du profil : affiche la photo (avatar_url) si elle existe, sinon
 * l'emoji. On tape dessus (ou l'icône appareil photo) pour changer sa photo
 * de profil, façon Facebook.
 */
export function AvatarUpload({
  avatarUrl,
  avatarEmoji,
  score,
}: {
  avatarUrl: string | null;
  avatarEmoji: string;
  score: number;
}) {
  const supabase = createClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(avatarUrl);

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
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('post-images')
        .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('post-images').getPublicUrl(path);
      const { error } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
      if (error) throw error;
      setUrl(data.publicUrl);
      toast({ icon: '📸', title: 'Photo de profil mise à jour !' });
      router.refresh();
    } catch {
      toast({ icon: '⚠️', title: 'Oups', text: "La photo n'a pas pu être changée." });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative w-28 h-28 lg:w-32 lg:h-32">
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        aria-label="Changer ma photo de profil"
        className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-6xl lg:text-7xl shadow-lift border-4 border-cream-50"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Photo de profil" className="w-full h-full object-cover" />
        ) : (
          avatarEmoji
        )}
      </button>

      {/* Icône appareil photo (changer) */}
      <button
        onClick={() => fileRef.current?.click()}
        aria-label="Changer ma photo de profil"
        className="absolute bottom-0.5 right-0.5 w-9 h-9 bg-cream-50 rounded-full flex items-center justify-center shadow-soft border border-ink-900/10 active:scale-95 transition"
      >
        {uploading ? (
          <span className="text-sm">⏳</span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f1a12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        )}
      </button>

      {/* Score de voisin */}
      <div className="absolute bottom-0.5 left-0.5 bg-forest-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border-[3px] border-cream-50 shadow-pin">
        {score}
      </div>
    </div>
  );
}
