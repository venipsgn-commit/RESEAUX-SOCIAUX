// Calcul de l'empreinte carbone d'une action sur NEXUS
// Sources : The Shift Project, Carbonalyser, recherches universitaires

const CARBON_COSTS_GRAMS = {
    text_post: 0.2,
    image_post: 2.5,         // par image moyenne 200KB
    video_minute: 11,        // par minute de vidéo streamée
    audio_minute: 1.2,
    ar_session_minute: 8,
    feed_scroll_minute: 0.5,
    message: 0.1,
    search_query: 0.3,
};

export function carbonCostPost({ hasText, imageCount = 0, videoSeconds = 0, audioSeconds = 0, arSeconds = 0 }) {
    let grams = 0;
    if (hasText) grams += CARBON_COSTS_GRAMS.text_post;
    grams += imageCount * CARBON_COSTS_GRAMS.image_post;
    grams += (videoSeconds / 60) * CARBON_COSTS_GRAMS.video_minute;
    grams += (audioSeconds / 60) * CARBON_COSTS_GRAMS.audio_minute;
    grams += (arSeconds / 60) * CARBON_COSTS_GRAMS.ar_session_minute;
    return Math.round(grams * 100) / 100;
}

export function carbonEquivalent(grams) {
    if (grams < 10) return `${grams.toFixed(1)} g CO₂eq`;
    if (grams < 1000) return `${grams.toFixed(0)} g CO₂eq`;
    return `${(grams / 1000).toFixed(2)} kg CO₂eq`;
}
