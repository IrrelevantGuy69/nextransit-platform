ALTER TABLE routes ADD COLUMN IF NOT EXISTS primary_polyline JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS alternate_polyline JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS route_progress DOUBLE PRECISION NOT NULL DEFAULT 0.0;

DELETE FROM stops WHERE id NOT IN (
  '11111111-0001-0001-0000-000000000001', '11111111-0001-0001-0000-000000000002', '11111111-0001-0001-0000-000000000003', '11111111-0001-0001-0000-000000000004', '11111111-0001-0001-0000-000000000005',
  '22222222-0001-0001-0000-000000000001', '22222222-0001-0001-0000-000000000002', '22222222-0001-0001-0000-000000000003', '22222222-0001-0001-0000-000000000004', '22222222-0001-0001-0000-000000000005',
  '33333333-0001-0001-0000-000000000001', '33333333-0001-0001-0000-000000000002', '33333333-0001-0001-0000-000000000003', '33333333-0001-0001-0000-000000000004', '33333333-0001-0001-0000-000000000005',
  '44444444-0001-0001-0000-000000000001', '44444444-0001-0001-0000-000000000002', '44444444-0001-0001-0000-000000000003', '44444444-0001-0001-0000-000000000004', '44444444-0001-0001-0000-000000000005',
  '55555555-0001-0001-0000-000000000001', '55555555-0001-0001-0000-000000000002', '55555555-0001-0001-0000-000000000003', '55555555-0001-0001-0000-000000000004', '55555555-0001-0001-0000-000000000005',
  '66666666-0001-0001-0000-000000000001', '66666666-0001-0001-0000-000000000002', '66666666-0001-0001-0000-000000000003', '66666666-0001-0001-0000-000000000004', '66666666-0001-0001-0000-000000000005',
  '77777777-0001-0001-0000-000000000001', '77777777-0001-0001-0000-000000000002', '77777777-0001-0001-0000-000000000003', '77777777-0001-0001-0000-000000000004', '77777777-0001-0001-0000-000000000005'
);

DELETE FROM route_stops;

INSERT INTO route_stops (id, tenant_id, route_id, stop_id, stop_sequence, eta_offset_minutes)
SELECT 
  gen_random_uuid(),
  r.tenant_id,
  r.id,
  (substr(r.tenant_id::text, 1, 8) || '-0001-0001-0000-00000000000' || seq.n)::uuid,
  seq.n,
  (seq.n - 1) * 6
FROM routes r
CROSS JOIN (SELECT generate_series(1, 5) AS n) seq;

UPDATE buses
SET 
  route_progress = CASE 
    WHEN substr(id::text, 36, 1) = '1' THEN 0.05
    WHEN substr(id::text, 36, 1) = '2' THEN 0.24
    WHEN substr(id::text, 36, 1) = '3' THEN 0.46
    WHEN substr(id::text, 36, 1) = '4' THEN 0.68
    ELSE 0.85
  END,
  current_stop_sequence = CASE 
    WHEN substr(id::text, 36, 1) = '1' THEN 1
    WHEN substr(id::text, 36, 1) = '2' THEN 2
    WHEN substr(id::text, 36, 1) = '3' THEN 3
    WHEN substr(id::text, 36, 1) = '4' THEN 4
    ELSE 5
  END,
  progress_pct = CASE 
    WHEN substr(id::text, 36, 1) = '1' THEN 5.0
    WHEN substr(id::text, 36, 1) = '2' THEN 24.0
    WHEN substr(id::text, 36, 1) = '3' THEN 46.0
    WHEN substr(id::text, 36, 1) = '4' THEN 68.0
    ELSE 85.0
  END,
  segment_progress = CASE 
    WHEN substr(id::text, 36, 1) = '1' THEN 0.25
    WHEN substr(id::text, 36, 1) = '2' THEN 0.20
    WHEN substr(id::text, 36, 1) = '3' THEN 0.30
    WHEN substr(id::text, 36, 1) = '4' THEN 0.40
    ELSE 0.25
  END,
  route_variant = CASE 
    WHEN substr(id::text, 36, 1) = '2' THEN 'ALTERNATE_ROUTE_2'
    ELSE 'PRIMARY_ROUTE_1'
  END,
  is_detour = CASE 
    WHEN substr(id::text, 36, 1) = '2' THEN true
    ELSE false
  END,
  detour_reason = CASE 
    WHEN substr(id::text, 36, 1) = '2' THEN 'Heavy arterial road congestion bypass'
    ELSE ''
  END,
  detour_delay_sec = CASE 
    WHEN substr(id::text, 36, 1) = '2' THEN 228
    ELSE 0
  END,
  delay_minutes = CASE 
    WHEN substr(id::text, 36, 1) = '2' THEN 3.8
    WHEN substr(id::text, 36, 1) = '4' THEN 1.0
    ELSE 0.0
  END,
  traffic_level = CASE 
    WHEN substr(id::text, 36, 1) = '2' THEN 'HEAVY'
    WHEN substr(id::text, 36, 1) = '4' THEN 'MODERATE'
    ELSE 'NORMAL'
  END,
  trip_status = 'IN_TRANSIT';

DELETE FROM bus_telemetry;

INSERT INTO bus_telemetry (tenant_id, bus_id, route_id, recorded_at, latitude, longitude, speed_kmh, heading_deg, occupancy, location, trip_status, progress_pct)
SELECT 
  b.tenant_id,
  b.id,
  b.route_id,
  NOW(),
  s.latitude,
  s.longitude,
  38.0,
  90.0,
  24,
  s.location,
  'IN_TRANSIT',
  b.progress_pct
FROM buses b
JOIN route_stops rs ON rs.route_id = b.route_id AND rs.stop_sequence = b.current_stop_sequence
JOIN stops s ON s.id = rs.stop_id;