import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { SearchBox } from '@/components/SearchBox';

export const dynamic = 'force-dynamic';

export default function RecherchePage() {
  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 py-3 flex items-center gap-3">
          <Link href="/voisinage" className="text-sm font-bold text-ink-700/60 px-1">
            ←
          </Link>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight">Rechercher</h1>
        </header>
        <div className="px-4 lg:px-8 py-4">
          <SearchBox />
        </div>
      </div>
    </Shell>
  );
}
