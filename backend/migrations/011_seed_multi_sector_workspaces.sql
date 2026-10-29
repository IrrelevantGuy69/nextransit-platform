ALTER TABLE buses ADD COLUMN IF NOT EXISTS detour_geometry JSONB;

UPDATE tenants
SET sector_type = 'UNIVERSITY_CAMPUS'
WHERE id = '11111111-1111-1111-1111-111111111111';

INSERT INTO tenants (id, name, slug, status, sector_type)
VALUES
    ('66666666-6666-6666-6666-666666666666', 'Apex Tech Park Express', 'apex-tech-park', 'ACTIVE', 'CORPORATE_SHUTTLE'),
    ('77777777-7777-7777-7777-777777777777', 'Himalayan Alpine Charter', 'himalayan-alpine', 'ACTIVE', 'PRIVATE_CHARTER')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    status = EXCLUDED.status,
    sector_type = EXCLUDED.sector_type;

INSERT INTO users (id, tenant_id, email, role, full_name, password_hash)
VALUES
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'admin@apextech.com', 'OPERATOR_ADMIN', 'Priya Nair (Corporate Transit Manager)', '$2a$10$8D8pRvo6lxhZoJbQse51eOi6ykZwVQtoUPqblPgT3InSUyeZHZx3m'),
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'driver@apextech.com', 'DRIVER', 'David Chen (Executive Fleet Captain)', '$2a$10$6rt1FZ9Krlw6c6WXbEGRg.wG.0As9/gKCb6r3znyJq0aWjXFHz6AW'),
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'employee@apextech.com', 'RIDER', 'Marcus Vance (Staff Systems Engineer)', '$2a$10$iaTcz7YGeZ3atHmJ0zouDOi2cag/ELuNuySd/eILBLZdi1./5H/7u'),

    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'admin@himalayancharter.com', 'OPERATOR_ADMIN', 'Tenzing Norbu (Expedition Operations Chief)', '$2a$10$8D8pRvo6lxhZoJbQse51eOi6ykZwVQtoUPqblPgT3InSUyeZHZx3m'),
    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'driver@himalayancharter.com', 'DRIVER', 'Dorje Lama (Master Alpine Driver)', '$2a$10$6rt1FZ9Krlw6c6WXbEGRg.wG.0As9/gKCb6r3znyJq0aWjXFHz6AW'),
    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'guest@himalayancharter.com', 'RIDER', 'Elena Rostova (Charter Passenger)', '$2a$10$iaTcz7YGeZ3atHmJ0zouDOi2cag/ELuNuySd/eILBLZdi1./5H/7u')
ON CONFLICT (tenant_id, email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name;

INSERT INTO stops (id, tenant_id, name, code, latitude, longitude, location)
VALUES
    ('66666666-0001-0001-0000-000000000001', '66666666-6666-6666-6666-666666666666', 'Tech Park Gate 1 (North Concourse)', 'APEX-G1', 3.1310, 101.6850, ST_SetSRID(ST_MakePoint(101.6850, 3.1310), 4326)::geography),
    ('66666666-0001-0001-0000-000000000002', '66666666-6666-6666-6666-666666666666', 'Tower Alpha R&D Center', 'APEX-T1', 3.1360, 101.6880, ST_SetSRID(ST_MakePoint(101.6880, 3.1360), 4326)::geography),
    ('66666666-0001-0001-0000-000000000003', '66666666-6666-6666-6666-666666666666', 'Innovation Hub Plaza', 'APEX-IH', 3.1410, 101.6910, ST_SetSRID(ST_MakePoint(101.6910, 3.1410), 4326)::geography),
    ('66666666-0001-0001-0000-000000000004', '66666666-6666-6666-6666-666666666666', 'South Gate Metro Interchange', 'APEX-SG', 3.1460, 101.6940, ST_SetSRID(ST_MakePoint(101.6940, 3.1460), 4326)::geography),

    ('77777777-0001-0001-0000-000000000001', '77777777-7777-7777-7777-777777777777', 'Alpine Base Camp Terminal', 'HAC-BC', 32.2396, 77.1887, ST_SetSRID(ST_MakePoint(77.1887, 32.2396), 4326)::geography),
    ('77777777-0001-0001-0000-000000000002', '77777777-7777-7777-7777-777777777777', 'Valley Viewpoint Lodge', 'HAC-VV', 32.2510, 77.1950, ST_SetSRID(ST_MakePoint(77.1950, 32.2510), 4326)::geography),
    ('77777777-0001-0001-0000-000000000003', '77777777-7777-7777-7777-777777777777', 'Glacier Pass Station', 'HAC-GP', 32.2680, 77.2050, ST_SetSRID(ST_MakePoint(77.2050, 32.2680), 4326)::geography),
    ('77777777-0001-0001-0000-000000000004', '77777777-7777-7777-7777-777777777777', 'Summit Ridge Resort', 'HAC-SR', 32.2850, 77.2180, ST_SetSRID(ST_MakePoint(77.2180, 32.2850), 4326)::geography)
ON CONFLICT (id) DO NOTHING;

INSERT INTO routes (id, tenant_id, code, name, origin, destination, distance_km, estimated_minutes)
VALUES
    ('66666666-0002-0001-0000-000000000001', '66666666-6666-6666-6666-666666666666', 'EXP-C1', 'Corporate Tech Line', 'Tech Park Gate 1 (North Concourse)', 'South Gate Metro Interchange', 6.8, 24),
    ('77777777-0002-0001-0000-000000000001', '77777777-7777-7777-7777-777777777777', 'ALP-X1', 'Himalayan Ridge Line', 'Alpine Base Camp Terminal', 'Summit Ridge Resort', 12.4, 45)
ON CONFLICT (id) DO NOTHING;

INSERT INTO route_stops (id, tenant_id, route_id, stop_id, stop_sequence, eta_offset_minutes)
VALUES
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', '66666666-0002-0001-0000-000000000001', '66666666-0001-0001-0000-000000000001', 1, 0),
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', '66666666-0002-0001-0000-000000000001', '66666666-0001-0001-0000-000000000002', 2, 6),
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', '66666666-0002-0001-0000-000000000001', '66666666-0001-0001-0000-000000000003', 3, 14),
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', '66666666-0002-0001-0000-000000000001', '66666666-0001-0001-0000-000000000004', 4, 24),

    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', '77777777-0002-0001-0000-000000000001', '77777777-0001-0001-0000-000000000001', 1, 0),
    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', '77777777-0002-0001-0000-000000000001', '77777777-0001-0001-0000-000000000002', 2, 12),
    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', '77777777-0002-0001-0000-000000000001', '77777777-0001-0001-0000-000000000003', 3, 28),
    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', '77777777-0002-0001-0000-000000000001', '77777777-0001-0001-0000-000000000004', 4, 45)
ON CONFLICT (route_id, stop_id) DO NOTHING;

INSERT INTO buses (id, tenant_id, fleet_code, plate_number, model, capacity, status, trip_status, current_stop_sequence, progress_pct)
VALUES
    ('66666666-0003-0001-0000-000000000001', '66666666-6666-6666-6666-666666666666', 'TECH-01', 'WTC-8801', 'Apex Electric Executive Shuttle', 36, 'ACTIVE', 'IN_TRANSIT', 1, 25.0),
    ('66666666-0003-0001-0000-000000000002', '66666666-6666-6666-6666-666666666666', 'TECH-02', 'WTC-8802', 'Apex Electric Executive Shuttle', 36, 'ACTIVE', 'IN_TRANSIT', 3, 65.0),

    ('77777777-0003-0001-0000-000000000001', '77777777-7777-7777-7777-777777777777', 'ALPINE-01', 'HP-01-EXP', 'Scania Alpine Luxury Coach', 28, 'ACTIVE', 'IN_TRANSIT', 1, 30.0),
    ('77777777-0003-0001-0000-000000000002', '77777777-7777-7777-7777-777777777777', 'ALPINE-02', 'HP-02-EXP', 'Scania Alpine Luxury Coach', 28, 'ACTIVE', 'IN_TRANSIT', 2, 55.0)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    trip_status = EXCLUDED.trip_status;

INSERT INTO bus_telemetry (recorded_at, tenant_id, bus_id, route_id, latitude, longitude, location, speed_kmh, heading_deg, occupancy, trip_status, progress_pct)
VALUES
    (NOW(), '66666666-6666-6666-6666-666666666666', '66666666-0003-0001-0000-000000000001', '66666666-0002-0001-0000-000000000001', 3.1325, 101.6860, ST_SetSRID(ST_MakePoint(101.6860, 3.1325), 4326)::geography, 34.5, 45.0, 18, 'IN_TRANSIT', 25.0),
    (NOW(), '66666666-6666-6666-6666-666666666666', '66666666-0003-0001-0000-000000000002', '66666666-0002-0001-0000-000000000001', 3.1420, 101.6915, ST_SetSRID(ST_MakePoint(101.6915, 3.1420), 4326)::geography, 42.0, 52.0, 22, 'IN_TRANSIT', 65.0),

    (NOW(), '77777777-7777-7777-7777-777777777777', '77777777-0003-0001-0000-000000000001', '77777777-0002-0001-0000-000000000001', 32.2430, 77.1910, ST_SetSRID(ST_MakePoint(77.1910, 32.2430), 4326)::geography, 28.0, 35.0, 14, 'IN_TRANSIT', 30.0),
    (NOW(), '77777777-7777-7777-7777-777777777777', '77777777-0003-0001-0000-000000000002', '77777777-0002-0001-0000-000000000001', 32.2600, 77.2000, ST_SetSRID(ST_MakePoint(77.2000, 32.2600), 4326)::geography, 31.0, 40.0, 19, 'IN_TRANSIT', 55.0)
ON CONFLICT DO NOTHING;

INSERT INTO trips (id, tenant_id, bus_id, route_id, departure_time, status)
VALUES
    ('66666666-0004-0001-0000-000000000001', '66666666-6666-6666-6666-666666666666', '66666666-0003-0001-0000-000000000001', '66666666-0002-0001-0000-000000000001', NOW(), 'IN_PROGRESS'),
    ('77777777-0004-0001-0000-000000000001', '77777777-7777-7777-7777-777777777777', '77777777-0003-0001-0000-000000000001', '77777777-0002-0001-0000-000000000001', NOW(), 'IN_PROGRESS')
ON CONFLICT (id) DO NOTHING;

INSERT INTO seat_inventory (id, tenant_id, trip_id, seat_number, status, held_by_user_id, held_until, booked_by_user_id, booked_at)
SELECT
    gen_random_uuid(),
    '66666666-6666-6666-6666-666666666666',
    '66666666-0004-0001-0000-000000000001',
    'A' || n::text,
    CASE WHEN n <= 8 THEN 'BOOKED' ELSE 'AVAILABLE' END,
    NULL,
    NULL,
    NULL,
    CASE WHEN n <= 8 THEN NOW() - INTERVAL '15 minutes' ELSE NULL END
FROM generate_series(1, 24) AS n
ON CONFLICT (trip_id, seat_number) DO NOTHING;

INSERT INTO seat_inventory (id, tenant_id, trip_id, seat_number, status, held_by_user_id, held_until, booked_by_user_id, booked_at)
SELECT
    gen_random_uuid(),
    '77777777-7777-7777-7777-777777777777',
    '77777777-0004-0001-0000-000000000001',
    'S' || n::text,
    CASE WHEN n <= 6 THEN 'BOOKED' ELSE 'AVAILABLE' END,
    NULL,
    NULL,
    NULL,
    CASE WHEN n <= 6 THEN NOW() - INTERVAL '30 minutes' ELSE NULL END
FROM generate_series(1, 20) AS n
ON CONFLICT (trip_id, seat_number) DO NOTHING;
