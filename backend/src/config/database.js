import pg from 'pg';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

export const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    max: config.db.max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected database error');
});

export async function connectDB() {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        logger.info('✅ PostgreSQL connected');
    } catch (err) {
        logger.error({ err }, 'Failed to connect to PostgreSQL');
        throw err;
    }
}

export async function query(text, params) {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 200) {
        logger.warn({ text, duration, rows: result.rowCount }, 'Slow query');
    }
    return result;
}

export async function transaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}
