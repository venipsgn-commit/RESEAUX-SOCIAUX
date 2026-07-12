export type PostType = 'sell' | 'service' | 'event' | 'question' | 'geolock' | 'story';

export type NearbyPost = {
  id: string;
  author_id: string;
  type: PostType;
  title: string;
  body: string | null;
  price_cents: number | null;
  emoji: string;
  image_url: string | null;
  lat: number;
  lng: number;
  geolock_hint: string | null;
  event_at: string | null;
  status: string;
  created_at: string;
  distance_m: number;
  author_handle: string;
  author_display_name: string;
  author_avatar_emoji: string;
  author_neighbor_score: number;
  like_count: number;
};

export type PostDetail = {
  id: string;
  author_id: string;
  type: PostType;
  title: string;
  body: string | null;
  price_cents: number | null;
  emoji: string;
  image_url: string | null;
  lat: number;
  lng: number;
  geolock_hint: string | null;
  event_at: string | null;
  status: string;
  created_at: string;
  author_handle: string;
  author_display_name: string;
  author_avatar_emoji: string;
  author_neighbor_score: number;
  author_bio: string | null;
  like_count: number;
  save_count: number;
  viewer_liked: boolean;
  viewer_saved: boolean;
};

export type Profile = {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  tagline: string | null;
  avatar_emoji: string;
  quartier: string | null;
  lat: number | null;
  lng: number | null;
  aura_radius_m: number;
  neighbor_score: number;
  created_at: string;
};

export type Conversation = {
  conversation_id: string;
  last_message_at: string;
  other_id: string;
  other_handle: string;
  other_display_name: string;
  other_avatar_emoji: string;
  last_body: string | null;
  last_sender_id: string | null;
  unread_count: number;
  last_attachment_type: AttachmentType | null;
};

export type AttachmentType = 'image' | 'video' | 'audio' | 'call';

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: AttachmentType | null;
};

export type NotifType = 'message' | 'like' | 'comment' | 'call';

export type NotifItem = {
  id: string;
  type: NotifType;
  post_id: string | null;
  conversation_id: string | null;
  body: string | null;
  read: boolean;
  created_at: string;
  actor_handle: string | null;
  actor_display_name: string | null;
  actor_avatar_emoji: string | null;
};

export type CommentItem = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  handle: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
};

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export function formatPrice(cents: number | null): string | null {
  if (cents == null) return null;
  const euros = cents / 100;
  return Number.isInteger(euros) ? `${euros}€` : `${euros.toFixed(2)}€`;
}

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `il y a ${d}j`;
}

export const POST_TYPE_META: Record<PostType, { label: string; chipClass: string; gradient: string }> = {
  sell: { label: 'À vendre', chipClass: 'bg-sky2-400/15 text-sky2-500', gradient: 'linear-gradient(135deg,#bce0fb,#4ba3e8)' },
  service: { label: 'Service', chipClass: 'bg-coral-400/15 text-coral-500', gradient: 'linear-gradient(135deg,#cde0d2,#7eac8a)' },
  event: { label: 'Événement', chipClass: 'bg-sunset-300/40 text-sunset-500', gradient: 'linear-gradient(135deg,#ffd6a5,#ff9a3c)' },
  question: { label: 'Quartier', chipClass: 'bg-sage-300/40 text-forest-600', gradient: 'radial-gradient(circle at 30% 30%, #ffd6a5, #ff9a3c)' },
  geolock: { label: '🔒 Verrouillé', chipClass: 'bg-lilac-300/20 text-lilac-500', gradient: 'radial-gradient(circle, #d4c5f0, #b8a0e5)' },
  story: { label: 'Story', chipClass: 'bg-sand-200 text-ink-700', gradient: 'linear-gradient(135deg,#f5efe3,#d8c9a8)' },
};
