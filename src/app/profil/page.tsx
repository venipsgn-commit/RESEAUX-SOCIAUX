import { Shell } from '@/components/Shell';

const POSTS = [
  { icon: '🚲', bg: 'linear-gradient(135deg,#bce0fb,#4ba3e8)' },
  { icon: '📚', bg: 'linear-gradient(135deg,#ffd6a5,#ff9a3c)' },
  { icon: '🪴', bg: 'linear-gradient(135deg,#cde0d2,#7eac8a)' },
  { icon: '🎨', bg: 'linear-gradient(135deg,#d4c5f0,#9b7dd1)' },
  { icon: '👗', bg: 'linear-gradient(135deg,#ff8b7d,#ff6b6b)' },
  { icon: '🎸', bg: 'linear-gradient(135deg,#ebe1ce,#d8c9a8)' },
  { icon: '🌿', bg: 'linear-gradient(135deg,#a8c9b0,#5a9168)' },
  { icon: '📷', bg: 'linear-gradient(135deg,#ffd6a5,#ff8b7d)' },
  { icon: '🥖', bg: 'linear-gradient(135deg,#ffd6a5,#ff9a3c)' },
];

export default function ProfilPage() {
  return (
    <Shell>
      <div className="max-w-3xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 py-3 flex items-center justify-between">
          <span className="font-black text-lg">marie</span>
          <div className="flex gap-3 text-xl items-center">
            <button aria-label="Ajouter">＋</button>
            <button aria-label="Menu">☰</button>
          </div>
        </header>

        <div className="px-4 lg:px-8 py-4 space-y-4">
          {/* Profile head */}
          <div className="flex gap-5 items-center">
            <div className="relative">
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 text-white font-black flex items-center justify-center text-4xl lg:text-5xl shadow-lift border-4 border-white">
                M
              </div>
              <div className="absolute -bottom-1 -right-1 bg-forest-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                87
              </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xl lg:text-2xl font-black">14</div>
                <div className="text-[10px] text-ink-700/55 font-bold uppercase tracking-wider">ventes</div>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-black">23</div>
                <div className="text-[10px] text-ink-700/55 font-bold uppercase tracking-wider">services</div>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-black">62</div>
                <div className="text-[10px] text-ink-700/55 font-bold uppercase tracking-wider">IRL</div>
              </div>
            </div>
          </div>

          <div>
            <div className="font-extrabold">
              Marie Dupont <span className="text-forest-500">✓</span>
            </div>
            <div className="text-xs text-ink-700/60 mt-0.5">📍 Bastille · Paris 11ᵉ</div>
            <p className="text-sm mt-2 text-ink-700/85">
              Jardinière du dimanche, lectrice de SF, fan de pains au chocolat 🥐
            </p>
            <p className="hand text-lg text-coral-500 -mt-0.5">&quot;Mon balcon ressemble à une jungle&quot;</p>
          </div>

          {/* AURA settings */}
          <div className="bg-white rounded-2xl p-4 shadow-soft border border-ink-900/5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-extrabold">📡 Mon AURA</div>
                <div className="text-[11px] text-ink-700/55">Rayon · 500m</div>
              </div>
              <div className="w-10 h-6 bg-forest-500 rounded-full relative shadow-inner">
                <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow-soft" />
              </div>
            </div>
            <div className="bg-sand-100 rounded-xl p-3">
              <div className="flex justify-between text-[10px] font-bold text-ink-700/50 mb-2">
                <span>100m</span>
                <span className="text-forest-600">500m</span>
                <span>2km Pro</span>
              </div>
              <div className="relative h-1.5 bg-sand-200 rounded-full">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-forest-400 to-forest-600 rounded-full"
                  style={{ width: '35%' }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-forest-500 rounded-full shadow-soft"
                  style={{ left: '35%', transform: 'translate(-50%,-50%)' }}
                />
              </div>
            </div>
          </div>

          {/* Impact */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-sage-300 to-sage-400 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-extrabold">🌱 Mon impact local</div>
              <div className="bg-white/80 px-2 py-0.5 rounded-full text-[10px] font-black text-forest-600">
                -72%
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-ink-700/85">
              Tu as évité <b>340 km de livraisons</b>. <b>89 kg CO₂</b> non émis ce trimestre.
            </p>
          </div>

          {/* Grid posts */}
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-2">
              Mes annonces
            </div>
            <div className="grid grid-cols-3 gap-1">
              {POSTS.map((p, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-md lg:rounded-lg flex items-center justify-center text-4xl lg:text-5xl"
                  style={{ background: p.bg }}
                >
                  {p.icon}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
