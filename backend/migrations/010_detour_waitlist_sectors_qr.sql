ALTER TABLE tenants ADD COLUMN IF NOT EXISTS sector_type VARCHAR(40) NOT NULL DEFAULT 'UNIVERSITY_CAMPUS';

ALTER TABLE buses ADD COLUMN IF NOT EXISTS is_detour BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS detour_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE buses ADD COLUMN IF NOT EXISTS detour_lat DOUBLE PRECISION;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS detour_lng DOUBLE PRECISION;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS bypassed_stop_sequences INTEGER[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS seat_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL,
    route_id UUID NOT NULL,
    rider_name VARCHAR(120) NOT NULL,
    rider_email VARCHAR(150) NOT NULL,
    preferred_seat VARCHAR(10),
    boarding_stop_id UUID,
    status VARCHAR(30) NOT NULL DEFAULT 'WAITING',
    promoted_seat VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE seat_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_waitlist FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON seat_waitlist;
CREATE POLICY tenant_isolation_policy ON seat_waitlist
    FOR ALL
    TO app_user
    USING (
        CASE
            WHEN (current_setting('app.current_tenant', true) = 'SUPER_ADMIN') THEN true
            ELSE (tenant_id = (NULLIF(current_setting('app.current_tenant', true), ''))::uuid)
        END
    )
    WITH CHECK (
        CASE
            WHEN (current_setting('app.current_tenant', true) = 'SUPER_ADMIN') THEN true
            ELSE (tenant_id = (NULLIF(current_setting('app.current_tenant', true), ''))::uuid)
        END
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON seat_waitlist TO app_user;

ALTER TABLE seat_inventory ADD COLUMN IF NOT EXISTS qr_token TEXT;
ALTER TABLE seat_inventory ADD COLUMN IF NOT EXISTS checked_in BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE seat_inventory ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS detour_geometry JSONB;
ALTER TABLE transit_events DROP CONSTRAINT IF EXISTS transit_events_event_type_check;
