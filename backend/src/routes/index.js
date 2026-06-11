import { authRoutes } from './auth.js';
import { userRoutes } from './users.js';
import { postRoutes } from './posts.js';
import { feedRoutes } from './feed.js';
import { walletRoutes } from './wallet.js';
import { marketplaceRoutes } from './marketplace.js';
import { circleRoutes } from './circles.js';
import { crisisRoutes } from './crisis.js';

export async function registerRoutes(app) {
    await app.register(authRoutes, { prefix: '/api/v1/auth' });
    await app.register(userRoutes, { prefix: '/api/v1/users' });
    await app.register(postRoutes, { prefix: '/api/v1/posts' });
    await app.register(feedRoutes, { prefix: '/api/v1/feed' });
    await app.register(walletRoutes, { prefix: '/api/v1/wallet' });
    await app.register(marketplaceRoutes, { prefix: '/api/v1/marketplace' });
    await app.register(circleRoutes, { prefix: '/api/v1/circles' });
    await app.register(crisisRoutes, { prefix: '/api/v1/crisis' });
}
