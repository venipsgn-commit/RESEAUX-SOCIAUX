-- =====================================================================
-- NEXUS — Schéma initial de base de données
-- PostgreSQL 16, conçu pour sharding par user_id (Citus)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================================
-- USERS & IDENTITÉS FRAGMENTÉES
-- =====================================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT UNIQUE NOT NULL,
    phone           TEXT UNIQUE,
    password_hash   TEXT NOT NULL,
    kyc_level       SMALLINT DEFAULT 0,         -- 0 = none, 1 = email, 2 = ID, 3 = video
    locale          TEXT DEFAULT 'fr-FR',
    country         CHAR(2),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,                -- soft delete (RGPD)
    last_seen_at    TIMESTAMPTZ DEFAULT NOW(),
    mfa_enabled     BOOLEAN DEFAULT FALSE,
    flags           JSONB DEFAULT '{}'::jsonb   -- crisis_flag, banned, verified, ...
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_country ON users(country);

-- Facets = identités fragmentées (pro, perso, créatif, anonyme...)
CREATE TABLE facets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    handle          TEXT UNIQUE NOT NULL,        -- @marie_pro, @marie_artiste, ...
    display_name    TEXT NOT NULL,
    facet_type      TEXT NOT NULL,               -- 'pro' | 'perso' | 'creative' | 'anon'
    avatar_url      TEXT,
    bio             TEXT,
    public_key      TEXT,                        -- crypto par facette
    is_default      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_default_facet UNIQUE (user_id, is_default) DEFERRABLE
);

CREATE INDEX idx_facets_user ON facets(user_id);
CREATE INDEX idx_facets_handle_trgm ON facets USING gin (handle gin_trgm_ops);

-- =====================================================================
-- CERCLES CONCENTRIQUES (au lieu d'amis "plats")
-- =====================================================================

CREATE TABLE circles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_facet_id  UUID NOT NULL REFERENCES facets(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    level           SMALLINT NOT NULL,           -- 1=intime, 2=proches, 3=amis, 4=connaissances, 5=public
    color           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE circle_members (
    circle_id       UUID REFERENCES circles(id) ON DELETE CASCADE,
    member_facet_id UUID REFERENCES facets(id) ON DELETE CASCADE,
    added_at        TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (circle_id, member_facet_id)
);

CREATE INDEX idx_circle_members_facet ON circle_members(member_facet_id);

-- =====================================================================
-- POSTS (avec Time-Capsule + Carbon-Cost)
-- =====================================================================

CREATE TABLE posts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_facet_id UUID NOT NULL REFERENCES facets(id) ON DELETE CASCADE,
    content         TEXT,
    media_urls      TEXT[],
    audio_spatial   JSONB,                       -- coordonnées 3D audio
    ar_assets       JSONB,                       -- assets AR
    visibility      SMALLINT DEFAULT 5,          -- min circle level visible
    time_capsule_at TIMESTAMPTZ,                 -- post révélé à cette date
    is_revealed     BOOLEAN DEFAULT TRUE,
    carbon_cost_g   INTEGER DEFAULT 0,           -- coût carbone en grammes CO2eq
    token_id        UUID,                        -- si tokenisé
    language        TEXT,
    geo_lat         DOUBLE PRECISION,
    geo_lon         DOUBLE PRECISION,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_posts_author ON posts(author_facet_id, created_at DESC);
CREATE INDEX idx_posts_capsule ON posts(time_capsule_at) WHERE is_revealed = FALSE;
CREATE INDEX idx_posts_visibility ON posts(visibility, created_at DESC);

-- Interactions
CREATE TABLE post_reactions (
    post_id         UUID REFERENCES posts(id) ON DELETE CASCADE,
    facet_id        UUID REFERENCES facets(id) ON DELETE CASCADE,
    reaction_type   TEXT NOT NULL,               -- 'like' | 'love' | 'support' | 'think' | 'celebrate'
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, facet_id, reaction_type)
);

CREATE TABLE post_comments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id         UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_facet_id UUID REFERENCES facets(id) ON DELETE CASCADE,
    parent_id       UUID REFERENCES post_comments(id),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_comments_post ON post_comments(post_id, created_at);

-- =====================================================================
-- WALLET (économie inversée) — double-entry accounting
-- =====================================================================

CREATE TABLE wallets (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance_cents   BIGINT DEFAULT 0,            -- en centimes EUR
    pending_cents   BIGINT DEFAULT 0,
    currency        CHAR(3) DEFAULT 'EUR',
    payout_method   JSONB,                       -- IBAN, PayPal, crypto, ...
    tax_country     CHAR(2),
    tax_id          TEXT,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wallet_transactions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id),
    amount_cents    BIGINT NOT NULL,             -- positif = credit, négatif = debit
    type            TEXT NOT NULL,               -- 'ad_share' | 'marketplace' | 'tip' | 'premium' | 'payout' | 'token'
    reference_id    UUID,                        -- id de la transaction d'origine
    description     TEXT,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_txns_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX idx_wallet_txns_type ON wallet_transactions(type, created_at DESC);

-- =====================================================================
-- MARKETPLACE P2P
-- =====================================================================

CREATE TABLE marketplace_listings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_facet_id UUID NOT NULL REFERENCES facets(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    price_cents     BIGINT NOT NULL,
    currency        CHAR(3) DEFAULT 'EUR',
    category        TEXT NOT NULL,
    condition       TEXT,                        -- 'new' | 'used' | 'service'
    media_urls      TEXT[],
    location        JSONB,
    status          TEXT DEFAULT 'active',       -- 'active' | 'sold' | 'paused' | 'removed'
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_status ON marketplace_listings(status, created_at DESC);
CREATE INDEX idx_listings_category ON marketplace_listings(category, status);

CREATE TABLE marketplace_orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id      UUID REFERENCES marketplace_listings(id),
    buyer_user_id   UUID REFERENCES users(id),
    seller_user_id  UUID REFERENCES users(id),
    amount_cents    BIGINT NOT NULL,
    commission_cents BIGINT NOT NULL,
    status          TEXT DEFAULT 'pending',      -- 'pending' | 'paid' | 'shipped' | 'delivered' | 'disputed' | 'refunded'
    escrow_released BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TOKENISATION DES CRÉATEURS
-- =====================================================================

CREATE TABLE creator_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_facet_id UUID UNIQUE REFERENCES facets(id) ON DELETE CASCADE,
    symbol          TEXT UNIQUE NOT NULL,        -- '$MARIE'
    total_supply    BIGINT NOT NULL,
    circulating     BIGINT DEFAULT 0,
    contract_addr   TEXT,                        -- adresse on-chain
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE token_holdings (
    token_id        UUID REFERENCES creator_tokens(id) ON DELETE CASCADE,
    holder_user_id  UUID REFERENCES users(id) ON DELETE CASCADE,
    quantity        BIGINT NOT NULL,
    PRIMARY KEY (token_id, holder_user_id)
);

-- =====================================================================
-- CRISIS DETECTION
-- =====================================================================

CREATE TABLE crisis_alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score           REAL NOT NULL,               -- 0.0 - 1.0
    indicators      JSONB,                       -- mots-clés, patterns, ...
    status          TEXT DEFAULT 'detected',     -- detected | reviewed | escalated | resolved | false_positive
    assigned_to     UUID,                        -- staff humain
    resolution_notes TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_crisis_status ON crisis_alerts(status, created_at);

-- =====================================================================
-- MESSAGERIE E2E (métadonnées seulement)
-- =====================================================================

CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type            TEXT NOT NULL,               -- 'direct' | 'group'
    name            TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_members (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    facet_id        UUID REFERENCES facets(id) ON DELETE CASCADE,
    role            TEXT DEFAULT 'member',       -- 'admin' | 'member'
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, facet_id)
);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_facet_id UUID REFERENCES facets(id) ON DELETE CASCADE,
    ciphertext      BYTEA NOT NULL,              -- contenu chiffré E2E
    nonce           BYTEA NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at);

-- =====================================================================
-- ADS (publicité éthique, opt-in)
-- =====================================================================

CREATE TABLE ad_campaigns (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_id   UUID REFERENCES users(id),
    title           TEXT NOT NULL,
    content         JSONB,
    target_interests TEXT[],
    budget_cents    BIGINT NOT NULL,
    spent_cents     BIGINT DEFAULT 0,
    cpm_cents       INTEGER NOT NULL,
    status          TEXT DEFAULT 'pending',      -- pending | active | paused | finished
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ad_impressions (
    id              BIGSERIAL PRIMARY KEY,
    campaign_id     UUID REFERENCES ad_campaigns(id),
    user_id         UUID REFERENCES users(id),
    user_share_cents INTEGER NOT NULL,            -- 70% versé à l'user
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_impressions_user ON ad_impressions(user_id, created_at DESC);
CREATE INDEX idx_impressions_campaign ON ad_impressions(campaign_id);

-- =====================================================================
-- USAGE TRACKING (Mode Vraie Vie)
-- =====================================================================

CREATE TABLE usage_sessions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id),
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    duration_seconds INTEGER,
    creation_credits_earned INTEGER DEFAULT 0
);

CREATE INDEX idx_usage_user_day ON usage_sessions(user_id, started_at);
