import { Shell } from '@/components/Shell';

export default function Loading() {
  return (
    <Shell>
      <div className="h-[calc(100dvh-88px)] lg:h-screen bg-ink-900 flex items-center justify-center">
        <div className="text-cream-50/50 text-4xl animate-pulse">🎬</div>
      </div>
    </Shell>
  );
}
