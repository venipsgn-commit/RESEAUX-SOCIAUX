'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Message } from '@/lib/types';

type Props = {
  conversationId: string;
  meId: string;
  initialMessages: Message[];
};

export function Thread({ conversationId, meId, initialMessages }: Props) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastTypingSentRef = useRef(0);
  const typingHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll en bas à chaque nouveau message ou quand l'autre écrit
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  // Abonnement temps réel : nouveaux messages + événement "typing"
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
          if (msg.sender_id !== meId) setOtherTyping(false);
        },
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload || payload.userId === meId) return;
        setOtherTyping(true);
        if (typingHideRef.current) clearTimeout(typingHideRef.current);
        typingHideRef.current = setTimeout(() => setOtherTyping(false), 3000);
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      if (typingHideRef.current) clearTimeout(typingHideRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Prévient l'autre que j'écris (au plus une fois toutes les 1,2s)
  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1200) return;
    lastTypingSentRef.current = now;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: meId },
    });
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft('');

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: meId, body })
      .select()
      .single();

    if (!error && data) {
      // Ajout immédiat (le realtime dédoublonne par id)
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]));
    } else {
      setDraft(body); // restaure en cas d'échec
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-88px-56px)] lg:h-[calc(100dvh-56px)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 lg:px-6 py-4 space-y-2">
        {messages.length === 0 && !otherTyping && (
          <div className="text-center py-16 text-sm text-ink-700/50">
            👋 Dis bonjour à ton voisin.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] px-4 py-2.5 rounded-3xl text-sm ${
                  mine
                    ? 'bg-ink-900 text-cream-50 rounded-br-lg'
                    : 'bg-white border border-ink-900/5 shadow-soft rounded-bl-lg'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                <div className={`text-[9px] mt-1 ${mine ? 'text-cream-50/50' : 'text-ink-700/40'}`}>
                  {new Date(m.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Indicateur "en train d'écrire" */}
        {otherTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-ink-900/5 shadow-soft rounded-3xl rounded-bl-lg px-4 py-3 flex items-center gap-1 text-ink-700/60">
              <span className="typing-dot" style={{ animationDelay: '0ms' }} />
              <span className="typing-dot" style={{ animationDelay: '150ms' }} />
              <span className="typing-dot" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={send}
        className="border-t border-ink-900/5 bg-cream-50/95 backdrop-blur-xl px-3 lg:px-6 py-3 flex items-center gap-2"
      >
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            notifyTyping();
          }}
          placeholder="Écris un message…"
          className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm outline-none border border-ink-900/5 focus:ring-2 focus:ring-forest-500"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="w-10 h-10 rounded-full bg-forest-500 text-white flex items-center justify-center text-lg disabled:opacity-40"
          aria-label="Envoyer"
        >
          ↑
        </button>
      </form>
    </div>
  );
}
