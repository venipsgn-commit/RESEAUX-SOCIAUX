export function CarbonBadge({ grams }: { grams: number }) {
    const display =
        grams < 10
            ? `${grams.toFixed(1)} g CO₂eq`
            : grams < 1000
            ? `${Math.round(grams)} g CO₂eq`
            : `${(grams / 1000).toFixed(2)} kg CO₂eq`;

    const color =
        grams < 5
            ? 'bg-emerald-100 text-emerald-700'
            : grams < 30
            ? 'bg-amber-100 text-amber-700'
            : 'bg-rose-100 text-rose-700';

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
            <span aria-hidden>🌱</span>
            {display}
        </span>
    );
}
