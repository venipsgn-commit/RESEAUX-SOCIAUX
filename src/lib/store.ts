import { create } from 'zustand';

type Facet = {
    id: string;
    handle: string;
    display_name: string;
    facet_type: 'pro' | 'perso' | 'creative' | 'anon';
};

type SessionState = {
    token: string | null;
    user: { id: string; email: string } | null;
    facets: Facet[];
    activeFacetId: string | null;
    dailyUsageSeconds: number;
    setSession: (token: string, user: { id: string; email: string }, facets: Facet[]) => void;
    setActiveFacet: (id: string) => void;
    logout: () => void;
    tickUsage: (delta: number) => void;
};

export const useSession = create<SessionState>((set) => ({
    token: typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null,
    user: null,
    facets: [],
    activeFacetId: null,
    dailyUsageSeconds: 0,
    setSession: (token, user, facets) => {
        if (typeof window !== 'undefined') localStorage.setItem('nexus_token', token);
        set({
            token,
            user,
            facets,
            activeFacetId: facets[0]?.id ?? null,
        });
    },
    setActiveFacet: (id) => set({ activeFacetId: id }),
    logout: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('nexus_token');
        set({ token: null, user: null, facets: [], activeFacetId: null });
    },
    tickUsage: (delta) => set((s) => ({ dailyUsageSeconds: s.dailyUsageSeconds + delta })),
}));
