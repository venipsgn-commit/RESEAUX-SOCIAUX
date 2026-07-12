'use client';

import { useCall } from '@/components/CallProvider';

const IconVideo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="6.5" width="12" height="11" rx="2.5" />
    <path d="M14.8 10.6 21 7.5v9l-6.2-3" />
  </svg>
);
const IconPhone = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.05-.24 1.1.45 2.3.7 3.55.7.6 0 1 .45 1 1V20c0 .6-.4 1-1 1C10.85 21 3 13.15 3 3.9c0-.55.45-1 1-1h3.35c.55 0 1 .4 1 1 0 1.25.25 2.45.7 3.55.15.35.05.75-.24 1.05l-2.2 2.3z" />
  </svg>
);

export function CallButtons({
  otherId,
  otherName,
  otherAvatar,
}: {
  otherId: string;
  otherName: string;
  otherAvatar: string;
}) {
  const { startCall, busy } = useCall();
  const peer = { id: otherId, name: otherName, avatar: otherAvatar };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => startCall(peer, 'audio')}
        disabled={busy}
        aria-label="Appel audio"
        className="w-9 h-9 rounded-full bg-forest-500/10 text-forest-600 flex items-center justify-center disabled:opacity-40 active:scale-90 hover:bg-forest-500/20 transition"
      >
        <IconPhone />
      </button>
      <button
        onClick={() => startCall(peer, 'video')}
        disabled={busy}
        aria-label="Appel vidéo"
        className="w-9 h-9 rounded-full bg-forest-500/10 text-forest-600 flex items-center justify-center disabled:opacity-40 active:scale-90 hover:bg-forest-500/20 transition"
      >
        <IconVideo />
      </button>
    </div>
  );
}
