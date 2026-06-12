'use client';

const CIRCLES = [
    { level: 1, name: 'Intime', color: 'bg-circle-intime' },
    { level: 2, name: 'Proches', color: 'bg-circle-proches' },
    { level: 3, name: 'Amis', color: 'bg-circle-amis' },
    { level: 4, name: 'Connaissances', color: 'bg-circle-connaissances' },
    { level: 5, name: 'Public', color: 'bg-circle-public' },
];

export function CircleSelector({
    value,
    onChange,
}: {
    value: number;
    onChange: (level: number) => void;
}) {
    return (
        <div className="flex gap-2 flex-wrap">
            {CIRCLES.map((c) => (
                <button
                    key={c.level}
                    onClick={() => onChange(c.level)}
                    className={`px-3 py-1.5 rounded-full text-sm text-white transition ${c.color} ${
                        value === c.level ? 'ring-2 ring-offset-2 ring-nexus-600 scale-105' : 'opacity-60 hover:opacity-100'
                    }`}
                    type="button"
                    aria-pressed={value === c.level}
                >
                    {c.name}
                </button>
            ))}
        </div>
    );
}
