'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type CallType = 'audio' | 'video';
type Phase = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'connected';

// STUN (Google) + TURN public (Open Relay) pour traverser les réseaux mobiles/4G.
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443'],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turns:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

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
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === 'connected') {
        setPhase('connected');
        remoteRef.current?.play().catch(() => {});
      } else if (st === 'failed') {
        setErr('Connexion impossible (réseau).');
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

  return (
    <>
      {/* Boutons d'appel (dans le header) */}
      <button
        onClick={() => startCall('audio')}
        disabled={inCall}
        aria-label="Appel audio"
        className="w-9 h-9 rounded-full bg-forest-500/10 text-forest-600 flex items-center justify-center text-base disabled:opacity-40 active:scale-95 transition"
      >
        📞
      </button>
      <button
        onClick={() => startCall('video')}
        disabled={inCall}
        aria-label="Appel vidéo"
        className="w-9 h-9 rounded-full bg-forest-500/10 text-forest-600 flex items-center justify-center text-base disabled:opacity-40 active:scale-95 transition"
      >
        🎥
      </button>

      {inCall && (
        <div
          className="fixed inset-0 z-[999] bg-ink-900 text-cream-50 flex flex-col"
          onClick={() => remoteRef.current?.play().catch(() => {})}
        >
          {/* Vidéo distante = source du son ET de l'image (jamais cachée ni
              muette, sinon iOS Safari ne joue pas le son de l'appel). En appel
              audio, c'est un fond noir derrière l'avatar. */}
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full ${showVideo ? 'object-cover' : 'opacity-0'}`}
          />

          {/* Vidéo locale (PiP) */}
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            className={`absolute top-4 right-4 w-28 h-40 object-cover rounded-2xl border-2 border-cream-50/30 shadow-lift z-10 ${
              type === 'video' && !camOff ? '' : 'hidden'
            }`}
          />

          {/* Voile + infos (toujours pour audio, en overlay léger pour vidéo) */}
          <div
            className={`relative flex-1 flex flex-col items-center justify-center gap-4 px-6 ${
              showVideo ? 'bg-gradient-to-b from-ink-900/60 to-transparent to-40%' : ''
            }`}
          >
            {!showVideo && (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-6xl shadow-pin">
                {otherAvatar}
              </div>
            )}
            <div className={`text-center ${showVideo ? 'absolute top-6 left-0 right-0' : ''}`}>
              <div className="text-2xl font-black">{otherName}</div>
              <div className="text-sm text-cream-50/70 mt-1">
                {phase === 'outgoing' && 'Appel en cours…'}
                {phase === 'incoming' && `Appel ${type === 'video' ? 'vidéo' : 'audio'} entrant…`}
                {phase === 'connecting' && 'Connexion…'}
                {phase === 'connected' && fmt(secs)}
              </div>
              {err && <div className="text-xs text-coral-500 mt-2">{err}</div>}
            </div>
          </div>

          {/* Contrôles */}
          <div className="relative z-10 pb-10 pt-4 flex items-center justify-center gap-5">
            {phase === 'incoming' ? (
              <>
                <button
                  onClick={rejectCall}
                  aria-label="Refuser"
                  className="w-16 h-16 rounded-full bg-coral-500 flex items-center justify-center text-3xl shadow-lift active:scale-95 transition"
                >
                  ✕
                </button>
                <button
                  onClick={acceptCall}
                  aria-label="Accepter"
                  className="w-16 h-16 rounded-full bg-forest-500 flex items-center justify-center text-3xl shadow-lift active:scale-95 transition animate-pulse"
                >
                  {type === 'video' ? '🎥' : '📞'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleMute}
                  aria-label="Micro"
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-soft active:scale-95 transition ${
                    muted ? 'bg-cream-50 text-ink-900' : 'bg-cream-50/15 text-cream-50'
                  }`}
                >
                  {muted ? '🔇' : '🎙️'}
                </button>
                {type === 'video' && (
                  <button
                    onClick={toggleCam}
                    aria-label="Caméra"
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-soft active:scale-95 transition ${
                      camOff ? 'bg-cream-50 text-ink-900' : 'bg-cream-50/15 text-cream-50'
                    }`}
                  >
                    {camOff ? '📷' : '🎥'}
                  </button>
                )}
                <button
                  onClick={() => endCall(true)}
                  aria-label="Raccrocher"
                  className="w-16 h-16 rounded-full bg-coral-500 flex items-center justify-center text-3xl shadow-lift active:scale-95 transition"
                >
                  📵
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
