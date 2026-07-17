'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { formatPrice, timeAgo } from '@/lib/types';

type Order = {
  id: string;
  post_id: string;
  post_title: string;
  post_emoji: string;
  post_image_url: string | null;
  amount_cents: number | null;
  payment_method: 'cash_on_delivery' | 'online';
  status: 'pending' | 'accepted' | 'paid' | 'delivered' | 'cancelled';
  note: string | null;
  created_at: string;
  is_buyer: boolean;
  other_handle: string;
  other_display_name: string | null;
  other_avatar_emoji: string;
  other_avatar_url: string | null;
};

const STATUS_META: Record<Order['status'], { label: string; cls: string }> = {
  pending: { label: 'En attente', cls: 'bg-sand-200 text-ink-700' },
  accepted: { label: 'Acceptée', cls: 'bg-sky2-400/15 text-sky2-500' },
  paid: { label: 'Payée', cls: 'bg-forest-500/15 text-forest-600' },
  delivered: { label: 'Livrée', cls: 'bg-forest-500/15 text-forest-600' },
  cancelled: { label: 'Annulée', cls: 'bg-coral-500/15 text-coral-500' },
};

export function OrdersList() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[] | null>(null);

  async function load() {
    const { data } = await supabase.rpc('my_orders');
    setOrders((data ?? []) as Order[]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(o: Order, status: Order['status'], msg: string) {
    setOrders((prev) => prev?.map((x) => (x.id === o.id ? { ...x, status } : x)) ?? null);
    const { error } = await supabase.rpc('update_order_status', { p_order_id: o.id, p_status: status });
    if (!error) toast({ icon: '📦', title: msg });
    else load();
  }

  if (orders === null) {
    return <div className="py-10 text-center text-sm text-ink-700/50">Chargement…</div>;
  }
  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">🧾</div>
        <p className="font-bold">Aucune commande pour l&apos;instant.</p>
        <p className="text-sm text-ink-700/55 mt-1">Tes achats et tes ventes apparaîtront ici.</p>
      </div>
    );
  }

  const purchases = orders.filter((o) => o.is_buyer);
  const sales = orders.filter((o) => !o.is_buyer);

  const card = (o: Order) => {
    const st = STATUS_META[o.status];
    return (
      <div key={o.id} className="bg-surface rounded-2xl p-3.5 shadow-soft border border-ink-900/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
            {o.post_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.post_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              o.post_emoji
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{o.post_title}</div>
            <div className="text-[11px] text-ink-700/55 truncate">
              {o.is_buyer ? 'Vendeur' : 'Acheteur'} : {o.other_display_name || o.other_handle} · {timeAgo(o.created_at)}
            </div>
          </div>
          <span className={`chip ${st.cls} flex-shrink-0`}>{st.label}</span>
        </div>

        <div className="flex items-center justify-between mt-2.5 text-xs">
          <span className="font-black text-ink-900">{formatPrice(o.amount_cents) ?? '—'}</span>
          <span className="text-ink-700/60">
            {o.payment_method === 'online' ? '💳 Payé en ligne' : '💵 À la livraison'}
          </span>
        </div>

        {o.note && <div className="text-[12px] text-ink-700/70 mt-1.5 bg-sand-100 rounded-xl px-3 py-2">« {o.note} »</div>}

        {/* Actions */}
        {o.status !== 'cancelled' && o.status !== 'delivered' && (
          <div className="flex gap-2 mt-3">
            {!o.is_buyer && o.status === 'pending' && (
              <>
                <button
                  onClick={() => setStatus(o, 'accepted', 'Commande acceptée')}
                  className="flex-1 py-2 bg-forest-500 text-white rounded-full text-xs font-bold"
                >
                  ✅ Accepter
                </button>
                <button
                  onClick={() => setStatus(o, 'cancelled', 'Commande refusée')}
                  className="px-4 py-2 bg-sand-200 text-ink-900 rounded-full text-xs font-bold"
                >
                  Refuser
                </button>
              </>
            )}
            {!o.is_buyer && (o.status === 'accepted' || o.status === 'paid') && (
              <button
                onClick={() => setStatus(o, 'delivered', 'Marquée comme livrée')}
                className="flex-1 py-2 bg-forest-500 text-white rounded-full text-xs font-bold"
              >
                📦 Marquer livré
              </button>
            )}
            {o.is_buyer && (o.status === 'pending' || o.status === 'accepted' || o.status === 'paid') && (
              <button
                onClick={() => setStatus(o, 'cancelled', 'Commande annulée')}
                className="flex-1 py-2 bg-sand-200 text-ink-900 rounded-full text-xs font-bold"
              >
                Annuler
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {purchases.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-2">
            🛍️ Mes achats
          </div>
          <div className="space-y-2.5">{purchases.map(card)}</div>
        </div>
      )}
      {sales.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider font-bold text-ink-700/50 mb-2">
            💰 Mes ventes
          </div>
          <div className="space-y-2.5">{sales.map(card)}</div>
        </div>
      )}
    </div>
  );
}
