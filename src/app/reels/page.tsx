import { Shell } from '@/components/Shell';
import { ReelsFeed } from '@/components/ReelsFeed';
import { createClient } from '@/lib/supabase/server';
import type { Reel } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ReelsPage() {
  const supabase = createClient();
  const { data } = await supabase.rpc('reels_feed');
  const reels = (data ?? []) as Reel[];

  return (
    <Shell>
      <ReelsFeed reels={reels} />
    </Shell>
  );
}
