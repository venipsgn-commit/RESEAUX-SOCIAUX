'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type CallType = 'audio' | 'video';
type Phase = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'connected';

// STUN (Google) + TURN. Un vrai serveur TURN (relais) est indispensable pour
// que l'appel passe sur les réseaux mobiles/4G. On peut en brancher un fiable
// via les variables d'environnement NEXT_PUBLIC_TURN_URL / _USERNAME / _CREDENTIAL.
const ICE_SERVERS: RTCIceServer[] = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
    ],
  },
  {
    urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turns:openrelay.metered.ca:443'],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

if (process.env.NEXT_PUBLIC_TURN_URL) {
  ICE_SERVERS.push({
    urls: process.env.NEXT_PUBLIC_TURN_URL.split(','),
    username: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
    credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '',
  });
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

/** Tonalité de sonnerie (entrant = double bip aigu, sortant = bip d'attente). */
function playRingTone(incoming: boolean) {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const now = ctx.currentTime;
    const offs = incoming ? [0, 0.4] : [0];
    offs.forEach((off) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = incoming ? 620 : 440;
      const t = now + off;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(incoming ? 0.35 : 0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
    setTimeout(() => ctx.close(), incoming ? 1000 : 600);
  } catch {
    /* audio indisponible */
  }
}

const IconMic = ({ off = false, size = 24 }: { off?: boolean; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="2.5" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <line x1="12" y1="18" x2="12" y2="21.5" />
    {off && <line x1="4" y1="3.5" x2="20" y2="20.5" />}
  </svg>
);

const IconVideo = ({ off = false, size = 24 }: { off?: boolean; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2.5" y="6.5" width="12" height="11" rx="2.5" />
    <path d="M14.8 10.6 21 7.5v9l-6.2-3" />
    {off && <line x1="4" y1="3.5" x2="20" y2="20.5" />}
  </svg>
);

const IconPhone = ({ size = 26, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.05-.24 1.1.45 2.3.7 3.55.7.6 0 1 .45 1 1V20c0 .6-.4 1-1 1C10.85 21 3 13.15 3 3.9c0-.55.45-1 1-1h3.35c.55 0 1 .4 1 1 0 1.25.25 2.45.7 3.55.15.35.05.75-.24 1.05l-2.2 2.3z" />
  </svg>
);

type Props = {
  conversationId: string;
  meId: string;
  otherName: string;
  otherAvatar: string;
};

export function CallPanel({ conversationId, meId, otherName, otherAvatar }: Props) {
  const supabase = createClient();
  const [phase, setPhase] = useState<Phase>('idle');
  const [type, setType] = useState<CallType>('audio');
  const [secs, setSecs] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const chanRef = useRef<RealtimeChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const iceBufferRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const localRef = useRef<HTMLVideoElement>(null);

  // Signalisation via Realtime broadcast
  useEffect(() => {
    const ch = supabase
      .channel(`call:${conversationId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'signal' }, ({ payload }) => handleSignal(payload))
      .subscribe();
    chanRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Chrono d'appel
  useEffect(() => {
    if (phase !== 'connected') return;
    setSecs(0);
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Sonnerie (entrant) / tonalité d'attente (sortant) + vibration
  useEffect(() => {
    if (phase !== 'incoming' && phase !== 'outgoing') return;
    const incoming = phase === 'incoming';
    const beat = () => {
      playRingTone(incoming);
      if (incoming) {
        try {
          navigator.vibrate?.([500, 300, 500]);
        } catch {
          /* pas de vibreur */
        }
      }
    };
    beat();
    const id = setInterval(beat, incoming ? 2200 : 3200);
    return () => {
      clearInterval(id);
      try {
        navigator.vibrate?.(0);
      } catch {
        /* ignore */
      }
    };
  }, [phase]);

  // Message d'aide si la connexion tarde (souvent un souci de réseau/TURN)
  useEffect(() => {
    if (phase !== 'connecting' && phase !== 'outgoing') return;
    const id = setTimeout(() => {
      setErr('La connexion tarde… Si rien ne vient, essayez en Wi-Fi des deux côtés.');
    }, 18000);
    return () => clearTimeout(id);
  }, [phase]);

  function send(data: Record<string, unknown>) {
    chanRef.current?.send({ type: 'broadcast', event: 'signal', payload: { ...data, from: meId } });
  }

  function attachRemote() {
    if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream();
    // Le son ET l'image passent par l'élément <video playsinline> non-muet
    // (seul moyen fiable de jouer le son WebRTC sur iOS Safari, même en audio).
    if (remoteRef.current) {
      remoteRef.current.srcObject = remoteStreamRef.current;
      remoteRef.current.play().catch(() => {});
    }
  }

  function createPeer() {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate) send({ kind: 'ice', candidate: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => {
      if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream();
      remoteStreamRef.current.addTrack(e.track);
      attachRemote();
    };
    const markConnected = () => {
      setErr(null);
      setPhase('connected');
      remoteRef.current?.play().catch(() => {});
    };
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === 'connected') markConnected();
      else if (st === 'failed') {
        setErr('Connexion impossible sur ce réseau. Essaie en Wi-Fi.');
        endCall(false);
      }
    };
    // Filet de sécurité (Safari met parfois à jour iceConnectionState en premier)
    pc.oniceconnectionstatechange = () => {
      const st = pc.iceConnectionState;
      if (st === 'connected' || st === 'completed') markConnected();
      else if (st === 'failed') {
        setErr('Connexion impossible sur ce réseau. Essaie en Wi-Fi.');
        endCall(false);
      }
    };
    pcRef.current = pc;
    return pc;
  }

  async function getLocalMedia(t: CallType) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: t === 'video' ? { facingMode: 'user' } : false,
    });
    localStreamRef.current = stream;
    if (t === 'video' && localRef.current) {
      localRef.current.srcObject = stream;
      localRef.current.play().catch(() => {});
    }
    const pc = pcRef.current;
    if (pc) stream.getTracks().forEach((tr) => pc.addTrack(tr, stream));
    return stream;
  }

  async function flushIce() {
    const pc = pcRef.current;
    if (!pc) return;
    for (const c of iceBufferRef.current) {
      try {
        await pc.addIceCandidate(c);
      } catch {
        /* ignore */
      }
    }
    iceBufferRef.current = [];
  }

  async function startCall(t: CallType) {
    if (phase !== 'idle') return;
    setErr(null);
    setType(t);
    setMuted(false);
    setCamOff(false);
    setPhase('outgoing');
    try {
      const pc = createPeer();
      await getLocalMedia(t);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send({ kind: 'offer', sdp: pc.localDescription, callType: t });
    } catch {
      setErr("Caméra/micro indisponible. Autorise l'accès.");
      cleanup();
      setPhase('idle');
    }
  }

  async function acceptCall() {
    const offer = pendingOfferRef.current;
    if (!offer) return;
    setErr(null);
    setPhase('connecting');
    try {
      const pc = createPeer();
      await getLocalMedia(type);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushIce();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      send({ kind: 'answer', sdp: pc.localDescription });
      pendingOfferRef.current = null;
    } catch {
      setErr("Caméra/micro indisponible. Autorise l'accès.");
      endCall(true);
    }
  }

  function rejectCall() {
    send({ kind: 'reject' });
    cleanup();
    setPhase('idle');
  }

  function endCall(notify: boolean) {
    if (notify) send({ kind: 'end' });
    cleanup();
    setPhase('idle');
  }

  function cleanup() {
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    pendingOfferRef.current = null;
    iceBufferRef.current = [];
  }

  async function handleSignal(p: {
    from?: string;
    kind?: string;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
    callType?: CallType;
  }) {
    if (!p || p.from === meId) return;
    switch (p.kind) {
      case 'offer': {
        if (phase !== 'idle') {
          send({ kind: 'busy' });
          return;
        }
        pendingOfferRef.current = p.sdp ?? null;
        setType(p.callType ?? 'audio');
        setMuted(false);
        setCamOff(false);
        setPhase('incoming');
        break;
      }
      case 'answer': {
        const pc = pcRef.current;
        if (pc && p.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(p.sdp));
          await flushIce();
          setPhase('connecting');
        }
        break;
      }
      case 'ice': {
        if (!p.candidate) break;
        const pc = pcRef.current;
        if (pc && pc.remoteDescription) {
          try {
            await pc.addIceCandidate(p.candidate);
          } catch {
            /* ignore */
          }
        } else {
          iceBufferRef.current.push(p.candidate);
        }
        break;
      }
      case 'reject':
        setErr('Appel refusé.');
        cleanup();
        setPhase('idle');
        break;
      case 'busy':
        setErr('Ton correspondant est déjà en appel.');
        cleanup();
        setPhase('idle');
        break;
      case 'end':
        cleanup();
        setPhase('idle');
        break;
    }
  }

  function toggleMute() {
    const on = !muted;
    setMuted(on);
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !on));
  }
  function toggleCam() {
    const off = !camOff;
    setCamOff(off);
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !off));
  }

  const inCall = phase !== 'idle';
  const showVideo = type === 'video' && (phase === 'connected' || phase === 'connecting');
  const ctrl = (active: boolean) =>
    `w-14 h-14 rounded-full flex items-center justify-center transition active:scale-90 backdrop-blur-md border ${
      active ? 'bg-cream-50 text-ink-900 border-transparent' : 'bg-cream-50/15 text-cream-50 border-cream-50/15'
    }`;
  const statusText =
    phase === 'outgoing'
      ? 'Sonnerie…'
      : phase === 'incoming'
        ? 'vous appelle'
        : phase === 'connecting'
          ? 'Connexion…'
          : phase === 'connected'
            ? fmt(secs)
            : '';

  return (
    <>
      {/* Boutons d'appel (dans le header) */}
      <button
        onClick={() => startCall('audio')}
        disabled={inCall}
        aria-label="Appel audio"
        className="w-9 h-9 rounded-full bg-forest-500/10 text-forest-600 flex items-center justify-center disabled:opacity-40 active:scale-90 hover:bg-forest-500/20 transition"
      >
        <IconPhone size={17} />
      </button>
      <button
        onClick={() => startCall('video')}
        disabled={inCall}
        aria-label="Appel vidéo"
        className="w-9 h-9 rounded-full bg-forest-500/10 text-forest-600 flex items-center justify-center disabled:opacity-40 active:scale-90 hover:bg-forest-500/20 transition"
      >
        <IconVideo size={18} />
      </button>

      {inCall && (
        <div
          className="fixed inset-0 z-[999] text-cream-50 select-none animate-fade-up"
          onClick={() => remoteRef.current?.play().catch(() => {})}
        >
          {/* Fond : dégradé aura (audio) ou noir (vidéo) */}
          <div
            className={`absolute inset-0 ${
              showVideo
                ? 'bg-ink-900'
                : 'bg-[radial-gradient(circle_at_50%_22%,#31674a_0%,#1b2e21_50%,#100e0a_100%)]'
            }`}
          />

          {/* Vidéo distante : image (visio) + son (toujours actif, invisible en audio) */}
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full ${
              showVideo ? 'object-cover' : 'opacity-0 pointer-events-none'
            }`}
          />

          {/* Voiles pour la lisibilité en visio */}
          {showVideo && (
            <>
              <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-ink-900/75 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 h-60 bg-gradient-to-t from-ink-900/85 to-transparent" />
            </>
          )}

          {/* Caméra locale (PiP) */}
          {type === 'video' && !camOff && phase !== 'incoming' && (
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className="absolute top-5 right-4 w-24 h-36 sm:w-28 sm:h-40 object-cover rounded-2xl border border-cream-50/25 shadow-lift z-20 bg-ink-900"
            />
          )}

          {/* Haut : identité + statut */}
          <div className="absolute top-0 inset-x-0 z-10 pt-[env(safe-area-inset-top)]">
            <div className="pt-8 px-6 text-center">
              <div className="text-[11px] uppercase tracking-[0.2em] text-cream-50/60 font-bold">
                {type === 'video' ? 'Appel vidéo' : 'Appel audio'}
              </div>
              <div className="text-[26px] font-black leading-tight mt-1.5 [text-wrap:balance]">
                {otherName}
              </div>
              <div className="text-sm text-cream-50/75 mt-1 tabular-nums min-h-[20px]">
                {statusText}
              </div>
              {err && (
                <div className="text-xs text-sunset-300 mt-2 max-w-xs mx-auto leading-snug">{err}</div>
              )}
            </div>
          </div>

          {/* Centre (audio) : avatar avec halo pulsant */}
          {!showVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                {phase !== 'connected' && (
                  <>
                    <span className="call-aura absolute w-36 h-36 rounded-full bg-forest-400/40" />
                    <span
                      className="call-aura absolute w-36 h-36 rounded-full bg-forest-400/40"
                      style={{ animationDelay: '1.3s' }}
                    />
                  </>
                )}
                <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-forest-300 to-forest-600 flex items-center justify-center text-7xl border border-cream-50/10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.65)]">
                  {otherAvatar}
                </div>
              </div>
            </div>
          )}

          {/* Bas : contrôles */}
          <div className="absolute bottom-0 inset-x-0 z-20 pb-[calc(env(safe-area-inset-bottom)+30px)] pt-4">
            {phase === 'incoming' ? (
              <div className="flex items-start justify-center gap-16">
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={rejectCall}
                    aria-label="Refuser"
                    className="w-16 h-16 rounded-full bg-coral-500 text-white flex items-center justify-center shadow-lift active:scale-90 transition"
                  >
                    <IconPhone className="rotate-[135deg]" />
                  </button>
                  <span className="text-xs text-cream-50/70 font-semibold">Refuser</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={acceptCall}
                    aria-label="Accepter"
                    className="w-16 h-16 rounded-full bg-forest-500 text-white flex items-center justify-center shadow-lift active:scale-90 transition animate-pulse"
                  >
                    <IconPhone />
                  </button>
                  <span className="text-xs text-cream-50/70 font-semibold">Accepter</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-5">
                <button onClick={toggleMute} aria-label="Micro" className={ctrl(muted)}>
                  <IconMic off={muted} />
                </button>
                {type === 'video' && (
                  <button onClick={toggleCam} aria-label="Caméra" className={ctrl(camOff)}>
                    <IconVideo off={camOff} />
                  </button>
                )}
                <button
                  onClick={() => endCall(true)}
                  aria-label="Raccrocher"
                  className="w-[68px] h-[68px] rounded-full bg-coral-500 text-white flex items-center justify-center shadow-lift active:scale-90 transition"
                >
                  <IconPhone size={28} className="rotate-[135deg]" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
