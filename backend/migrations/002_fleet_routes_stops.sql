CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fleet_code TEXT NOT NULL,
    plate_number TEXT NOT NULL,
    model TEXT NOT NULL,
    capacity INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    distance_km DOUBLE PRECISION NOT NULL,
    estimated_minutes INT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    stop_id UUID NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
    stop_sequence INT NOT NULL,
    eta_offset_minutes INT NOT NULL,
    CONSTRAINT uq_route_stops_route_stop UNIQUE (route_id, stop_id)
);

ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON buses;
CREATE POLICY tenant_isolation_policy ON buses
    FOR ALL
    TO app_user
    USING (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END)
    WITH CHECK (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END);

ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON stops;
CREATE POLICY tenant_isolation_policy ON stops
    FOR ALL
    TO app_user
    USING (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END)
    WITH CHECK (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON routes;
CREATE POLICY tenant_isolation_policy ON routes
    FOR ALL
    TO app_user
    USING (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END)
    WITH CHECK (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END);

ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON route_stops;
CREATE POLICY tenant_isolation_policy ON route_stops
    FOR ALL
    TO app_user
    USING (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END)
    WITH CHECK (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END);

GRANT SELECT, INSERT, UPDATE, DELETE ON buses TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON stops TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON routes TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON route_stops TO app_user;

INSERT INTO tenants (id, name, slug, status)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'IIIT Una Transport', 'iiit-una-transport', 'ACTIVE'),
    ('22222222-2222-2222-2222-222222222222', 'Himachal Express', 'himachal-express', 'ACTIVE')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

INSERT INTO users (id, tenant_id, email, role)
VALUES
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'admin@iiituna.ac.in', 'OPERATOR_ADMIN'),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'driver.ramesh@iiituna.ac.in', 'DRIVER'),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'student.aarav@iiituna.ac.in', 'RIDER'),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'ops@himachalexpress.in', 'OPERATOR_ADMIN'),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'driver.vikram@himachalexpress.in', 'DRIVER'),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'passenger.priya@himachalexpress.in', 'RIDER')
ON CONFLICT (tenant_id, email) DO NOTHING;

INSERT INTO buses (id, tenant_id, fleet_code, plate_number, model, capacity, status)
VALUES
    ('33333333-3333-3333-3333-333333333001', '11111111-1111-1111-1111-111111111111', 'UNA-BUS-01', 'HP-72-A-1001', 'Tata Starbus Ultra', 42, 'ACTIVE'),
    ('33333333-3333-3333-3333-333333333002', '11111111-1111-1111-1111-111111111111', 'UNA-BUS-02', 'HP-72-A-1002', 'Ashok Leyland Oyster', 34, 'ACTIVE'),
    ('33333333-3333-3333-3333-333333333003', '11111111-1111-1111-1111-111111111111', 'UNA-BUS-03', 'HP-72-B-2005', 'Force Traveller Monobus', 26, 'MAINTENANCE'),
    ('44444444-4444-4444-4444-444444444001', '22222222-2222-2222-2222-222222222222', 'HMX-EXP-101', 'HP-01-C-4589', 'Volvo B11R Multi-Axle', 53, 'ACTIVE'),
    ('44444444-4444-4444-4444-444444444002', '22222222-2222-2222-2222-222222222222', 'HMX-EXP-102', 'HP-01-C-4590', 'Scania Metrolink HD', 49, 'ACTIVE'),
    ('44444444-4444-4444-4444-444444444003', '22222222-2222-2222-2222-222222222222', 'HMX-EXP-103', 'HP-03-D-7721', 'BharatBenz 1624', 45, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO stops (id, tenant_id, name, code, latitude, longitude, location)
VALUES
    ('55555555-5555-5555-5555-555555555001', '11111111-1111-1111-1111-111111111111', 'IIIT Una Campus Stop', 'UNA-ST-01', 31.4812, 76.1918, ST_SetSRID(ST_MakePoint(76.1918, 31.4812), 4326)::geography),
    ('55555555-5555-5555-5555-555555555002', '11111111-1111-1111-1111-111111111111', 'Saloh Crossing', 'UNA-ST-02', 31.4725, 76.2134, ST_SetSRID(ST_MakePoint(76.2134, 31.4725), 4326)::geography),
    ('55555555-5555-5555-5555-555555555003', '11111111-1111-1111-1111-111111111111', 'Una Railway Terminal', 'UNA-ST-03', 31.4641, 76.2709, ST_SetSRID(ST_MakePoint(76.2709, 31.4641), 4326)::geography),
    ('55555555-5555-5555-5555-555555555004', '11111111-1111-1111-1111-111111111111', 'Mehatpur Border Hub', 'UNA-ST-04', 31.4289, 76.3150, ST_SetSRID(ST_MakePoint(76.3150, 31.4289), 4326)::geography),
    ('66666666-6666-6666-6666-666666666001', '22222222-2222-2222-2222-222222222222', 'Shimla ISBT Tutikandi', 'HMX-ST-01', 31.0966, 77.1534, ST_SetSRID(ST_MakePoint(77.1534, 31.0966), 4326)::geography),
    ('66666666-6666-6666-6666-666666666002', '22222222-2222-2222-2222-222222222222', 'Solan Bypass Junction', 'HMX-ST-02', 30.9084, 77.0999, ST_SetSRID(ST_MakePoint(77.0999, 30.9084), 4326)::geography),
    ('66666666-6666-6666-6666-666666666003', '22222222-2222-2222-2222-222222222222', 'Dharampur Station', 'HMX-ST-03', 30.9042, 76.9822, ST_SetSRID(ST_MakePoint(76.9822, 30.9042), 4326)::geography),
    ('66666666-6666-6666-6666-666666666004', '22222222-2222-2222-2222-222222222222', 'Chandigarh Sector 43 ISBT', 'HMX-ST-04', 30.7224, 76.7441, ST_SetSRID(ST_MakePoint(76.7441, 30.7224), 4326)::geography)
ON CONFLICT (id) DO NOTHING;

INSERT INTO routes (id, tenant_id, name, code, origin, destination, distance_km, estimated_minutes, active)
VALUES
    ('77777777-7777-7777-7777-777777777001', '11111111-1111-1111-1111-111111111111', 'Campus - Rail Corridor Express', 'UNA-R01', 'IIIT Una Campus', 'Una Railway Terminal', 14.2, 28, true),
    ('77777777-7777-7777-7777-777777777002', '11111111-1111-1111-1111-111111111111', 'Una Central - Mehatpur Feeder', 'UNA-R02', 'Una Railway Terminal', 'Mehatpur Border Hub', 11.8, 22, true),
    ('88888888-8888-8888-8888-888888888001', '22222222-2222-2222-2222-222222222222', 'Shimla - Chandigarh Highway Superfast', 'HMX-R10', 'Shimla ISBT Tutikandi', 'Chandigarh Sector 43 ISBT', 112.5, 210, true),
    ('88888888-8888-8888-8888-888888888002', '22222222-2222-2222-2222-222222222222', 'Solan Mountain Shuttle', 'HMX-R20', 'Solan Bypass Junction', 'Dharampur Station', 18.6, 40, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO route_stops (id, tenant_id, route_id, stop_id, stop_sequence, eta_offset_minutes)
VALUES
    ('99999999-9999-9999-9999-999999999001', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777001', '55555555-5555-5555-5555-555555555001', 1, 0),
    ('99999999-9999-9999-9999-999999999002', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777001', '55555555-5555-5555-5555-555555555002', 2, 10),
    ('99999999-9999-9999-9999-999999999003', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777001', '55555555-5555-5555-5555-555555555003', 3, 28)
ON CONFLICT (id) DO NOTHING;
