import { query } from '../config/database.js';

export async function userRoutes(app) {
    app.get('/me', { preHandler: [app.authenticate] }, async (request) => {
        const result = await query(
            `SELECT id, email, kyc_level, country, locale, created_at, last_seen_at
             FROM users WHERE id = $1`,
            [request.user.userId]
        );
        return result.rows[0];
    });

    app.get('/facet/:handle', async (request, reply) => {
        const result = await query(
            `SELECT id, handle, display_name, facet_type, avatar_url, bio, created_at
             FROM facets WHERE handle = $1`,
            [request.params.handle]
        );
        if (result.rowCount === 0) return reply.code(404).send({ error: 'NotFound' });
        return result.rows[0];
    });
}
