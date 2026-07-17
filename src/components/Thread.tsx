'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { VoiceMessage } from '@/components/VoiceMessage';
import type { Message, AttachmentType } from '@/lib/types';

type Props = {
  conversationId: string;
  meId: string;
  initialMessages: Message[];
  initialOtherReadAt?: string | null;
  isGroup?: boolean;
  senders?: Record<string, { name: string; emoji: string }>;
};

/** Compresse une image côté client (max 1280px, JPEG 0.82). */
async function compressImage(file: File): Promise<{ blob: Blob; contentType: string; ext: string }> {
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1280;
    let { width, height } = bitmap;
    if (width > maxSide || height > maxSide) {
      const r = Math.min(maxSide / width, maxSide / height);
      width = Math.round(width * r);
      height = Math.round(height * r);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.82));
    if (blob) return { blob, contentType: 'image/jpeg', ext: 'jpg' };
  } catch {
    /* on retombe sur le fichier d'origine */
  }
  return { blob: file, contentType: file.type || 'image/jpeg', ext: 'jpg' };
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function Thread({ conversationId, meId, initialMessages, initialOtherReadAt, isGroup = false, senders = {} }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [otherReadAt, setOtherReadAt] = useState<string | null>(initialOtherReadAt ?? null);
  // Réactions aux messages : { [messageId]: { [userId]: emoji } }
  const [reactions, setReactions] = useState<Record<string, Record<string, string>>>({});
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const QUICK_REACT = ['❤️', '😂', '👍', '😮', '😢', '🙏'];

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastTypingSentRef = useRef(0);
  const typingHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelRecRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  // À l'ouverture : marque la conversation lue (badge + notifs) puis invalide
  // le cache pour que la liste Messages se rafraîchisse au retour.
  useEffect(() => {
    supabase.rpc('mark_conversation_read', { conv_id: conversationId }).then(() => router.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Chrono d'enregistrement
  useEffect(() => {
    if (!recording) return;
    setRecSecs(0);
    const id = setInterval(() => setRecSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  // Marque lu (DB) + prévient l'autre que j'ai vu ("seen")
  function markRead() {
    supabase.rpc('mark_conversation_read', { conv_id: conversationId });
    channelRef.current?.send({
      type: 'broadcast',
      event: 'seen',
      payload: { userId: meId, at: new Date().toISOString() },
    });
  }

  // Temps réel : messages + "typing" + "seen"
  useEffect(() => {
    const channel = supabase
      .channel(`conv:${conversationId}`, { config: { broadcast: { self: false } } })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          if (msg.sender_id !== meId) {
            setOtherTyping(false);
            markRead();
          }
        },
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload || payload.userId === meId) return;
        setOtherTyping(true);
        if (typingHideRef.current) clearTimeout(typingHideRef.current);
        typingHideRef.current = setTimeout(() => setOtherTyping(false), 3000);
      })
      .on('broadcast', { event: 'seen' }, ({ payload }) => {
        if (!payload || payload.userId === meId || !payload.at) return;
        setOtherReadAt((prev) => (!prev || payload.at > prev ? payload.at : prev));
      })
      .on('broadcast', { event: 'react' }, ({ payload }) => {
        if (!payload) return;
        setReactions((prev) => {
          const m = { ...(prev[payload.messageId] ?? {}) };
          if (payload.op === 'removed') delete m[payload.userId];
          else m[payload.userId] = payload.emoji;
          return { ...prev, [payload.messageId]: m };
        });
      })
      .on('broadcast', { event: 'deleted' }, ({ payload }) => {
        if (!payload?.messageId) return;
        setDeletedIds((prev) => new Set(prev).add(payload.messageId));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') markRead();
      });

    channelRef.current = channel;
    return () => {
      if (typingHideRef.current) clearTimeout(typingHideRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1200) return;
    lastTypingSentRef.current = now;
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: meId } });
  }

  // Charge les réactions existantes des messages affichés
  useEffect(() => {
    const ids = messages.map((m) => m.id);
    if (ids.length === 0) return;
    supabase.rpc('message_reactions_for', { p_message_ids: ids }).then(({ data }) => {
      const map: Record<string, Record<string, string>> = {};
      ((data as { message_id: string; user_id: string; emoji: string }[]) ?? []).forEach((r) => {
        (map[r.message_id] ??= {})[r.user_id] = r.emoji;
      });
      setReactions((prev) => ({ ...map, ...prev }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function deleteMsg(messageId: string) {
    setPickerFor(null);
    setDeletedIds((prev) => new Set(prev).add(messageId));
    channelRef.current?.send({ type: 'broadcast', event: 'deleted', payload: { messageId } });
    await supabase.rpc('delete_message', { p_id: messageId });
  }

  async function react(messageId: string, emoji: string) {
    setPickerFor(null);
    const removed = reactions[messageId]?.[meId] === emoji;
    setReactions((prev) => {
      const m = { ...(prev[messageId] ?? {}) };
      if (removed) delete m[meId];
      else m[meId] = emoji;
      return { ...prev, [messageId]: m };
    });
    channelRef.current?.send({
      type: 'broadcast',
      event: 'react',
      payload: { messageId, userId: meId, emoji, op: removed ? 'removed' : 'set' },
    });
    await supabase.rpc('toggle_message_reaction', { p_message_id: messageId, p_emoji: emoji });
  }

  function reactionChips(messageId: string) {
    const rs = reactions[messageId];
    if (!rs) return null;
    const counts: Record<string, number> = {};
    Object.values(rs).forEach((e) => {
      counts[e] = (counts[e] || 0) + 1;
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return null;
    return entries.map(([e, c]) => (
      <button
        key={e}
        onClick={() => react(messageId, e)}
        className={`text-[11px] px-1.5 py-0.5 rounded-full border ${
          rs[meId] === e ? 'bg-forest-500/15 border-forest-500/40' : 'bg-surface border-ink-900/10'
        }`}
      >
        {e}
        {c > 1 ? ` ${c}` : ''}
      </button>
    ));
  }

  async function insertMessage(fields: Partial<Message>) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: meId, ...fields })
      .select()
      .single();
    if (!error && data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]));
      return true;
    }
    return false;
  }

  async function sendText(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft('');
    const ok = await insertMessage({ body });
    if (!ok) setDraft(body);
    setSending(false);
  }

  async function uploadAndSend(
    blob: Blob,
    type: AttachmentType,
    ext: string,
    contentType: string,
    body?: string,
  ) {
    setErr(null);
    setUploading(true);
    try {
      const path = `${meId}/${Date.now()}-${Math.round(performance.now())}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('message-media')
        .upload(path, blob, { contentType, upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('message-media').getPublicUrl(path);
      await insertMessage({ body: body ?? null, attachment_url: data.publicUrl, attachment_type: type });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Échec de l'envoi du média");
    } finally {
      setUploading(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      setErr('Format non supporté (photo ou vidéo uniquement).');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErr('Fichier trop lourd (50 Mo max).');
      return;
    }
    if (isImage) {
      const { blob, contentType, ext } = await compressImage(file);
      await uploadAndSend(blob, 'image', ext, contentType);
    } else {
      const ext = file.name.split('.').pop() || 'mp4';
      await uploadAndSend(file, 'video', ext, file.type || 'video/mp4');
    }
  }

  async function startRecording() {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      cancelRecRef.current = false;
      // On préfère mp4/AAC (lisible sur iOS ET Android). Chrome retombe sur webm.
      const prefer = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
      let mime = '';
      for (const t of prefer) {
        try {
          if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(t)) {
            mime = t;
            break;
          }
        } catch {
          /* ignore */
        }
      }
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data.size) chunksRef.current.push(ev.data);
      };
      mr.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (cancelRecRef.current) return;
        const type = mr.mimeType || mime || 'audio/webm';
        const clean = type.split(';')[0];
        const ext = clean.includes('mp4') ? 'm4a' : clean.includes('ogg') ? 'ogg' : 'webm';
        const blob = new Blob(chunksRef.current, { type });
        if (blob.size > 0) await uploadAndSend(blob, 'audio', ext, clean);
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
    } catch {
      setErr('Micro indisponible. Autorise le micro dans ton navigateur.');
    }
  }

  function stopRecording(cancel: boolean) {
    cancelRecRef.current = cancel;
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-88px-56px)] lg:h-[calc(100dvh-56px)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 lg:px-6 py-4 space-y-2">
        {messages.length === 0 && !otherTyping && (
          <div className="text-center py-16 text-sm text-ink-700/50">👋 Dis bonjour à ton voisin.</div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId;

          // Entrée d'historique d'appel
          if (m.attachment_type === 'call') {
            const [, ctype, status, dur] = (m.body ?? '').split('|');
            const isVideo = ctype === 'video';
            const bad = status === 'missed' || status === 'declined';
            const label =
              status === 'missed'
                ? `Appel ${isVideo ? 'vidéo' : 'audio'} manqué`
                : status === 'declined'
                  ? 'Appel refusé'
                  : `Appel ${isVideo ? 'vidéo' : 'audio'} · ${fmtTime(Number(dur) || 0)}`;
            return (
              <div key={m.id} className="flex justify-center my-1">
                <div
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                    bad ? 'bg-coral-500/10 text-coral-500' : 'bg-sand-100 text-ink-700/70'
                  }`}
                >
                  <span>{isVideo ? '🎥' : '📞'}</span>
                  <span>{label}</span>
                  <span className="text-ink-700/35 font-normal">
                    {new Date(m.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          }

          if (m.deleted || deletedIds.has(m.id)) {
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%] text-sm px-4 py-2.5 rounded-3xl bg-surface border border-ink-900/5 text-ink-700/40 italic">
                  🚫 Message supprimé
                </div>
              </div>
            );
          }

          const hasMedia = !!m.attachment_url;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              {isGroup && !mine && senders[m.sender_id] && (
                <span className="text-[10px] font-bold text-forest-600 mb-0.5 px-2">
                  {senders[m.sender_id].emoji} {senders[m.sender_id].name}
                </span>
              )}
              <div
                className={`max-w-[80%] text-sm ${
                  hasMedia ? 'p-1.5' : 'px-4 py-2.5'
                } rounded-3xl ${
                  mine
                    ? 'bg-ink-900 text-cream-50 rounded-br-lg'
                    : 'bg-surface border border-ink-900/5 shadow-soft rounded-bl-lg'
                }`}
              >
                {m.attachment_type === 'image' && m.attachment_url && (
                  <a href={m.attachment_url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.attachment_url}
                      alt="photo"
                      className="rounded-2xl max-h-72 w-auto max-w-full object-cover"
                    />
                  </a>
                )}
                {m.attachment_type === 'video' && m.attachment_url && (
                  <video
                    src={m.attachment_url}
                    controls
                    className="rounded-2xl max-h-72 max-w-full"
                    preload="metadata"
                  />
                )}
                {m.attachment_type === 'audio' && m.attachment_url && (
                  <VoiceMessage url={m.attachment_url} mine={mine} />
                )}
                {m.attachment_type === 'story' && m.attachment_url && (
                  <div className="mb-1">
                    <div className={`text-[10px] font-semibold mb-1 px-1 ${mine ? 'text-cream-50/60' : 'text-ink-700/50'}`}>
                      ↩︎ Réponse à la story
                    </div>
                    {/\.(mp4|mov|webm|m4v|ogg)(\?|#|$)/i.test(m.attachment_url) ? (
                      <video
                        src={`${m.attachment_url}#t=0.1`}
                        className="rounded-2xl max-h-44 w-auto max-w-full"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.attachment_url}
                        alt="story"
                        className="rounded-2xl max-h-44 w-auto max-w-full object-cover"
                      />
                    )}
                  </div>
                )}
                {m.body && (
                  <div className={`whitespace-pre-wrap break-words ${hasMedia ? 'px-2 pt-1.5' : ''}`}>
                    {m.body}
                  </div>
                )}
                <div
                  className={`text-[9px] ${hasMedia ? 'px-2 pb-1' : ''} mt-1 ${
                    mine ? 'text-cream-50/50' : 'text-ink-700/40'
                  }`}
                >
                  {new Date(m.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {/* Réactions + bouton réagir */}
              <div className={`flex items-center gap-1 mt-0.5 ${mine ? 'flex-row-reverse pr-1' : 'pl-1'}`}>
                <button
                  onClick={() => setPickerFor(pickerFor === m.id ? null : m.id)}
                  aria-label="Réagir"
                  className="text-ink-700/30 text-sm leading-none active:scale-125 transition"
                >
                  ☺
                </button>
                {reactionChips(m.id)}
              </div>

              {pickerFor === m.id && (
                <div
                  className={`flex gap-1.5 mt-1 bg-surface rounded-full shadow-lift border border-ink-900/10 px-2.5 py-1.5 ${
                    mine ? 'self-end' : 'self-start'
                  }`}
                >
                  {QUICK_REACT.map((e) => (
                    <button
                      key={e}
                      onClick={() => react(m.id, e)}
                      className="text-xl active:scale-125 transition"
                    >
                      {e}
                    </button>
                  ))}
                  {mine && (
                    <button
                      onClick={() => deleteMsg(m.id)}
                      aria-label="Supprimer le message"
                      className="text-lg pl-1.5 ml-0.5 border-l border-ink-900/10 text-coral-500 active:scale-110 transition"
                    >
                      🗑
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {(() => {
          const mine = messages.filter((m) => m.sender_id === meId);
          const last = mine[mine.length - 1];
          if (!last || !otherReadAt) return null;
          if (new Date(otherReadAt).getTime() < new Date(last.created_at).getTime()) return null;
          return (
            <div className="flex justify-end pr-1 -mt-1">
              <span className="text-[10px] text-forest-600 font-semibold">Vu ✓✓</span>
            </div>
          );
        })()}

        {otherTyping && (
          <div className="flex justify-start">
            <div className="bg-surface border border-ink-900/5 shadow-soft rounded-3xl rounded-bl-lg px-4 py-3 flex items-center gap-1 text-ink-700/60">
              <span className="typing-dot" style={{ animationDelay: '0ms' }} />
              <span className="typing-dot" style={{ animationDelay: '150ms' }} />
              <span className="typing-dot" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {err && (
        <div className="px-4 py-2 text-[11px] text-coral-500 bg-coral-500/10 text-center">{err}</div>
      )}

      {/* Composer */}
      <div className="border-t border-ink-900/5 bg-cream-50/95 backdrop-blur-xl px-3 lg:px-6 py-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={onPickFile}
          className="hidden"
        />

        {recording ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => stopRecording(true)}
              aria-label="Annuler"
              className="w-10 h-10 rounded-full bg-sand-200 text-ink-900 flex items-center justify-center text-lg"
            >
              ✕
            </button>
            <div className="flex-1 flex items-center gap-2 text-coral-500 font-bold text-sm">
              <span className="w-3 h-3 rounded-full bg-coral-500 animate-pulse" />
              Enregistrement… {fmtTime(recSecs)}
            </div>
            <button
              onClick={() => stopRecording(false)}
              aria-label="Envoyer le vocal"
              className="w-10 h-10 rounded-full bg-forest-500 text-white flex items-center justify-center text-lg"
            >
              ↑
            </button>
          </div>
        ) : (
          <form onSubmit={sendText} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Envoyer une photo ou vidéo"
              className="w-10 h-10 rounded-full bg-sand-100 text-ink-900 flex items-center justify-center text-lg flex-shrink-0 disabled:opacity-40 active:scale-95 transition"
            >
              📎
            </button>
            <input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                notifyTyping();
              }}
              placeholder={uploading ? 'Envoi du média…' : 'Écris un message…'}
              disabled={uploading}
              className="flex-1 bg-surface rounded-full px-4 py-2.5 text-sm outline-none border border-ink-900/5 focus:ring-2 focus:ring-forest-500 disabled:opacity-60"
            />
            {draft.trim() ? (
              <button
                type="submit"
                disabled={sending}
                className="w-10 h-10 rounded-full bg-forest-500 text-white flex items-center justify-center text-lg disabled:opacity-40 flex-shrink-0"
                aria-label="Envoyer"
              >
                ↑
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={uploading}
                aria-label="Enregistrer un message vocal"
                className="w-10 h-10 rounded-full bg-forest-500 text-white flex items-center justify-center text-lg disabled:opacity-40 flex-shrink-0 active:scale-95 transition"
              >
                🎤
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
