'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/lib/toast';
import { formatPrice } from '@/lib/types';

type Method = 'cash_on_delivery' | 'online';

export function BuyButton({
  postId,
  priceCents,
  sellerHandle,
  label = 'Acheter',
  accent = 'from-forest-400 to-forest-600',
}: {
  postId: string;
  priceCents: number | null;
  sellerHandle: string;
  label?: string;
  accent?: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState<Method | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const price = formatPrice(priceCents);

  function openSheet() {
    setMethod(null);
    setNote('');
    setMounted(true);
    setOpen(true);
  }

  async function confirm() {
    if (!method || busy) return;
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/connexion');
      return;
    }
    const { error } = await supabase.rpc('create_order', {
      p_post_id: postId,
      p_method: method,
      p_note: note.trim() || null,
    });
    setBusy(false);
    if (!error) {
      setOpen(false);
      toast({
        icon: method === 'online' ? '💳' : '💵',
        title: 'Commande passée !',
        text:
          method === 'online'
            ? 'Paiement en ligne confirmé.'
            : `${sellerHandle} te contactera pour la livraison.`,
      });
      router.push('/commandes');
    } else {
      toast({ icon: '⚠️', title: 'Oups', text: "La commande n'a pas pu être passée." });
    }
  }

  return (
    <>
      <button
        onClick={openSheet}
        className={`w-full py-3 bg-gradient-to-br ${accent} text-white rounded-full font-extrabold text-sm shadow-soft`}
      >
        🛒 {label}
        {price ? ` · ${price}` : ''}
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[120] flex flex-col justify-end" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="relative bg-cream-50 rounded-t-3xl p-5 pb-8 max-h-[85%] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-ink-900/15 mx-auto mb-4" />
              <div className="font-black text-lg">Comment veux-tu payer ?</div>
              {price && (
                <div className="text-sm text-ink-700/60 mb-4">
                  Montant : <b className="text-ink-900">{price}</b>
                </div>
              )}

              <div className="space-y-2.5 mt-2">
                <button
                  onClick={() => setMethod('cash_on_delivery')}
                  className={`w-full text-left rounded-2xl p-4 border-2 transition ${
                    method === 'cash_on_delivery'
                      ? 'border-forest-500 bg-forest-500/5'
                      : 'border-ink-900/10 bg-white'
                  }`}
                >
                  <div className="font-extrabold text-sm flex items-center gap-2">💵 Paiement à la livraison</div>
                  <div className="text-[12px] text-ink-700/60 mt-0.5">
                    Tu paies en main propre à la remise du produit. Rien n&apos;est débité maintenant.
                  </div>
                </button>

                <button
                  onClick={() => setMethod('online')}
                  className={`w-full text-left rounded-2xl p-4 border-2 transition ${
                    method === 'online' ? 'border-forest-500 bg-forest-500/5' : 'border-ink-900/10 bg-white'
                  }`}
                >
                  <div className="font-extrabold text-sm flex items-center gap-2">
                    💳 Paiement en ligne
                    <span className="text-[9px] uppercase tracking-wider bg-sunset-500/15 text-sunset-500 px-1.5 py-0.5 rounded-full">
                      démo
                    </span>
                  </div>
                  <div className="text-[12px] text-ink-700/60 mt-0.5">
                    Paiement sécurisé tout de suite (simulation — la vraie carte bancaire arrivera avec
                    Stripe).
                  </div>
                </button>
              </div>

              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                placeholder="Message au vendeur (lieu, horaire…)"
                className="mt-3 w-full bg-white rounded-2xl px-4 py-3 text-sm outline-none border border-ink-900/10"
              />

              <button
                onClick={confirm}
                disabled={!method || busy}
                className="mt-4 w-full py-3.5 bg-gradient-to-br from-forest-400 to-forest-600 text-white rounded-full font-extrabold shadow-lift disabled:opacity-50"
              >
                {busy
                  ? '…'
                  : method === 'online'
                    ? `Payer ${price ?? ''}`.trim()
                    : method === 'cash_on_delivery'
                      ? 'Confirmer la commande'
                      : 'Choisis un mode de paiement'}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
