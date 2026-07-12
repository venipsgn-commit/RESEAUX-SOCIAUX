'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const BARS = 30;

/** Génère une forme d'onde stable (déterministe) à partir de l'URL du fichier. */
function waveform(url: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: number[] = [];
  for (let i = 0; i < BARS; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    out.push(0.3 + (h % 1000) / 1000 * 0.7);
  }
  return out;
}

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function VoiceMessage({ url, mine }: { url: string; mine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const bars = useMemo(() => waveform(url), [url]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    // Durée : on prend la valeur si elle est finie (pas d'astuce de seek qui
    // casse la lecture sur Safari iOS). Certains .webm renvoient Infinity ;
    // dans ce cas on affichera juste le temps écoulé pendant la lecture.
    const onMeta = () => {
      if (isFinite(a.duration) && a.duration > 0) setDur(a.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setCur(0);
    };
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('durationchange', onMeta);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('durationchange', onMeta);
      a.removeEventListener('ended', onEnd);
    };
  }, []);

  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      const a = audioRef.current;
      if (a) setCur(a.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    a.currentTime = ratio * dur;
    setCur(a.currentTime);
  }

  const pct = dur ? cur / dur : 0;
  const accent = mine ? '#fdfaf5' : '#2d5a3d';
  const faded = mine ? 'rgba(253,250,245,0.32)' : 'rgba(45,90,61,0.22)';

  return (
    <div className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 min-w-[196px] max-w-[250px]">
      <audio ref={audioRef} src={url} preload="metadata" />

      <button
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Lire le message vocal'}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-soft active:scale-95 transition ${
          mine ? 'bg-cream-50 text-ink-900' : 'bg-forest-500 text-white'
        }`}
      >
        {playing ? (
          <span className="flex gap-[3px]">
            <span className="w-[3px] h-3.5 rounded-full bg-current" />
            <span className="w-[3px] h-3.5 rounded-full bg-current" />
          </span>
        ) : (
          <span className="ml-0.5 text-[13px] leading-none">▶</span>
        )}
      </button>

      <div
        onClick={seek}
        className="flex-1 flex items-center gap-[2px] h-8 cursor-pointer"
        role="slider"
        aria-label="Barre de lecture"
        aria-valuenow={Math.round(pct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {bars.map((h, i) => {
          const filled = bars.length ? i / bars.length <= pct : false;
          return (
            <span
              key={i}
              style={{ height: `${Math.round(h * 100)}%`, background: filled ? accent : faded }}
              className="flex-1 min-w-[2px] rounded-full transition-[background-color] duration-150"
            />
          );
        })}
      </div>

      <span
        className={`text-[10px] tabular-nums flex-shrink-0 ${
          mine ? 'text-cream-50/70' : 'text-ink-700/50'
        }`}
      >
        {fmt(playing || cur > 0 ? cur : dur)}
      </span>
    </div>
  );
}
