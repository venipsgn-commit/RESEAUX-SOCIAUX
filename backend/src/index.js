import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { connectDB } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { registerRoutes } from './routes/index.js';

const app = Fastify({
    logger: logger,
    trustProxy: true,
    bodyLimit: 10 * 1024 * 1024,
});

async function bootstrap() {
    await app.register(helmet, { contentSecurityPolicy: false });
    await app.register(cors, {
        origin: config.cors.origins,
        credentials: true,
    });
    await app.register(rateLimit, {
        max: 1000,
        timeWindow: '1 minute',
        cache: 10000,
    });
    await app.register(jwt, {
        secret: config.jwt.secret,
        sign: { expiresIn: config.jwt.expiresIn },
    });

    app.decorate('authenticate', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (_) {
            reply.code(401).send({ error: 'Unauthorized' });
        }
    });

    await connectDB();
    await connectRedis();

    await registerRoutes(app);

    app.get('/health', async () => ({
        status: 'ok',
        service: 'nexus-api',
        timestamp: new Date().toISOString(),
    }));

    app.setErrorHandler((error, request, reply) => {
        request.log.error(error);
        const statusCode = error.statusCode || 500;
        reply.status(statusCode).send({
            error: error.name || 'InternalServerError',
            message: statusCode === 500 ? 'Internal server error' : error.message,
        });
    });

    try {
        await app.listen({ port: config.port, host: '0.0.0.0' });
        logger.info(`🚀 NEXUS API listening on port ${config.port}`);
    } catch (err) {
        logger.error(err);
        process.exit(1);
    }
}

process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await app.close();
    process.exit(0);
});

bootstrap();
