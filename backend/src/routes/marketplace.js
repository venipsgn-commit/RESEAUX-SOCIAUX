import { z } from 'zod';
import { query, transaction } from '../config/database.js';
import { config } from '../config/index.js';
import { WalletService } from '../services/wallet.service.js';

const ListingSchema = z.object({
    sellerFacetId: z.string().uuid(),
    title: z.string().min(3).max(140),
    description: z.string().max(5000).optional(),
    priceCents: z.number().int().positive(),
    currency: z.string().length(3).default('EUR'),
    category: z.string().min(1).max(80),
    condition: z.enum(['new', 'used', 'service']).optional(),
    mediaUrls: z.array(z.string().url()).max(15).optional(),
    location: z.any().optional(),
});

export async function marketplaceRoutes(app) {
    app.get('/listings', async (request) => {
        const Query = z.object({
            category: z.string().optional(),
            limit: z.coerce.number().int().min(1).max(100).default(30),
            offset: z.coerce.number().int().min(0).default(0),
        });
        const q = Query.parse(request.query);

        const params = [q.limit, q.offset];
        let where = `status = 'active'`;
        if (q.category) {
            params.push(q.category);
            where += ` AND category = $${params.length}`;
        }
        const result = await query(
            `SELECT id, title, description, price_cents, currency, category,
                    condition, media_urls, location, created_at
             FROM marketplace_listings
             WHERE ${where}
             ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
            params
        );
        return { items: result.rows };
    });

    app.post('/listings', { preHandler: [app.authenticate] }, async (request, reply) => {
        const data = ListingSchema.parse(request.body);
        const result = await query(
            `INSERT INTO marketplace_listings
             (seller_facet_id, title, description, price_cents, currency, category, condition, media_urls, location)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                data.sellerFacetId, data.title, data.description || null, data.priceCents,
                data.currency, data.category, data.condition || null,
                data.mediaUrls || [], data.location || null,
            ]
        );
        reply.code(201).send(result.rows[0]);
    });

    app.post('/listings/:id/buy', { preHandler: [app.authenticate] }, async (request, reply) => {
        const listingId = request.params.id;
        const order = await transaction(async (client) => {
            const listingRes = await client.query(
                `SELECT l.*, f.user_id AS seller_user_id
                 FROM marketplace_listings l
                 JOIN facets f ON f.id = l.seller_facet_id
                 WHERE l.id = $1 AND l.status = 'active' FOR UPDATE`,
                [listingId]
            );
            const listing = listingRes.rows[0];
            if (!listing) {
                const err = new Error('Listing not available');
                err.statusCode = 404;
                throw err;
            }
            if (listing.seller_user_id === request.user.userId) {
                const err = new Error('Cannot buy your own listing');
                err.statusCode = 400;
                throw err;
            }

            const commission = Math.round(listing.price_cents * config.economy.marketplaceCommission);

            const orderRes = await client.query(
                `INSERT INTO marketplace_orders
                 (listing_id, buyer_user_id, seller_user_id, amount_cents, commission_cents, status)
                 VALUES ($1, $2, $3, $4, $5, 'paid') RETURNING *`,
                [listingId, request.user.userId, listing.seller_user_id, listing.price_cents, commission]
            );

            await client.query(
                `UPDATE marketplace_listings SET status = 'sold' WHERE id = $1`,
                [listingId]
            );
            return orderRes.rows[0];
        });

        // Hors transaction : débit acheteur, crédit vendeur (après commission)
        await WalletService.debit(request.user.userId, order.amount_cents, {
            type: 'marketplace',
            referenceId: order.id,
            description: `Achat marketplace`,
        });
        await WalletService.credit(order.seller_user_id, order.amount_cents - order.commission_cents, {
            type: 'marketplace',
            referenceId: order.id,
            description: `Vente marketplace (après commission)`,
        });

        reply.code(201).send(order);
    });
}
