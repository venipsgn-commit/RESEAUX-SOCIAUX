import Redis from 'ioredis';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

export const redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
});

redis.on('error', (err) => {
    logger.error({ err }, 'Redis error');
});

export async function connectRedis() {
    try {
        await redis.connect();
        await redis.ping();
        logger.info('✅ Redis connected');
    } catch (err) {
        logger.warn({ err }, 'Redis unavailable (continuing without cache)');
    }
}

export async function cached(key, ttlSec, fetcher) {
    try {
        const cached = await redis.get(key);
        if (cached) return JSON.parse(cached);
    } catch (_) {}
    const value = await fetcher();
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
    } catch (_) {}
    return value;
}

export async function invalidate(pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
}
