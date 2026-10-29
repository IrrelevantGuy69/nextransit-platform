ALTER TABLE buses ADD COLUMN IF NOT EXISTS route_variant VARCHAR(30) NOT NULL DEFAULT 'PRIMARY_ROUTE_1';
ALTER TABLE buses ADD COLUMN IF NOT EXISTS traffic_level VARCHAR(20) NOT NULL DEFAULT 'NORMAL';
ALTER TABLE buses ADD COLUMN IF NOT EXISTS delay_minutes DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS dwell_seconds INTEGER NOT NULL DEFAULT 20;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS segment_progress DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS alternate_waypoints JSONB DEFAULT '[]'::jsonb;

UPDATE buses
SET route_variant = 'PRIMARY_ROUTE_1',
    traffic_level = 'NORMAL',
    delay_minutes = 0.0,
    dwell_seconds = 20,
    segment_progress = 0.15;

UPDATE buses
SET route_variant = 'ALTERNATE_ROUTE_2',
    traffic_level = 'HEAVY',
    delay_minutes = 4.8,
    dwell_seconds = 25,
    segment_progress = 0.35,
    is_detour = true,
    detour_reason = 'Heavy traffic on Route 1 Primary Corridor'
WHERE id IN (
    '11111111-0003-0001-0000-000000000002',
    '22222222-0003-0001-0000-000000000002',
    '33333333-0003-0001-0000-000000000002',
    '44444444-0003-0001-0000-000000000002',
    '55555555-0003-0001-0000-000000000002',
    '66666666-0003-0001-0000-000000000002',
    '77777777-0003-0001-0000-000000000002'
);
