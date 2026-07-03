'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/** Redimensionne + compresse une image côté client (max 1200px, JPEG 0.8). */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1200;
  let { width, height } = bitmap;
  if (width > maxSide || height > maxSide) {
    const ratio = Math.min(maxSide / width, maxSide / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('compression failed'))),
      'image/jpeg',
      0.8,
    );
  });
}

export function ImageUpload({
  value,
  onChange,
  fallbackEmoji,
  gradient,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  fallbackEmoji: string;
  gradient: string;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('Connecte-toi pour ajouter une photo.');
        return;
      }
      const blob = await compress(file);
      const path = `${user.id}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('post-images')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('post-images').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full aspect-square rounded-3xl overflow-hidden shadow-lift relative flex flex-col items-center justify-center text-white"
        style={value ? undefined : { background: gradient }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Aperçu" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="text-7xl">{fallbackEmoji}</div>
        )}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-ink-900/80 backdrop-blur px-4 py-2 rounded-full text-xs font-bold">
          {busy ? 'Envoi…' : value ? '📷 Changer la photo' : '📷 Ajouter une photo'}
        </div>
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-2 text-xs font-bold text-coral-500"
        >
          Retirer la photo (garder l&apos;emoji)
        </button>
      )}
      {error && <p className="mt-2 text-xs font-semibold text-coral-500">{error}</p>}
    </div>
  );
}
