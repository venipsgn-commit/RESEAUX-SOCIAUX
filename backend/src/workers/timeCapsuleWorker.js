// Worker — révèle les Time-Capsules dont la date est arrivée
// À exécuter via cron/k8s CronJob toutes les minutes

import { PostService } from '../services/post.service.js';
import { logger } from '../utils/logger.js';

async function tick() {
    try {
        const revealed = await PostService.revealCapsules();
        if (revealed > 0) {
            logger.info({ revealed }, '⏳ Time-capsules revealed');
        }
    } catch (err) {
        logger.error({ err }, 'TimeCapsule worker tick failed');
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    setInterval(tick, 60_000);
    tick();
}

export { tick };
