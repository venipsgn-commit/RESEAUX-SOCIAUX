import { Shell } from '@/components/Shell';

const STORIES = [
  { handle: 'Toi', icon: '＋', add: true },
  { handle: 'Lucas · 73m', icon: '😊', merged: true },
  { handle: 'Léa · 86m', icon: '🎨' },
  { handle: 'Bonsoir · 142m', icon: '🥖' },
  { handle: 'Paul · 230m', icon: '🔧' },
  { handle: 'Sophie · 180m', icon: '🌱' },
  { handle: 'Apéro · 340m', icon: '🍷' },
];

export default function VoisinagePage() {
  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 pt-3 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="aura-logo" />
              <span className="text-xl font-black tracking-tight">aura</span>
              <span className="text-[11px] text-ink-700/50 font-semibold">· Bastille</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-4xl font-black tracking-tight">Voisinage</h1>
              <p className="text-sm text-ink-700/60 mt-0.5">Bastille · 47 voisins dans ton aura</p>
            </div>
            <div className="flex gap-4 items-center text-xl">
              <button aria-label="Likes">❤️</button>
              <button aria-label="Messages">💬</button>
            </div>
          </div>

          {/* STORIES */}
          <div className="overflow-x-auto -mx-1">
            <div className="flex gap-2.5 px-1 pb-1">
              {STORIES.map((s) => (
                <div key={s.handle} className="text-center flex-shrink-0 w-16">
                  <div
                    className={`story-ring ${s.merged ? 'story-ring-merged' : ''} ${
                      s.add ? 'bg-transparent border-2 border-dashed border-ink-900/20' : ''
                    }`}
                    style={s.add ? { padding: '0' } : undefined}
                  >
                    <div
                      className="story-ring-inner"
                      style={s.add ? { background: 'transparent', fontSize: '24px', color: 'rgba(31,26,18,0.4)' } : undefined}
                    >
                      {s.icon}
                    </div>
                  </div>
                  <div className={`text-[10px] mt-1 font-bold truncate ${s.merged ? 'text-sunset-500' : 'text-ink-700/70'}`}>
                    {s.handle}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* FEED */}
        <div className="px-3 lg:px-8 py-4 space-y-4">
          {/* AURA TANGENTE banner */}
          <div className="rounded-3xl p-[1px] bg-gradient-to-br from-sunset-300 to-sunset-500">
            <div className="bg-cream-50/70 backdrop-blur rounded-[22px] p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-lilac-400 to-lilac-500 flex items-center justify-center text-xl border-2 border-white shadow-pin">
                  😊
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-sm">Lucas est dans ton aura</div>
                  <div className="text-[11px] text-ink-700/70">
                    Vous êtes à <b>73m</b> · maintenant
                  </div>
                </div>
                <span className="badge-merge">Tangente</span>
              </div>
              <p className="text-sm text-ink-700/85 mb-3">
                Architecte, dans le quartier depuis 4 ans. <b className="text-forest-600">Score 92/100.</b>
              </p>
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-ink-900 text-cream-50 rounded-full font-bold text-xs shadow-soft">
                  👋 Saluer
                </button>
                <button className="px-4 py-2 bg-cream-50/70 rounded-full font-bold text-xs">Voir profil</button>
              </div>
            </div>
          </div>

          {/* POST 1 — Bakery */}
          <article className="bg-white rounded-3xl overflow-hidden border border-ink-900/5 shadow-soft">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-sunset-300 to-sunset-500 flex items-center justify-center text-xl shadow-pin">
                🥖
                <div className="absolute -bottom-1 -right-1 bg-white px-1 py-0.5 rounded-md text-[8px] font-black text-sunset-500 shadow-pin">
                  PRO
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-sm">Bonsoir Bonjour</div>
                <div className="text-[11px] text-ink-700/55">
                  ⭐ 4.8 · à <b>142m</b>
                </div>
              </div>
              <button className="text-lg" aria-label="Plus">⋯</button>
            </div>
            <div
              className="aspect-square flex items-center justify-center text-[140px] relative"
              style={{ background: 'radial-gradient(circle at 30% 30%, #ffd6a5, #ff9a3c)' }}
            >
              🥖
              <div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-full text-[10px] font-bold">
                🚶 3 min à pied
              </div>
              <div className="absolute bottom-3 right-3 bg-ink-900 text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
                ⏰ Ferme à 19h30
              </div>
            </div>
            <div className="px-4 pt-3 flex gap-4 items-center text-2xl">
              <button aria-label="J'aime">♡</button>
              <button aria-label="Commenter" className="text-xl">💬</button>
              <button aria-label="Partager" className="text-xl">↗</button>
              <div className="flex-1" />
              <button aria-label="Enregistrer" className="text-xl">🔖</button>
            </div>
            <div className="px-4 pb-4 pt-2">
              <div className="text-xs font-bold">23 voisins ont aimé</div>
              <p className="text-sm mt-1">
                <b>bonsoir-bonjour</b> Il reste <b>14 baguettes</b> & 6 pains au chocolat 😉
              </p>
              <div className="flex gap-2 mt-3">
                <button className="px-3 py-1.5 bg-sunset-500 text-white rounded-full text-xs font-bold shadow-soft">
                  Réserver
                </button>
                <button className="px-3 py-1.5 bg-sand-100 rounded-full text-xs font-bold">Itinéraire</button>
              </div>
            </div>
          </article>

          {/* POST 2 — Marketplace Marie */}
          <article className="bg-white rounded-3xl overflow-hidden border border-ink-900/5 shadow-soft">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 text-white font-black flex items-center justify-center">
                M
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-sm">marie</div>
                <div className="text-[11px] text-ink-700/55">
                  À vendre · à <b>218m</b>
                </div>
              </div>
              <button className="text-lg" aria-label="Plus">⋯</button>
            </div>
            <div className="aspect-square bg-gradient-to-br from-sky2-300 to-sky2-500 flex items-center justify-center text-[180px] relative">
              🚲
              <div className="absolute bottom-3.5 left-3.5 bg-white/95 backdrop-blur px-3.5 py-2 rounded-2xl">
                <div className="text-2xl font-black leading-none">899€</div>
                <div className="text-[10px] font-bold text-forest-600">-25% · VAE 25km/h</div>
              </div>
              <div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-full text-[10px] font-bold">🚶 218m</div>
            </div>
            <div className="px-4 pt-3 flex gap-4 items-center text-2xl">
              <button aria-label="J'aime">♡</button>
              <button aria-label="Commenter" className="text-xl">💬</button>
              <button aria-label="Partager" className="text-xl">↗</button>
              <div className="flex-1" />
              <button aria-label="Enregistrer" className="text-xl">🔖</button>
            </div>
            <div className="px-4 pb-4 pt-2">
              <div className="text-xs font-bold">47 voisins intéressés</div>
              <p className="text-sm mt-1">
                <b>marie</b> Batterie neuve, facture 2024. À venir chercher rue Sedaine 🚲
              </p>
              <button className="mt-3 w-full py-2.5 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-full font-extrabold text-sm shadow-soft">
                Acheter en escrow
              </button>
              <div className="text-[10px] text-center text-ink-700/40 mt-2">
                Commission 8% · payé seulement après livraison
              </div>
            </div>
          </article>

          {/* POST 3 — GÉO-VERROU */}
          <article className="bg-white rounded-3xl overflow-hidden border border-lilac-400/40 shadow-soft relative">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lilac-300 to-lilac-500 flex items-center justify-center text-xl">
                🔮
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm">@anonyme</span>
                  <span className="chip bg-lilac-300/20 text-lilac-500">🔒 Verrouillé</span>
                </div>
                <div className="text-[11px] text-ink-700/55">
                  il y a 2j · à <b>320m</b>
                </div>
              </div>
            </div>
            <div
              className="aspect-square flex flex-col items-center justify-center p-5 text-center relative"
              style={{ background: 'radial-gradient(circle, #d4c5f0, #b8a0e5)' }}
            >
              <div className="text-7xl opacity-50">🔒</div>
              <p className="hand text-2xl text-ink-900 max-w-[260px] leading-tight mt-2">
                "Le monde a besoin de ces moments cachés"
              </p>
              <div className="mt-3 px-3 py-1.5 bg-ink-900/85 backdrop-blur rounded-full text-white text-[11px] font-bold">
                📍 Pont rue de Charonne · 4 min
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[11px] text-ink-700/55 mb-2">12 voisins ont débloqué ce message</div>
              <button className="w-full py-2.5 bg-gradient-to-br from-lilac-300 to-lilac-500 text-white rounded-full font-extrabold text-sm shadow-soft">
                🚶 M'y rendre pour débloquer
              </button>
            </div>
          </article>

          {/* POST 4 — Léa service */}
          <article className="bg-white rounded-3xl overflow-hidden border border-ink-900/5 shadow-soft">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-400 to-coral-500 text-white font-black flex items-center justify-center">
                L
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm">lea</span>
                  <span className="chip bg-coral-400/15 text-coral-500">Service</span>
                </div>
                <div className="text-[11px] text-ink-700/55">
                  ⭐ 4.9 · à <b>86m</b>
                </div>
              </div>
            </div>
            <div className="aspect-[6/5] bg-gradient-to-br from-sage-300 to-sage-400 flex items-center justify-center text-[130px]">
              🌱
            </div>
            <div className="px-4 pt-3 flex gap-4 items-center text-2xl">
              <button aria-label="J'aime">♡</button>
              <button aria-label="Commenter" className="text-xl">💬</button>
              <button aria-label="Partager" className="text-xl">↗</button>
              <div className="flex-1" />
              <button aria-label="Enregistrer" className="text-xl">🔖</button>
            </div>
            <div className="px-4 pb-4 pt-2">
              <p className="text-sm">
                <b>lea</b> Cours de jardinage urbain · 2h · <b>35€</b>
              </p>
              <p className="hand text-lg text-coral-500 mt-0">
                &quot;Mes plantes ont jamais été aussi heureuses 🌸&quot;
              </p>
              <button className="mt-2 px-3 py-1.5 bg-coral-500 text-white rounded-full text-xs font-bold shadow-soft">
                📅 Réserver
              </button>
            </div>
          </article>

          <div className="text-center py-6 text-[11px] text-ink-700/40">
            Tu as vu toutes les nouveautés du quartier ✨
          </div>
        </div>
      </div>
    </Shell>
  );
}
