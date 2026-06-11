import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';

const SignupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(10).max(128),
    handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
    displayName: z.string().min(1).max(60),
    country: z.string().length(2).optional(),
    locale: z.string().optional(),
});

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export async function authRoutes(app) {
    app.post('/signup', async (request, reply) => {
        const data = SignupSchema.parse(request.body);
        const { user, defaultFacet } = await AuthService.signup(data);
        const token = app.jwt.sign({ userId: user.id, kyc_level: user.kyc_level });
        reply.code(201).send({
            token,
            user: { id: user.id, email: user.email, kyc_level: user.kyc_level },
            facet: defaultFacet,
        });
    });

    app.post('/login', async (request, reply) => {
        const data = LoginSchema.parse(request.body);
        const user = await AuthService.login(data);
        const token = app.jwt.sign({ userId: user.id, kyc_level: user.kyc_level });
        reply.send({ token, user });
    });

    app.post('/facets', { preHandler: [app.authenticate] }, async (request, reply) => {
        const FacetSchema = z.object({
            handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
            displayName: z.string().min(1).max(60),
            facetType: z.enum(['pro', 'perso', 'creative', 'anon']),
            bio: z.string().max(280).optional(),
        });
        const data = FacetSchema.parse(request.body);
        const facet = await AuthService.createFacet(request.user.userId, data);
        reply.code(201).send(facet);
    });

    app.get('/facets', { preHandler: [app.authenticate] }, async (request) => {
        return AuthService.listFacets(request.user.userId);
    });

    app.delete('/account', { preHandler: [app.authenticate] }, async (request, reply) => {
        await AuthService.deleteAccount(request.user.userId);
        reply.code(204).send();
    });
}
