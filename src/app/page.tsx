import { Shell } from '@/components/Shell';
import { MapCanvas } from '@/components/MapCanvas';

export default function MapPage() {
  return (
    <Shell>
      <div className="relative h-[calc(100dvh-88px)] lg:h-screen">
        <MapCanvas className="absolute inset-0" showLabels />

        {/* TOP — location bar */}
        <div className="absolute top-3 left-3 right-3 lg:top-6 lg:left-6 lg:right-auto lg:w-96 z-30 flex gap-2 items-center animate-fade-up">
          <div className="bg-cream-50/95 backdrop-blur-xl rounded-full px-3 py-2 flex-1 flex items-center gap-2.5 shadow-soft">
            <span className="text-base">📍</span>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] uppercase tracking-wider font-bold text-ink-700/50">Tu es à</div>
              <div className="text-sm font-extrabold leading-tight">Bastille · Paris 11ᵉ</div>
            </div>
            <span className="text-xs text-ink-700/60 font-bold">▼</span>
          </div>
          <button
            aria-label="Notifications"
            className="relative w-10 h-10 bg-cream-50/95 backdrop-blur-xl rounded-full shadow-soft flex items-center justify-center"
          >
            🔔
            <span className="absolute top-2 right-2 w-2 h-2 bg-coral-500 rounded-full border-2 border-cream-50" />
          </button>
        </div>

        {/* FILTERS */}
        <div className="absolute top-16 lg:top-20 left-0 right-0 z-30 px-3 lg:px-6 overflow-x-auto">
          <div className="flex gap-1.5 pb-1">
            {['✨ Tout', '🛒 Vendre', '🛠 Service', '🎉 Event', '👥 Voisins', '🏪 Commerces'].map((f, i) => (
              <button
                key={f}
                className={
                  i === 0
                    ? 'bg-ink-900 text-cream-50 text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-pin'
                    : 'bg-cream-50/95 backdrop-blur-xl text-[11px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-soft text-ink-900'
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Map controls */}
        <div className="absolute top-32 right-3 lg:top-32 lg:right-6 z-30 flex flex-col gap-2">
          <button className="w-10 h-10 lg:w-11 lg:h-11 bg-cream-50/95 backdrop-blur-xl rounded-2xl shadow-soft flex items-center justify-center font-bold">
            +
          </button>
          <button className="w-10 h-10 lg:w-11 lg:h-11 bg-cream-50/95 backdrop-blur-xl rounded-2xl shadow-soft flex items-center justify-center font-bold">
            −
          </button>
          <button className="w-10 h-10 lg:w-11 lg:h-11 bg-forest-500 text-white rounded-2xl shadow-pin flex items-center justify-center">
            🎯
          </button>
        </div>

        {/* BOTTOM SHEET — Lucas */}
        <div className="absolute bottom-3 left-3 right-3 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96 z-30">
          <div className="bg-cream-50/97 backdrop-blur-xl rounded-3xl p-3.5 shadow-lift border border-sunset-500/30 animate-fade-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lilac-400 to-lilac-500 flex items-center justify-center text-2xl border-2 border-white shadow-pin flex-shrink-0">
                😊
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-extrabold text-sm">Lucas</span>
                  <span className="badge-merge">Aura tangente</span>
                </div>
                <div className="text-[11px] text-ink-700/60">
                  Architecte · à <b>73m</b> · Score{' '}
                  <b className="text-forest-600">92</b>
                </div>
              </div>
              <button className="px-3 py-2 bg-ink-900 text-cream-50 rounded-full text-xs font-bold shadow-soft">
                👋 Saluer
              </button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
