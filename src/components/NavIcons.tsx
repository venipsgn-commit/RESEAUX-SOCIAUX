import type { SVGProps } from 'react';

type Props = { name: string; size?: number; active?: boolean };

export function NavIcon({ name, size = 26, active = false }: Props) {
  const p: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: active ? 2.4 : 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  switch (name) {
    case 'carte':
      return (
        <svg {...p}>
          <polygon points="1 6 9 2 15 6 23 2 23 18 15 22 9 18 1 22" />
          <line x1="9" y1="2" x2="9" y2="18" />
          <line x1="15" y1="6" x2="15" y2="22" />
        </svg>
      );
    case 'voisinage':
      return (
        <svg {...p}>
          <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case 'marche':
      return (
        <svg {...p}>
          <path d="M6 2 3 6v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case 'reels':
      return (
        <svg {...p}>
          <rect x="3" y="4" width="18" height="16" rx="4" />
          <path d="M10 9.2v5.6l5-2.8z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'messages':
      return (
        <svg {...p}>
          <path d="M21 14a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'notifications':
      return (
        <svg {...p}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      );
    case 'profil':
      return (
        <svg {...p}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    default:
      return null;
  }
}

export function PlusIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
