import 'dotenv/config';

export const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000', 10),
    cors: {
        origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'nexus',
        password: process.env.DB_PASSWORD || 'nexus_dev',
        database: process.env.DB_NAME || 'nexus',
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    kafka: {
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        clientId: 'nexus-api',
    },
    economy: {
        adShareUserPct: 0.70,
        adShareNexusPct: 0.30,
        marketplaceCommission: 0.10,
        tokenCommission: 0.02,
        premiumPriceCents: 499,
    },
    crisis: {
        scoreThresholdAlert: 0.6,
        scoreThresholdEscalate: 0.85,
    },
    vraieVie: {
        defaultDailyLimitMinutes: 30,
        creationCreditsPerMinute: 5,
    },
};
