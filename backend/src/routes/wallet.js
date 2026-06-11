import { z } from 'zod';
import { WalletService } from '../services/wallet.service.js';

export async function walletRoutes(app) {
    app.addHook('preHandler', app.authenticate);

    app.get('/', async (request) => {
        return WalletService.get(request.user.userId);
    });

    app.get('/transactions', async (request) => {
        const Query = z.object({
            limit: z.coerce.number().int().min(1).max(200).default(50),
            offset: z.coerce.number().int().min(0).default(0),
            type: z.string().optional(),
        });
        const q = Query.parse(request.query);
        return WalletService.listTransactions(request.user.userId, q);
    });

    app.post('/payout', async (request, reply) => {
        const Body = z.object({ amountCents: z.number().int().positive() });
        const data = Body.parse(request.body);
        const result = await WalletService.requestPayout(request.user.userId, data.amountCents);
        reply.send(result);
    });
}
