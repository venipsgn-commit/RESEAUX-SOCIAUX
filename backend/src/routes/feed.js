import { z } from 'zod';
import { FeedService } from '../services/feed.service.js';

export async function feedRoutes(app) {
    app.get('/', { preHandler: [app.authenticate] }, async (request) => {
        const Query = z.object({
            facetId: z.string().uuid(),
            cursor: z.string().optional(),
            limit: z.coerce.number().int().min(1).max(50).default(20),
        });
        const q = Query.parse(request.query);
        return FeedService.getFeed(request.user.userId, q);
    });

    app.get('/discover', async (request) => {
        const Query = z.object({
            limit: z.coerce.number().int().min(1).max(50).default(20),
            language: z.string().optional(),
        });
        const q = Query.parse(request.query);
        return FeedService.discover(q);
    });
}
