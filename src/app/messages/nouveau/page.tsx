import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { NewGroupForm } from '@/components/NewGroupForm';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function NewGroupPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/connexion');

  return (
    <Shell>
      <div className="max-w-xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 py-3 flex items-center gap-3">
          <Link href="/messages" className="text-sm font-bold text-ink-700/60 px-1">
            ←
          </Link>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight">Nouveau groupe</h1>
        </header>
        <div className="px-4 lg:px-8 py-4">
          <NewGroupForm />
        </div>
      </div>
    </Shell>
  );
}
