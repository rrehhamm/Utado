-- Badges themselves are computed live from existing data (see users/badges.ts),
-- not stored. This table only tracks, per user, the first time we noticed a
-- badge had been earned and whether that's been shown to them yet - it's a
-- notification log, not the source of truth for whether a badge is earned.
CREATE TABLE user_badge_notifications (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_slug VARCHAR(50) NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    seen_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, badge_slug)
);

CREATE INDEX idx_user_badge_notifications_unseen ON user_badge_notifications(user_id) WHERE seen_at IS NULL;
