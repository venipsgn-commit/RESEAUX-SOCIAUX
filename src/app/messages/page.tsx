import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { MessagesListRefresher } from '@/components/MessagesListRefresher';
import { InvitationList } from '@/components/InvitationList';
import { createClient } from '@/lib/supabase/server';
import { type Conversation, timeAgo } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Shell>
        <div className="max-w-md mx-auto px-4 pt-24 lg:pt-40 text-center">
          <div className="text-5xl mb-3">💬</div>
          <h1 className="text-2xl font-black">Tes messages t&apos;attendent.</h1>
          <p className="text-sm text-ink-700/60 mt-2">
            Connecte-toi pour discuter avec tes voisins.
          </p>
          <Link
            href="/connexion"
            className="inline-block mt-6 px-8 py-3.5 bg-ink-900 text-cream-50 rounded-full font-extrabold text-sm shadow-lift"
          >
            Se connecter
          </Link>
        </div>
      </Shell>
    );
  }

  const { data } = await supabase.rpc('my_conversations');
  const conversations = (data ?? []) as Conversation[];

  return (
    <Shell>
      <MessagesListRefresher uid={user.id} convIds={conversations.map((c) => c.conversation_id)} />
      <div className="max-w-2xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 py-3">
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Messages</h1>
        </header>

        <InvitationList title="Demandes de connexion" />

        <div className="px-2 lg:px-6 py-2">
          {conversations.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📭</div>
              <p className="font-bold">Aucune conversation.</p>
              <p className="text-sm text-ink-700/60 mt-1">
                Contacte un voisin depuis une annonce pour démarrer une discussion.
              </p>
              <Link
                href="/voisinage"
                className="inline-block mt-4 px-5 py-2.5 bg-ink-900 text-cream-50 rounded-full text-sm font-bold shadow-soft"
              >
                Voir le voisinage
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-ink-900/5">
              {conversations.map((c) => {
                const mine = c.last_sender_id === user.id;
                const unread = c.unread_count > 0;
                let preview: string | null;
                if (c.last_attachment_type === 'call') {
                  const [, ctype, status] = (c.last_body ?? '').split('|');
                  preview =
                    status === 'missed'
                      ? `📞 Appel ${ctype === 'video' ? 'vidéo ' : ''}manqué`
                      : status === 'declined'
                        ? '📞 Appel refusé'
                        : `📞 Appel ${ctype === 'video' ? 'vidéo' : 'audio'}`;
                } else {
                  const mediaLabel =
                    c.last_attachment_type === 'image'
                      ? '📷 Photo'
                      : c.last_attachment_type === 'video'
                        ? '🎥 Vidéo'
                        : c.last_attachment_type === 'audio'
                          ? '🎤 Message vocal'
                          : null;
                  preview = c.last_body || mediaLabel;
                }
                return (
                  <Link
                    key={c.conversation_id}
                    href={`/messages/${c.conversation_id}`}
                    className={`flex items-center gap-3 px-2 lg:px-2 py-3 rounded-2xl transition ${
                      unread ? 'bg-forest-500/5 hover:bg-forest-500/10' : 'hover:bg-sand-100/50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-xl shadow-pin">
                        {c.other_avatar_emoji}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-sm truncate">
                          {c.other_display_name}
                        </span>
                        <span
                          className={`text-[10px] flex-shrink-0 ${
                            unread ? 'text-forest-600 font-bold' : 'text-ink-700/40'
                          }`}
                        >
                          {timeAgo(c.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-xs truncate flex-1 ${
                            unread ? 'text-ink-900 font-semibold' : 'text-ink-700/60'
                          }`}
                        >
                          {preview ? (
                            <>
                              {mine && <span className="text-ink-700/40 font-normal">Toi : </span>}
                              {preview}
                            </>
                          ) : (
                            <span className="italic text-ink-700/40">Nouvelle conversation</span>
                          )}
                        </div>
                        {unread && (
                          <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1.5 bg-coral-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                            {c.unread_count > 9 ? '9+' : c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
