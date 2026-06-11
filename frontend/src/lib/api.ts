const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type RequestOpts = RequestInit & { token?: string | null };

export class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, body: unknown) {
        super(typeof body === 'object' && body && 'message' in body ? String((body as any).message) : 'API error');
        this.status = status;
        this.body = body;
    }
}

export async function apiFetch<T = unknown>(path: string, opts: RequestOpts = {}): Promise<T> {
    const { token, headers, ...rest } = opts;
    const res = await fetch(`${API_BASE}${path}`, {
        ...rest,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) throw new ApiError(res.status, body);
    return body as T;
}

export const api = {
    signup: (data: {
        email: string;
        password: string;
        handle: string;
        displayName: string;
        country?: string;
        locale?: string;
    }) =>
        apiFetch('/api/v1/auth/signup', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    login: (data: { email: string; password: string }) =>
        apiFetch('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    me: (token: string) => apiFetch('/api/v1/users/me', { token }),

    listFacets: (token: string) => apiFetch('/api/v1/auth/facets', { token }),

    createPost: (
        token: string,
        data: {
            facetId: string;
            content?: string;
            mediaUrls?: string[];
            visibility?: number;
            timeCapsuleAt?: string;
        }
    ) =>
        apiFetch('/api/v1/posts', {
            method: 'POST',
            token,
            body: JSON.stringify(data),
        }),

    getFeed: (token: string, facetId: string, cursor?: string) =>
        apiFetch(
            `/api/v1/feed?facetId=${facetId}${cursor ? `&cursor=${cursor}` : ''}`,
            { token }
        ),

    getWallet: (token: string) => apiFetch('/api/v1/wallet', { token }),

    getCrisisResources: (lang = 'fr') =>
        apiFetch(`/api/v1/crisis/resources?lang=${lang}`),
};
