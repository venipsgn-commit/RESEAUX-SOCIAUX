import { query, transaction } from '../config/database.js';
import { config } from '../config/index.js';

// Wallet — économie inversée. Double-entry accounting strict.
export const WalletService = {
    async get(userId) {
        const result = await query(
            `SELECT user_id, balance_cents, pending_cents, currency, tax_country, updated_at
             FROM wallets WHERE user_id = $1`,
            [userId]
        );
        return result.rows[0];
    },

    async listTransactions(userId, { limit = 50, offset = 0, type } = {}) {
        const params = [userId, limit, offset];
        let where = 'user_id = $1';
        if (type) {
            params.push(type);
            where += ` AND type = $${params.length}`;
        }
        const result = await query(
            `SELECT id, amount_cents, type, reference_id, description, metadata, created_at
             FROM wallet_transactions
             WHERE ${where}
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            params
        );
        return result.rows;
    },

    async credit(userId, amountCents, { type, referenceId, description, metadata }) {
        if (amountCents <= 0) throw new Error('Credit amount must be positive');
        return transaction(async (client) => {
            await client.query(
                `UPDATE wallets SET balance_cents = balance_cents + $1, updated_at = NOW()
                 WHERE user_id = $2`,
                [amountCents, userId]
            );
            const txn = await client.query(
                `INSERT INTO wallet_transactions
                 (user_id, amount_cents, type, reference_id, description, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [userId, amountCents, type, referenceId || null, description || null, metadata || {}]
            );
            return txn.rows[0];
        });
    },

    async debit(userId, amountCents, { type, referenceId, description, metadata }) {
        if (amountCents <= 0) throw new Error('Debit amount must be positive');
        return transaction(async (client) => {
            const w = await client.query(
                `SELECT balance_cents FROM wallets WHERE user_id = $1 FOR UPDATE`,
                [userId]
            );
            if (!w.rows[0] || w.rows[0].balance_cents < amountCents) {
                const err = new Error('Insufficient funds');
                err.statusCode = 402;
                throw err;
            }
            await client.query(
                `UPDATE wallets SET balance_cents = balance_cents - $1, updated_at = NOW()
                 WHERE user_id = $2`,
                [amountCents, userId]
            );
            const txn = await client.query(
                `INSERT INTO wallet_transactions
                 (user_id, amount_cents, type, reference_id, description, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [userId, -amountCents, type, referenceId || null, description || null, metadata || {}]
            );
            return txn.rows[0];
        });
    },

    // Crédit utilisateur lors d'une impression publicitaire (70% du CPM par impression)
    async adImpressionShare(userId, campaignId, cpmCents) {
        const userShareCents = Math.round((cpmCents / 1000) * config.economy.adShareUserPct);
        if (userShareCents <= 0) return null;
        return this.credit(userId, userShareCents, {
            type: 'ad_share',
            referenceId: campaignId,
            description: `Ad revenue share (70%)`,
            metadata: { campaignId, cpmCents },
        });
    },

    // Payout — déclenche un virement bancaire
    async requestPayout(userId, amountCents) {
        const wallet = await this.get(userId);
        if (!wallet || wallet.balance_cents < amountCents) {
            const err = new Error('Insufficient funds for payout');
            err.statusCode = 402;
            throw err;
        }
        await this.debit(userId, amountCents, {
            type: 'payout',
            description: 'Bank payout request',
        });
        // En prod : déclencher un job Kafka -> bank-transfer-worker (SEPA, ACH, ...)
        return { status: 'pending', amountCents };
    },
};
