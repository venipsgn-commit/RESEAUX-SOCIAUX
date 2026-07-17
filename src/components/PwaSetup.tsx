'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const VAPID_PUBLIC = 'BAzlRGlcnIRbifhuopyEaIwheLstKyeLnq3Dy3gy8sItmi78u86zfYs2qiHWmNr4RbHkN3wsMeOuEWGJKdyeTOQ';

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type BipEvent = Event & { prompt: () => void };

export function PwaSetup() {
  const supabase = createClient();
  const [installEvt, setInstallEvt] = useState<BipEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  async function subscribe(reg: ServiceWorkerRegistration) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC),
        });
      }
      const json = sub.toJSON();
      await supabase.rpc('save_push_subscription', {
        p_endpoint: sub.endpoint,
        p_p256dh: json.keys?.p256dh,
        p_auth: json.keys?.auth,
      });
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js')
      .then(async (reg) => {
        if (typeof Notification === 'undefined') return;
        if (Notification.permission === 'granted') {
          subscribe(reg);
        } else if (Notification.permission === 'default') {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user && localStorage.getItem('aura_notif_dismissed') !== '1') setShowNotif(true);
        }
      })
      .catch(() => {});

    const onBip = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BipEvent);
      if (localStorage.getItem('aura_install_dismissed') !== '1') setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enableNotif() {
    setShowNotif(false);
    localStorage.setItem('aura_notif_dismissed', '1');
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        subscribe(reg);
      }
    } catch {
      /* ignore */
    }
  }

  function doInstall() {
    setShowInstall(false);
    localStorage.setItem('aura_install_dismissed', '1');
    installEvt?.prompt();
  }

  if (!showNotif && !showInstall) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-6 inset-x-3 lg:left-auto lg:right-6 lg:w-80 z-[900] flex flex-col gap-2">
      {showNotif && (
        <div className="bg-ink-900 text-cream-50 rounded-2xl shadow-lift px-4 py-3 flex items-center gap-3 animate-fade-up">
          <span className="text-xl">🔔</span>
          <div className="flex-1 text-xs font-bold leading-tight">
            Reçois une alerte quand un voisin t&apos;écrit ou t&apos;invite.
          </div>
          <button onClick={enableNotif} className="bg-forest-500 text-white text-xs font-black px-3 py-1.5 rounded-full">
            Activer
          </button>
          <button
            onClick={() => {
              setShowNotif(false);
              localStorage.setItem('aura_notif_dismissed', '1');
            }}
            aria-label="Fermer"
            className="text-cream-50/60 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
      {showInstall && (
        <div className="bg-cream-50 border border-ink-900/10 rounded-2xl shadow-lift px-4 py-3 flex items-center gap-3 animate-fade-up">
          <span className="text-xl">📲</span>
          <div className="flex-1 text-xs font-bold leading-tight text-ink-900">
            Installe AURA sur ton écran d&apos;accueil.
          </div>
          <button onClick={doInstall} className="bg-ink-900 text-cream-50 text-xs font-black px-3 py-1.5 rounded-full">
            Installer
          </button>
          <button
            onClick={() => {
              setShowInstall(false);
              localStorage.setItem('aura_install_dismissed', '1');
            }}
            aria-label="Fermer"
            className="text-ink-700/40 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
