'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type CallType = 'audio' | 'video';
type Phase = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'connected';
type Peer = { id: string; name: string; avatar: string };

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
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2.5" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <line x1="12" y1="18" x2="12" y2="21.5" />
    {off && <line x1="4" y1="3.5" x2="20" y2="20.5" />}
  </svg>
);
const IconVideo = ({ off = false, size = 24 }: { off?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

type CallApi = { startCall: (peer: Peer, type: CallType) => void; busy: boolean };
const CallCtx = createContext<CallApi>({ startCall: () => {}, busy: false });
export const useCall = () => useContext(CallCtx);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [phase, setPhase] = useState<Phase>('idle');
  const [type, setType] = useState<CallType>('audio');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [secs, setSecs] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const meRef = useRef<{ id: string; name: string; avatar: string } | null>(null);
  const chanRef = useRef<RealtimeChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const iceBufferRef = useRef<RTCIceCandidateInit[]>([]);
  const peerRef = useRef<Peer | null>(null);
  const phaseRef = useRef<Phase>('idle');
  const remoteRef = useRef<HTMLVideoElement>(null);
  const localRef = useRef<HTMLVideoElement>(null);
  // Suivi pour l'historique d'appel
  const wasCallerRef = useRef(false);
  const connectedRef = useRef(false);
  const secsRef = useRef(0);
  const loggedRef = useRef(false);
  const typeRef = useRef<CallType>('audio');

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    peerRef.current = peer;
  }, [peer]);

  // Identité + canal d'appels global (inbox par utilisateur)
  useEffect(() => {
    let ch: RealtimeChannel | null = null;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name, avatar_emoji')
        .eq('id', uid)
        .single();
      meRef.current = {
        id: uid,
        name: prof?.display_name ?? 'Moi',
        avatar: prof?.avatar_emoji ?? '📍',
      };
      ch = supabase
        .channel('calls', { config: { broadcast: { self: false } } })
        .on('broadcast', { event: 'signal' }, ({ payload }) => handleSignal(payload))
        .subscribe();
      chanRef.current = ch;
    })();
    return () => {
      if (ch) supabase.removeChannel(ch);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 'connected') return;
    setSecs(0);
    secsRef.current = 0;
    const id = setInterval(() => {
      secsRef.current += 1;
      setSecs(secsRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Enregistre l'appel dans l'historique de la conversation (côté appelant)
  async function logCall(status: 'answered' | 'missed' | 'declined') {
    if (!wasCallerRef.current || loggedRef.current) return;
    loggedRef.current = true;
    const other = peerRef.current;
    const me = meRef.current;
    if (!other || !me) return;
    try {
      const { data: convId } = await supabase.rpc('get_or_create_dm', { other: other.id });
      if (!convId) return;
      await supabase.from('messages').insert({
        conversation_id: convId as string,
        sender_id: me.id,
        attachment_type: 'call',
        body: `call|${typeRef.current}|${status}|${secsRef.current}`,
      });
    } catch {
      /* log best-effort */
    }
  }

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

  useEffect(() => {
    if (phase !== 'connecting' && phase !== 'outgoing') return;
    const id = setTimeout(() => {
      setErr('La connexion tarde… Si rien ne vient, essayez en Wi-Fi des deux côtés.');
    }, 18000);
    return () => clearTimeout(id);
  }, [phase]);

  function send(kind: string, extra: Record<string, unknown> = {}) {
    const to = peerRef.current?.id;
    const me = meRef.current;
    if (!to || !me) return;
    chanRef.current?.send({
      type: 'broadcast',
      event: 'signal',
      payload: { to, from: me.id, kind, ...extra },
    });
  }

  function attachRemote() {
    if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream();
    if (remoteRef.current) {
      remoteRef.current.srcObject = remoteStreamRef.current;
      remoteRef.current.play().catch(() => {});
    }
  }

  function createPeer() {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (e) => {
      if (e.candidate) send('ice', { candidate: e.candidate.toJSON() });
    };
    pc.ontrack = (e) => {
      if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream();
      remoteStreamRef.current.addTrack(e.track);
      attachRemote();
    };
    const markConnected = () => {
      setErr(null);
      connectedRef.current = true;
      setPhase('connected');
      remoteRef.current?.play().catch(() => {});
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') markConnected();
      else if (pc.connectionState === 'failed') {
        setErr('Connexion impossible sur ce réseau. Essaie en Wi-Fi.');
        endCall(false);
      }
    };
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

  function startCall(p: Peer, t: CallType) {
    if (phaseRef.current !== 'idle') return;
    setErr(null);
    setPeer(p);
    peerRef.current = p;
    setType(t);
    typeRef.current = t;
    wasCallerRef.current = true;
    connectedRef.current = false;
    loggedRef.current = false;
    secsRef.current = 0;
    setMuted(false);
    setCamOff(false);
    setPhase('outgoing');
    (async () => {
      try {
        const pc = createPeer();
        await getLocalMedia(t);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const me = meRef.current;
        send('offer', { sdp: pc.localDescription, callType: t, fromName: me?.name, fromAvatar: me?.avatar });
      } catch {
        setErr("Caméra/micro indisponible. Autorise l'accès.");
        cleanup();
        setPhase('idle');
      }
    })();
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
      send('answer', { sdp: pc.localDescription });
      pendingOfferRef.current = null;
    } catch {
      setErr("Caméra/micro indisponible. Autorise l'accès.");
      endCall(true);
    }
  }

  function rejectCall() {
    send('reject');
    cleanup();
    setPhase('idle');
  }
  function endCall(notify: boolean) {
    logCall(connectedRef.current ? 'answered' : 'missed');
    if (notify) send('end');
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
    to?: string;
    from?: string;
    kind?: string;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
    callType?: CallType;
    fromName?: string;
    fromAvatar?: string;
  }) {
    const me = meRef.current;
    if (!p || !me || p.to !== me.id || p.from === me.id) return;
    switch (p.kind) {
      case 'offer': {
        if (phaseRef.current !== 'idle') {
          // occupé : refuse poliment
          chanRef.current?.send({
            type: 'broadcast',
            event: 'signal',
            payload: { to: p.from, from: me.id, kind: 'busy' },
          });
          return;
        }
        const pr = { id: p.from!, name: p.fromName ?? 'Voisin·e', avatar: p.fromAvatar ?? '📍' };
        setPeer(pr);
        peerRef.current = pr;
        pendingOfferRef.current = p.sdp ?? null;
        setType(p.callType ?? 'audio');
        typeRef.current = p.callType ?? 'audio';
        wasCallerRef.current = false;
        connectedRef.current = false;
        loggedRef.current = false;
        secsRef.current = 0;
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
        logCall('declined');
        cleanup();
        setPhase('idle');
        break;
      case 'busy':
        setErr('Ton correspondant est déjà en appel.');
        logCall('missed');
        cleanup();
        setPhase('idle');
        break;
      case 'end':
        logCall(connectedRef.current ? 'answered' : 'missed');
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
    <CallCtx.Provider value={{ startCall, busy: inCall }}>
      {children}
      {mounted &&
        inCall &&
        createPortal(
          <div
            className="fixed inset-0 z-[999] text-cream-50 select-none animate-fade-up"
            onClick={() => remoteRef.current?.play().catch(() => {})}
          >
            <div
              className={`absolute inset-0 ${
                showVideo
                  ? 'bg-ink-900'
                  : 'bg-[radial-gradient(circle_at_50%_22%,#31674a_0%,#1b2e21_50%,#100e0a_100%)]'
              }`}
            />
            <video
              ref={remoteRef}
              autoPlay
              playsInline
              className={`absolute inset-0 w-full h-full ${
                showVideo ? 'object-cover' : 'opacity-0 pointer-events-none'
              }`}
            />
            {showVideo && (
              <>
                <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-b from-ink-900/75 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 h-60 bg-gradient-to-t from-ink-900/85 to-transparent" />
              </>
            )}
            {type === 'video' && !camOff && phase !== 'incoming' && (
              <video
                ref={localRef}
                autoPlay
                playsInline
                muted
                className="absolute top-5 right-4 w-24 h-36 sm:w-28 sm:h-40 object-cover rounded-2xl border border-cream-50/25 shadow-lift z-20 bg-ink-900"
              />
            )}

            <div className="absolute top-0 inset-x-0 z-10 pt-[env(safe-area-inset-top)]">
              <div className="pt-8 px-6 text-center">
                <div className="text-[11px] uppercase tracking-[0.2em] text-cream-50/60 font-bold">
                  {type === 'video' ? 'Appel vidéo' : 'Appel audio'}
                </div>
                <div className="text-[26px] font-black leading-tight mt-1.5 [text-wrap:balance]">
                  {peer?.name ?? 'Voisin·e'}
                </div>
                <div className="text-sm text-cream-50/75 mt-1 tabular-nums min-h-[20px]">{statusText}</div>
                {err && (
                  <div className="text-xs text-sunset-300 mt-2 max-w-xs mx-auto leading-snug">{err}</div>
                )}
              </div>
            </div>

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
                    {peer?.avatar ?? '📍'}
                  </div>
                </div>
              </div>
            )}

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
          </div>,
          document.body,
        )}
    </CallCtx.Provider>
  );
}
