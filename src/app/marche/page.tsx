import { Shell } from '@/components/Shell';

const ITEMS = [
  { price: '899€', label: 'VAE 25 km/h', distance: '218m', user: '@marie', bg: 'linear-gradient(135deg,#bce0fb,#4ba3e8)', icon: '🚲' },
  { price: '450€', label: 'iPhone 13', distance: '90m', user: '@lucas', bg: 'linear-gradient(135deg,#ebe1ce,#d8c9a8)', icon: '📱' },
  { price: '249€', label: 'Fauteuil scandinave', distance: '310m', user: '@camille', bg: 'linear-gradient(135deg,#ffd6a5,#ff9a3c)', icon: '🪑' },
  { price: '120€', label: 'Illustration A3', distance: '65m', user: '@lea', bg: 'linear-gradient(135deg,#d4c5f0,#9b7dd1)', icon: '🎨' },
  { price: '45€', label: 'Robe vintage', distance: '170m', user: '@inès', bg: 'linear-gradient(135deg,#ff8b7d,#ff6b6b)', icon: '👗' },
  { price: '15€', label: 'Monstera bouturée', distance: '180m', user: '@sophie', bg: 'linear-gradient(135deg,#a8c9b0,#5a9168)', icon: '🌿' },
  { price: '80€', label: 'Lot 30 BD vintage', distance: '240m', user: '@pierre', bg: 'linear-gradient(135deg,#ffd6a5,#ffb878)', icon: '📚' },
  { price: '180€', label: 'Guitare folk', distance: '412m', user: '@yann', bg: 'linear-gradient(135deg,#bce0fb,#7eac8a)', icon: '🎸' },
];

const CATEGORIES = ['Tout · 12', '🚲 Mobilité · 2', '📱 Tech · 1', '🏠 Maison · 3', '👕 Mode · 2', '📚 Livres · 1', '🎨 Art · 2'];

export default function MarchePage() {
  return (
    <Shell>
      <div className="max-w-5xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 pt-3 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10px] text-ink-700/50 font-bold uppercase tracking-wider">📍 Aura · 500m</div>
              <h1 className="text-2xl lg:text-4xl font-black tracking-tight">Marché du quartier</h1>
              <p className="hidden lg:block text-sm text-ink-700/60 mt-1">12 trésors à 5 minutes à pied</p>
            </div>
            <button aria-label="Rechercher" className="w-10 h-10 rounded-xl bg-sand-100 flex items-center justify-center">
              🔍
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((c, i) => (
              <button
                key={c}
                className={
                  i === 0
                    ? 'bg-ink-900 text-cream-50 text-xs font-bold px-3 py-2 rounded-full whitespace-nowrap shadow-pin'
                    : 'bg-sand-100 text-ink-900 text-xs font-bold px-3 py-2 rounded-full whitespace-nowrap'
                }
              >
                {c}
              </button>
            ))}
          </div>
        </header>

        <div className="px-3 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {ITEMS.map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-2xl overflow-hidden shadow-soft border border-ink-900/5 hover:shadow-lift transition cursor-pointer"
              >
                <div
                  className="aspect-square flex items-center justify-center text-[80px] relative"
                  style={{ background: item.bg }}
                >
                  {item.icon}
                  <div className="absolute top-2 left-2 bg-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    🚶 {item.distance}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-xl font-black">{item.price}</div>
                  <div className="text-xs font-bold text-ink-700/80 truncate">{item.label}</div>
                  <div className="text-[10px] text-ink-700/50 mt-0.5">{item.user}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
