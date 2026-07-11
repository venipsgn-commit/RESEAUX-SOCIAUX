import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { createClient } from '@/lib/supabase/server';
import { type NotifItem, timeAgo } from '@/lib/types';

export const dynamic = 'force-dynamic';

const TYPE_META: Record<NotifItem['type'], { icon: string; verb: string }> = {
  message: { icon: '💬', verb: "t'a envoyé un message" },
  like: { icon: '❤️', verb: 'a aimé ton post' },
  comment: { icon: '🗨️', verb: 'a commenté ton post' },
};

export default async function NotificationsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Shell>
        <div className="max-w-md mx-auto px-4 pt-24 lg:pt-40 text-center">
          <div className="text-5xl mb-3">🔔</div>
          <h1 className="text-2xl font-black">Reste au courant de ton quartier.</h1>
          <p className="text-sm text-ink-700/60 mt-2">
            Connecte-toi pour recevoir tes notifications.
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

  const { data } = await supabase.rpc('my_notifications');
  const notifs = (data ?? []) as NotifItem[];

  // Marque tout comme lu (le badge de la cloche se remettra à zéro à l'arrivée)
  await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 py-3">
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight">Notifications</h1>
        </header>

        <div className="px-2 lg:px-6 py-2">
          {notifs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🔕</div>
              <p className="font-bold">Rien de neuf.</p>
              <p className="text-sm text-ink-700/60 mt-1">
                Tes likes, commentaires et messages apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-ink-900/5">
              {notifs.map((n) => {
                const meta = TYPE_META[n.type];
                const href =
                  n.type === 'message' && n.conversation_id
                    ? `/messages/${n.conversation_id}`
                    : n.post_id
                      ? `/post/${n.post_id}`
                      : '#';
                return (
                  <Link
                    key={n.id}
                    href={href}
                    className={`flex items-center gap-3 px-2 py-3 rounded-2xl transition ${
                      n.read ? 'hover:bg-sand-100/50' : 'bg-forest-500/5 hover:bg-forest-500/10'
                    }`}
                  >
                    <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-lg shadow-pin flex-shrink-0">
                      {n.actor_avatar_emoji ?? '📍'}
                      <span className="absolute -bottom-1 -right-1 text-sm">{meta.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <b>{n.actor_display_name ?? 'Un voisin'}</b>{' '}
                        <span className="text-ink-700/70">{meta.verb}</span>
                      </div>
                      {n.body && (
                        <div className="text-xs text-ink-700/55 truncate mt-0.5">
                          {n.type === 'message' || n.type === 'comment' ? `« ${n.body} »` : n.body}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-ink-700/40">{timeAgo(n.created_at)}</span>
                      {!n.read && <span className="w-2 h-2 bg-coral-500 rounded-full" />}
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
