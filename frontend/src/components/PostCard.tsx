import { CarbonBadge } from './CarbonBadge';

type Post = {
    id: string;
    content?: string;
    media_urls?: string[];
    carbon_cost_g: number;
    created_at: string;
    handle: string;
    display_name: string;
    avatar_url?: string;
    facet_type: 'pro' | 'perso' | 'creative' | 'anon';
    reaction_count?: number;
    comment_count?: number;
    is_revealed?: boolean;
    time_capsule_at?: string;
};

const FACET_BADGES: Record<string, { label: string; color: string }> = {
    pro: { label: 'Pro', color: 'bg-blue-100 text-blue-700' },
    perso: { label: 'Perso', color: 'bg-emerald-100 text-emerald-700' },
    creative: { label: 'Créatif', color: 'bg-purple-100 text-purple-700' },
    anon: { label: 'Anonyme', color: 'bg-gray-100 text-gray-700' },
};

export function PostCard({ post }: { post: Post }) {
    const badge = FACET_BADGES[post.facet_type];
    const isCapsule = post.time_capsule_at && !post.is_revealed;

    return (
        <article className="p-4 rounded-2xl bg-white dark:bg-nexus-900/40 border border-nexus-100 dark:border-nexus-700">
            <header className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-nexus-200 flex items-center justify-center font-bold text-nexus-700">
                    {post.display_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{post.display_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                            {badge.label}
                        </span>
                    </div>
                    <div className="text-sm text-gray-500">@{post.handle}</div>
                </div>
                <time className="text-xs text-gray-500" dateTime={post.created_at}>
                    {new Date(post.created_at).toLocaleString('fr-FR')}
                </time>
            </header>

            {isCapsule ? (
                <div className="p-6 rounded-xl bg-gradient-to-r from-nexus-500 to-nexus-700 text-white text-center">
                    <div className="text-3xl mb-2">⏳</div>
                    <p className="font-semibold">Time-Capsule scellée</p>
                    <p className="text-sm opacity-90">
                        S'ouvre le {new Date(post.time_capsule_at!).toLocaleString('fr-FR')}
                    </p>
                </div>
            ) : (
                <>
                    {post.content && <p className="whitespace-pre-wrap mb-3">{post.content}</p>}
                    {post.media_urls && post.media_urls.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {post.media_urls.map((url, i) => (
                                <img
                                    key={i}
                                    src={url}
                                    alt=""
                                    className="rounded-lg w-full h-auto object-cover"
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            <footer className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <button className="hover:text-nexus-600 transition">♥ {post.reaction_count ?? 0}</button>
                <button className="hover:text-nexus-600 transition">💬 {post.comment_count ?? 0}</button>
                <div className="flex-1" />
                <CarbonBadge grams={post.carbon_cost_g} />
            </footer>
        </article>
    );
}
