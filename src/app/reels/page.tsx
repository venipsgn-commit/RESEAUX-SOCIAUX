import { Shell } from '@/components/Shell';
import { ReelsFeed } from '@/components/ReelsFeed';
import { createClient } from '@/lib/supabase/server';
import { getServerPosition } from '@/lib/getServerPosition';
import { DEFAULT_RADIUS_M } from '@/lib/location';
import type { Reel } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ReelsPage() {
  const supabase = createClient();
  const pos = getServerPosition();
  const { data } = await supabase.rpc('reels_feed', {
    user_lat: pos.lat,
    user_lng: pos.lng,
    radius_m: DEFAULT_RADIUS_M,
  });
  const reels = (data ?? []) as Reel[];

  return (
    <Shell>
      <ReelsFeed reels={reels} />
    </Shell>
  );
}
