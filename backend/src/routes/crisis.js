import { z } from 'zod';
import { CrisisService } from '../services/crisis.service.js';

// Endpoints de support : ressources d'aide accessibles à tous, et endpoints staff
const HELP_RESOURCES = {
    fr: {
        country: 'France',
        emergencies: [
            { name: '3114 — Numéro national de prévention du suicide', number: '3114', hours: '24/7' },
            { name: 'SOS Amitié', number: '09 72 39 40 50', hours: '24/7' },
            { name: 'Suicide Écoute', number: '01 45 39 40 00', hours: '24/7' },
            { name: 'Samu', number: '15', hours: '24/7 — urgence vitale' },
        ],
    },
    en: {
        country: 'International',
        emergencies: [
            { name: 'International Suicide Hotlines', url: 'https://findahelpline.com/' },
            { name: '988 (US Suicide & Crisis Lifeline)', number: '988', hours: '24/7' },
        ],
    },
};

export async function crisisRoutes(app) {
    app.get('/resources', async (request) => {
        const Query = z.object({ lang: z.string().default('fr') });
        const q = Query.parse(request.query);
        return HELP_RESOURCES[q.lang] || HELP_RESOURCES.en;
    });

    // Endpoints staff (à protéger par RBAC en prod)
    app.get('/alerts', { preHandler: [app.authenticate] }, async () => {
        return CrisisService.listOpen();
    });

    app.post('/alerts/:id/resolve', { preHandler: [app.authenticate] }, async (request, reply) => {
        const Body = z.object({
            notes: z.string().optional(),
            status: z.enum(['resolved', 'false_positive', 'escalated']).default('resolved'),
        });
        const data = Body.parse(request.body);
        await CrisisService.resolve(request.params.id, request.user.userId, data.notes, data.status);
        reply.code(204).send();
    });
}
