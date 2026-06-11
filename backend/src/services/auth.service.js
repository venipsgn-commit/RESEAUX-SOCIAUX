import argon2 from 'argon2';
import { query, transaction } from '../config/database.js';

export const AuthService = {
    async signup({ email, password, handle, displayName, country, locale }) {
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rowCount > 0) {
            const err = new Error('Email already registered');
            err.statusCode = 409;
            throw err;
        }

        const handleConflict = await query('SELECT id FROM facets WHERE handle = $1', [handle]);
        if (handleConflict.rowCount > 0) {
            const err = new Error('Handle already taken');
            err.statusCode = 409;
            throw err;
        }

        const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

        return transaction(async (client) => {
            const userResult = await client.query(
                `INSERT INTO users (email, password_hash, country, locale)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, email, kyc_level, country, locale, created_at`,
                [email, passwordHash, country || null, locale || 'fr-FR']
            );
            const user = userResult.rows[0];

            const facetResult = await client.query(
                `INSERT INTO facets (user_id, handle, display_name, facet_type, is_default)
                 VALUES ($1, $2, $3, 'perso', TRUE)
                 RETURNING id, handle, display_name, facet_type, created_at`,
                [user.id, handle, displayName]
            );
            const defaultFacet = facetResult.rows[0];

            await client.query(
                `INSERT INTO wallets (user_id, tax_country) VALUES ($1, $2)`,
                [user.id, country || null]
            );

            const circles = [
                { name: 'Intime', level: 1, color: '#ff4d6d' },
                { name: 'Proches', level: 2, color: '#ff9f1c' },
                { name: 'Amis', level: 3, color: '#2ec4b6' },
                { name: 'Connaissances', level: 4, color: '#3a86ff' },
                { name: 'Public', level: 5, color: '#8338ec' },
            ];
            for (const c of circles) {
                await client.query(
                    `INSERT INTO circles (owner_facet_id, name, level, color)
                     VALUES ($1, $2, $3, $4)`,
                    [defaultFacet.id, c.name, c.level, c.color]
                );
            }

            return { user, defaultFacet };
        });
    },

    async login({ email, password }) {
        const result = await query(
            `SELECT id, email, password_hash, kyc_level, deleted_at
             FROM users WHERE email = $1`,
            [email]
        );
        const user = result.rows[0];
        if (!user || user.deleted_at) {
            const err = new Error('Invalid credentials');
            err.statusCode = 401;
            throw err;
        }
        const ok = await argon2.verify(user.password_hash, password);
        if (!ok) {
            const err = new Error('Invalid credentials');
            err.statusCode = 401;
            throw err;
        }
        await query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [user.id]);
        return { id: user.id, email: user.email, kyc_level: user.kyc_level };
    },

    async createFacet(userId, { handle, displayName, facetType, bio }) {
        const conflict = await query('SELECT id FROM facets WHERE handle = $1', [handle]);
        if (conflict.rowCount > 0) {
            const err = new Error('Handle already taken');
            err.statusCode = 409;
            throw err;
        }
        const result = await query(
            `INSERT INTO facets (user_id, handle, display_name, facet_type, bio)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [userId, handle, displayName, facetType, bio || null]
        );
        return result.rows[0];
    },

    async listFacets(userId) {
        const result = await query(
            `SELECT id, handle, display_name, facet_type, avatar_url, bio, is_default, created_at
             FROM facets WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC`,
            [userId]
        );
        return result.rows;
    },

    async deleteAccount(userId) {
        // RGPD : soft delete + scheduling pour purge dure à J+30
        await query(
            `UPDATE users SET deleted_at = NOW(), email = CONCAT('deleted-', id, '@nexus.local')
             WHERE id = $1`,
            [userId]
        );
    },
};
