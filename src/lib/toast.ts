export type ToastData = { icon?: string; title: string; text?: string };

/** Affiche un joli pop-up AURA (rendu par <Toaster/> monté dans le Shell). */
export function toast(t: ToastData) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('aura-toast', { detail: t }));
}
