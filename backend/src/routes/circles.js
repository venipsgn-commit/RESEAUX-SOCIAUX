import { z } from 'zod';
import { query } from '../config/database.js';

export async function circleRoutes(app) {
    app.addHook('preHandler', app.authenticate);

    app.get('/:facetId', async (request) => {
        const result = await query(
            `SELECT c.id, c.name, c.level, c.color,
                    (SELECT COUNT(*) FROM circle_members WHERE circle_id = c.id) AS member_count
             FROM circles c
             JOIN facets f ON f.id = c.owner_facet_id
             WHERE c.owner_facet_id = $1 AND f.user_id = $2
             ORDER BY c.level ASC`,
            [request.params.facetId, request.user.userId]
        );
        return result.rows;
    });

    app.post('/:circleId/members', async (request, reply) => {
        const Body = z.object({ memberFacetId: z.string().uuid() });
        const data = Body.parse(request.body);

        const auth = await query(
            `SELECT c.id FROM circles c
             JOIN facets f ON f.id = c.owner_facet_id
             WHERE c.id = $1 AND f.user_id = $2`,
            [request.params.circleId, request.user.userId]
        );
        if (auth.rowCount === 0) return reply.code(403).send({ error: 'Forbidden' });

        await query(
            `INSERT INTO circle_members (circle_id, member_facet_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [request.params.circleId, data.memberFacetId]
        );
        reply.code(204).send();
    });

    app.delete('/:circleId/members/:facetId', async (request, reply) => {
        const auth = await query(
            `SELECT c.id FROM circles c
             JOIN facets f ON f.id = c.owner_facet_id
             WHERE c.id = $1 AND f.user_id = $2`,
            [request.params.circleId, request.user.userId]
        );
        if (auth.rowCount === 0) return reply.code(403).send({ error: 'Forbidden' });

        await query(
            `DELETE FROM circle_members WHERE circle_id = $1 AND member_facet_id = $2`,
            [request.params.circleId, request.params.facetId]
        );
        reply.code(204).send();
    });
}
