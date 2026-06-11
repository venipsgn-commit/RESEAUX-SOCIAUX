import { query, transaction } from '../config/database.js';
import { carbonCostPost } from '../utils/carbon.js';
import { CrisisService } from './crisis.service.js';

export const PostService = {
    async create(userId, data) {
        const facetCheck = await query(
            `SELECT id FROM facets WHERE id = $1 AND user_id = $2`,
            [data.facetId, userId]
        );
        if (facetCheck.rowCount === 0) {
            const err = new Error('Facet not owned by user');
            err.statusCode = 403;
            throw err;
        }

        const carbonCost = carbonCostPost({
            hasText: !!data.content,
            imageCount: (data.mediaUrls || []).filter((u) => /\.(png|jpe?g|webp|gif)$/i.test(u)).length,
        });

        const timeCapsuleAt = data.timeCapsuleAt ? new Date(data.timeCapsuleAt) : null;
        const isRevealed = !timeCapsuleAt || timeCapsuleAt <= new Date();

        const result = await query(
            `INSERT INTO posts (
                author_facet_id, content, media_urls, audio_spatial, ar_assets,
                visibility, time_capsule_at, is_revealed, carbon_cost_g, language
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
                data.facetId,
                data.content || null,
                data.mediaUrls || [],
                data.audioSpatial || null,
                data.arAssets || null,
                data.visibility,
                timeCapsuleAt,
                isRevealed,
                Math.round(carbonCost),
                data.language || null,
            ]
        );
        const post = result.rows[0];

        // Crisis detection asynchrone (fire and forget)
        if (data.content) {
            CrisisService.analyzeContent(userId, data.content).catch(() => {});
        }

        return post;
    },

    async getById(postId, viewerUserId) {
        const result = await query(
            `SELECT p.*, f.handle, f.display_name, f.avatar_url, f.facet_type
             FROM posts p
             JOIN facets f ON f.id = p.author_facet_id
             WHERE p.id = $1 AND p.deleted_at IS NULL`,
            [postId]
        );
        const post = result.rows[0];
        if (!post) return null;

        if (!post.is_revealed && post.time_capsule_at > new Date()) {
            return {
                id: post.id,
                isTimeCapsule: true,
                opensAt: post.time_capsule_at,
                author: { handle: post.handle, display_name: post.display_name },
            };
        }
        return post;
    },

    async delete(postId, userId) {
        const result = await query(
            `UPDATE posts SET deleted_at = NOW()
             WHERE id = $1
               AND author_facet_id IN (SELECT id FROM facets WHERE user_id = $2)
             RETURNING id`,
            [postId, userId]
        );
        if (result.rowCount === 0) {
            const err = new Error('Post not found or not owned');
            err.statusCode = 404;
            throw err;
        }
    },

    async react(postId, facetId, reactionType) {
        await query(
            `INSERT INTO post_reactions (post_id, facet_id, reaction_type)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [postId, facetId, reactionType]
        );
    },

    async comment(postId, { facetId, content, parentId }) {
        const result = await query(
            `INSERT INTO post_comments (post_id, author_facet_id, parent_id, content)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [postId, facetId, parentId || null, content]
        );
        return result.rows[0];
    },

    async revealCapsules() {
        // Job exécuté périodiquement pour révéler les time-capsules
        const result = await query(
            `UPDATE posts SET is_revealed = TRUE
             WHERE is_revealed = FALSE AND time_capsule_at <= NOW()
             RETURNING id`
        );
        return result.rowCount;
    },
};
