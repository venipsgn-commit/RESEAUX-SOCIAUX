import { query } from '../config/database.js';
import { cached } from '../config/redis.js';

// Feed Ranking — version simplifiée MVP
// Scoring : récence + engagement + similarité (sera remplacé par ML en prod)
//
// Score = 0.4 * recency_score + 0.4 * engagement_score + 0.2 * affinity_score
// avec décroissance exponentielle sur l'âge du post

export const FeedService = {
    async getFeed(userId, { facetId, cursor, limit }) {
        // On lit les posts des facets dans les cercles de l'utilisateur courant
        const cursorClause = cursor
            ? `AND p.created_at < (SELECT created_at FROM posts WHERE id = '${cursor}')`
            : '';

        const result = await query(
            `WITH visible_circles AS (
                SELECT DISTINCT cm.member_facet_id AS member
                FROM circles c
                JOIN circle_members cm ON cm.circle_id = c.id
                WHERE c.owner_facet_id = $1
             )
             SELECT
                p.id, p.content, p.media_urls, p.carbon_cost_g, p.created_at,
                p.is_revealed, p.time_capsule_at,
                f.handle, f.display_name, f.avatar_url, f.facet_type,
                (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) AS reaction_count,
                (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id AND deleted_at IS NULL) AS comment_count
             FROM posts p
             JOIN facets f ON f.id = p.author_facet_id
             WHERE p.deleted_at IS NULL
               AND p.is_revealed = TRUE
               AND (p.author_facet_id IN (SELECT member FROM visible_circles)
                    OR p.visibility = 5)
               ${cursorClause}
             ORDER BY
                (EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600) * -0.3
                + (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) * 0.5
                + (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) * 0.8 DESC,
                p.created_at DESC
             LIMIT $2`,
            [facetId, limit]
        );

        return {
            items: result.rows,
            nextCursor: result.rows.length === limit ? result.rows[result.rows.length - 1].id : null,
        };
    },

    async discover({ limit, language }) {
        const cacheKey = `feed:discover:${language || 'all'}:${limit}`;
        return cached(cacheKey, 60, async () => {
            const params = [limit];
            let langClause = '';
            if (language) {
                params.push(language);
                langClause = `AND p.language = $${params.length}`;
            }
            const result = await query(
                `SELECT
                    p.id, p.content, p.media_urls, p.carbon_cost_g, p.created_at,
                    f.handle, f.display_name, f.avatar_url, f.facet_type,
                    (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) AS reaction_count
                 FROM posts p
                 JOIN facets f ON f.id = p.author_facet_id
                 WHERE p.deleted_at IS NULL
                   AND p.is_revealed = TRUE
                   AND p.visibility = 5
                   AND p.created_at > NOW() - INTERVAL '24 hours'
                   ${langClause}
                 ORDER BY (SELECT COUNT(*) FROM post_reactions WHERE post_id = p.id) DESC
                 LIMIT $1`,
                params
            );
            return { items: result.rows };
        });
    },
};
