'use client';

import { useState } from 'react';

type Pin = {
  id: string;
  top: string;
  left: string;
  icon: string;
  bg: string;
  pulse?: boolean;
  label?: string;
  tangente?: boolean;
};

const PINS: Pin[] = [
  { id: 'p1', top: '14%', left: '28%', icon: '🥖', bg: 'linear-gradient(135deg,#ffb878,#ff9a3c)', pulse: true, label: 'Bonsoir Bonjour' },
  { id: 'p2', top: '30%', left: '62%', icon: '🚲', bg: 'linear-gradient(135deg,#7fc4f5,#4ba3e8)', label: '899€ · VAE' },
  { id: 'p3', top: '58%', left: '30%', icon: '🎨', bg: 'linear-gradient(135deg,#ff8b7d,#ee5a5a)' },
  { id: 'p4', top: '60%', left: '74%', icon: '🍷', bg: 'linear-gradient(135deg,#ffd6a5,#ff9a3c)', pulse: true, label: 'Apéro 19h' },
  { id: 'p5', top: '12%', left: '50%', icon: '🎵', bg: 'linear-gradient(135deg,#d4c5f0,#9b7dd1)' },
  { id: 'p6', top: '32%', left: '38%', icon: '😊', bg: 'linear-gradient(135deg,#b8a0e5,#9b7dd1)', tangente: true },
  { id: 'p7', top: '75%', left: '54%', icon: '🐕', bg: 'linear-gradient(135deg,#a8c9b0,#5a9168)' },
];

export function MapCanvas({ className = '', showLabels = false }: { className?: string; showLabels?: boolean }) {
  const [selectedPin, setSelectedPin] = useState<string | null>(null);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 map-paper">
        {/* Streets */}
        <div className="street" style={{ top: '18%', left: '5%', width: '90%', height: '10px' }} />
        <div className="street" style={{ top: '42%', left: 0, width: '100%', height: '12px' }} />
        <div className="street" style={{ top: '65%', left: '8%', width: '84%', height: '10px' }} />
        <div className="street" style={{ top: 0, left: '22%', width: '10px', height: '100%' }} />
        <div className="street" style={{ top: 0, left: '55%', width: '12px', height: '100%' }} />
        <div className="street" style={{ top: 0, left: '80%', width: '8px', height: '100%' }} />

        {/* Buildings */}
        {[
          ['4%', '28%', '5.5%', '7%'],
          ['5%', '42%', '4.5%', '6%'],
          ['6%', '60%', '6%', '7%'],
          ['7%', '73%', '4%', '6%'],
          ['22%', '8%', '6%', '8.5%'],
          ['23%', '28%', '6.8%', '7.5%'],
          ['24%', '60%', '7.5%', '8%'],
          ['46%', '8%', '6.2%', '6%'],
          ['46%', '30%', '7.8%', '6.5%'],
          ['48%', '60%', '5.8%', '6%'],
          ['70%', '12%', '5.2%', '6.8%'],
          ['70%', '30%', '7.2%', '6.5%'],
          ['70%', '62%', '8%', '6.5%'],
        ].map(([top, left, w, h], i) => (
          <div key={i} className="building" style={{ top, left, width: w, height: h }} />
        ))}

        {/* Park */}
        <div className="park" style={{ top: '46%', left: '78%', width: '8%', height: '7.5%' }}>
          <div className="tree" style={{ top: '12%', left: '15%' }} />
          <div className="tree" style={{ top: '12%', right: '15%' }} />
          <div className="tree" style={{ bottom: '15%', left: '30%' }} />
          <div className="tree" style={{ bottom: '12%', right: '12%' }} />
        </div>

        {/* Water */}
        <div
          className="water"
          style={{ top: '5%', left: '88%', width: '10%', height: '5%', transform: 'rotate(-12deg)' }}
        />

        {/* AURA */}
        <div
          className="aura-glow animate-aura-breathe"
          style={{ top: '15%', left: '8%', width: '60%', height: '60%' }}
        />
        <div
          className="aura-ring animate-aura-breathe"
          style={{ top: '24%', left: '20%', width: '45%', height: '45%' }}
        />

        {/* YOU */}
        <div className="absolute" style={{ top: '46%', left: '46%' }}>
          <div className="you-pin-circle">M</div>
          <div
            className="absolute left-1/2 -translate-x-1/2 bg-ink-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap"
            style={{ bottom: '-28px' }}
          >
            Toi · 500m
          </div>
        </div>

        {/* PINS */}
        {PINS.map((pin) => (
          <div
            key={pin.id}
            className={`pin ${pin.pulse ? 'pin-pulse' : ''}`}
            style={{ top: pin.top, left: pin.left }}
            onClick={() => setSelectedPin(pin.id === selectedPin ? null : pin.id)}
          >
            <div className="pin-body" style={{ background: pin.bg }}>
              <span>{pin.icon}</span>
            </div>
            {showLabels && pin.label && (
              <div
                className="absolute left-1/2 -translate-x-1/2 bg-white rounded-lg px-2 py-1 text-[10px] font-bold whitespace-nowrap shadow-soft text-ink-900"
                style={{ top: '40px' }}
              >
                {pin.label}
              </div>
            )}
            {pin.tangente && (
              <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: '-22px' }}>
                <span className="badge-merge">Tangente</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
