import { query } from '../config/database.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Détection de signaux de détresse psychologique
// (multilingue, basée sur lexiques + sera étendue avec un modèle ML en prod)
const DISTRESS_LEXICON = {
    fr: [
        'envie de mourir', 'me suicider', 'suicide', 'en finir', 'plus envie de vivre',
        'personne ne me comprend', 'je suis seul', 'à quoi bon', 'je veux disparaitre',
        'je n\'en peux plus', 'rien ne va', 'je vais craquer',
    ],
    en: [
        'want to die', 'kill myself', 'suicide', 'end it all', 'no reason to live',
        'nobody understands', 'i\'m alone', 'what\'s the point', 'disappear',
        'can\'t take it anymore', 'i give up',
    ],
};

const URGENT_PATTERNS = [
    /\b(ce soir|tonight|maintenant|now)\b.{0,40}\b(mourir|die|suicide|en finir|end it)\b/i,
    /\b(plan|methode|method)\b.{0,40}\b(suicide|mourir|die)\b/i,
];

function scoreContent(text) {
    const lower = text.toLowerCase();
    let hits = 0;
    let lexHits = [];
    for (const lang of Object.values(DISTRESS_LEXICON)) {
        for (const phrase of lang) {
            if (lower.includes(phrase)) {
                hits++;
                lexHits.push(phrase);
            }
        }
    }
    let score = Math.min(0.4 + hits * 0.15, 0.85);

    for (const pattern of URGENT_PATTERNS) {
        if (pattern.test(text)) {
            score = Math.max(score, 0.95);
            lexHits.push('urgent_pattern');
            break;
        }
    }
    return { score, hits: lexHits };
}

export const CrisisService = {
    async analyzeContent(userId, content) {
        if (!content || content.length < 5) return null;
        const { score, hits } = scoreContent(content);

        if (score < config.crisis.scoreThresholdAlert) return null;

        const result = await query(
            `INSERT INTO crisis_alerts (user_id, score, indicators, status)
             VALUES ($1, $2, $3, $4)
             RETURNING id, status`,
            [
                userId,
                score,
                JSON.stringify({ keywords: hits, source: 'post_content' }),
                score >= config.crisis.scoreThresholdEscalate ? 'escalated' : 'detected',
            ]
        );

        logger.warn({ userId, score, status: result.rows[0].status }, 'Crisis alert created');

        // En production : déclencher notification vers staff humain + ressources d'aide
        return result.rows[0];
    },

    async listOpen() {
        const result = await query(
            `SELECT * FROM crisis_alerts
             WHERE status IN ('detected', 'escalated') AND assigned_to IS NULL
             ORDER BY score DESC, created_at ASC LIMIT 100`
        );
        return result.rows;
    },

    async resolve(alertId, staffUserId, notes, status = 'resolved') {
        await query(
            `UPDATE crisis_alerts
             SET status = $1, assigned_to = $2, resolution_notes = $3, resolved_at = NOW()
             WHERE id = $4`,
            [status, staffUserId, notes, alertId]
        );
    },
};
