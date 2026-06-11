import { z } from 'zod';
import { PostService } from '../services/post.service.js';

const CreatePostSchema = z.object({
    facetId: z.string().uuid(),
    content: z.string().max(5000).optional(),
    mediaUrls: z.array(z.string().url()).max(10).optional(),
    visibility: z.number().int().min(1).max(5).default(5),
    timeCapsuleAt: z.string().datetime().optional(),
    audioSpatial: z.any().optional(),
    arAssets: z.any().optional(),
    language: z.string().optional(),
});

export async function postRoutes(app) {
    app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
        const data = CreatePostSchema.parse(request.body);
        const post = await PostService.create(request.user.userId, data);
        reply.code(201).send(post);
    });

    app.get('/:id', async (request, reply) => {
        const post = await PostService.getById(request.params.id, request.user?.userId);
        if (!post) return reply.code(404).send({ error: 'NotFound' });
        reply.send(post);
    });

    app.delete('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
        await PostService.delete(request.params.id, request.user.userId);
        reply.code(204).send();
    });

    app.post('/:id/react', { preHandler: [app.authenticate] }, async (request, reply) => {
        const Body = z.object({
            facetId: z.string().uuid(),
            reactionType: z.enum(['like', 'love', 'support', 'think', 'celebrate']),
        });
        const data = Body.parse(request.body);
        await PostService.react(request.params.id, data.facetId, data.reactionType);
        reply.code(204).send();
    });

    app.post('/:id/comment', { preHandler: [app.authenticate] }, async (request, reply) => {
        const Body = z.object({
            facetId: z.string().uuid(),
            content: z.string().min(1).max(2000),
            parentId: z.string().uuid().optional(),
        });
        const data = Body.parse(request.body);
        const comment = await PostService.comment(request.params.id, data);
        reply.code(201).send(comment);
    });
}
