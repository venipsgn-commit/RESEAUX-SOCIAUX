import Link from 'next/link';
import { Shell } from '@/components/Shell';

export const metadata = { title: 'Confidentialité · AURA' };

export default function ConfidentialitePage() {
  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        <header className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl border-b border-ink-900/5 px-4 lg:px-8 py-3 flex items-center gap-3">
          <Link href="/profil" className="text-sm font-bold text-ink-700/60 px-1">
            ←
          </Link>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight">Confidentialité & données</h1>
        </header>

        <div className="px-5 lg:px-8 py-5 space-y-5 text-sm text-ink-700/85 leading-relaxed pb-16">
          <p className="text-ink-900 font-semibold">
            AURA est un réseau social hyperlocal : il utilise ta position pour te montrer les
            voisins, annonces et événements <b>autour de toi</b>. Voici comment tes données sont
            traitées.
          </p>

          <section>
            <h2 className="font-black text-ink-900 mb-1">📍 Ta position</h2>
            <p>
              Ta position sert uniquement à calculer les distances (ton « aura ») et à t&apos;afficher
              sur la carte du quartier. Tu peux à tout moment <b>mettre ton aura en pause</b> (tu
              deviens invisible), passer en <b>profil privé</b>, ou régler ton <b>rayon de
              visibilité</b> dans les paramètres.
            </p>
          </section>

          <section>
            <h2 className="font-black text-ink-900 mb-1">🗂️ Données collectées</h2>
            <p>
              Ton e-mail (connexion), ton pseudo, ton nom/avatar, tes publications, messages,
              stories et réactions, et ta position approximative. Rien n&apos;est vendu à des tiers.
            </p>
          </section>

          <section>
            <h2 className="font-black text-ink-900 mb-1">👀 Qui voit quoi</h2>
            <p>
              La liste de tes abonnés/abonnements t&apos;est réservée. Tes messages privés ne sont
              lisibles que par les participants. Tu peux <b>bloquer</b> ou <b>signaler</b> n&apos;importe
              quel voisin.
            </p>
          </section>

          <section>
            <h2 className="font-black text-ink-900 mb-1">✅ Tes droits (RGPD)</h2>
            <p>
              Tu peux <b>modifier</b> tes informations, <b>changer ton mot de passe</b> et{' '}
              <b>supprimer définitivement ton compte</b> (avec toutes tes données) à tout moment
              depuis <Link href="/profil/modifier" className="text-forest-600 font-bold">Modifier le profil</Link>.
              La suppression est immédiate et irréversible.
            </p>
          </section>

          <section>
            <h2 className="font-black text-ink-900 mb-1">🔒 Sécurité</h2>
            <p>
              Les accès aux données sont protégés par des règles de sécurité au niveau de la base
              (Row Level Security) : chacun ne peut lire et modifier que ce qui le concerne.
            </p>
          </section>

          <p className="text-[12px] text-ink-700/50 pt-2">
            Pour toute question sur tes données, contacte l&apos;équipe AURA. Ce texte est un résumé
            clair, pas un document juridique complet.
          </p>
        </div>
      </div>
    </Shell>
  );
}
