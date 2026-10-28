CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    departure_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON trips;
CREATE POLICY tenant_isolation_policy ON trips
    FOR ALL
    TO app_user
    USING (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END)
    WITH CHECK (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END);

GRANT SELECT, INSERT, UPDATE, DELETE ON trips TO app_user;

CREATE TABLE IF NOT EXISTS seat_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    seat_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'HELD', 'BOOKED')),
    held_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    held_until TIMESTAMPTZ,
    booked_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    booked_at TIMESTAMPTZ,
    CONSTRAINT uq_trip_seat UNIQUE (trip_id, seat_number)
);

ALTER TABLE seat_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_inventory FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON seat_inventory;
CREATE POLICY tenant_isolation_policy ON seat_inventory
    FOR ALL
    TO app_user
    USING (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END)
    WITH CHECK (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END);

GRANT SELECT, INSERT, UPDATE, DELETE ON seat_inventory TO app_user;

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seat_number TEXT NOT NULL,
    ticket_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
    qr_payload TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON bookings;
CREATE POLICY tenant_isolation_policy ON bookings
    FOR ALL
    TO app_user
    USING (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END)
    WITH CHECK (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END);

GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO app_user;

INSERT INTO trips (id, tenant_id, bus_id, route_id, departure_time, status)
VALUES
    ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333001', '77777777-7777-7777-7777-777777777001', NOW() + INTERVAL '45 minutes', 'SCHEDULED'),
    ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444001', '88888888-8888-8888-8888-888888888001', NOW() + INTERVAL '30 minutes', 'SCHEDULED'),
    ('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', '33333333-4444-4444-4444-000000000001', '33333333-7777-7777-7777-000000000001', NOW() + INTERVAL '20 minutes', 'SCHEDULED'),
    ('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-000000000001', '44444444-7777-7777-7777-000000000001', NOW() + INTERVAL '25 minutes', 'SCHEDULED'),
    ('a5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', '55555555-4444-4444-4444-000000000001', '55555555-7777-7777-7777-000000000001', NOW() + INTERVAL '15 minutes', 'SCHEDULED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO trips (id, tenant_id, bus_id, route_id, departure_time, status)
SELECT 
    gen_random_uuid(),
    b.tenant_id,
    b.id,
    (SELECT r.id FROM routes r WHERE r.tenant_id = b.tenant_id ORDER BY r.created_at ASC LIMIT 1),
    NOW() + INTERVAL '60 minutes',
    'SCHEDULED'
FROM buses b
WHERE b.id NOT IN ('33333333-3333-3333-3333-333333333001', '44444444-4444-4444-4444-444444444001', '33333333-4444-4444-4444-000000000001', '44444444-4444-4444-4444-000000000001', '55555555-4444-4444-4444-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO seat_inventory (tenant_id, trip_id, seat_number, status)
SELECT 
    t.tenant_id,
    t.id,
    row_num::text || seat_col,
    'AVAILABLE'
FROM trips t
CROSS JOIN generate_series(1, 10) AS row_num
CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D')) AS cols(seat_col)
ON CONFLICT (trip_id, seat_number) DO NOTHING;

UPDATE seat_inventory
SET status = 'BOOKED',
    booked_at = NOW() - INTERVAL '25 minutes'
WHERE trip_id IN (SELECT id FROM trips) AND seat_number IN ('1A', '2B', '3C');

UPDATE seat_inventory
SET status = 'HELD',
    held_until = NOW() + INTERVAL '10 minutes'
WHERE trip_id IN (SELECT id FROM trips) AND seat_number = '4D';

INSERT INTO bookings (id, tenant_id, trip_id, user_id, seat_number, ticket_code, status, qr_payload, created_at)
SELECT 
    gen_random_uuid(),
    t.tenant_id,
    t.id,
    (SELECT u.id FROM users u WHERE u.tenant_id = t.tenant_id AND u.role = 'RIDER' LIMIT 1),
    '1A',
    'TCK-' || UPPER(SUBSTRING(t.id::text FROM 1 FOR 6)) || '-1A',
    'CONFIRMED',
    'NEXTRANSIT://TICKET/' || t.id::text || '/1A/' || gen_random_uuid()::text,
    NOW() - INTERVAL '25 minutes'
FROM trips t
WHERE t.id IN (
    'a1111111-1111-1111-1111-111111111111',
    'a2222222-2222-2222-2222-222222222222',
    'a3333333-3333-3333-3333-333333333333',
    'a4444444-4444-4444-4444-444444444444',
    'a5555555-5555-5555-5555-555555555555'
)
ON CONFLICT (ticket_code) DO NOTHING;
