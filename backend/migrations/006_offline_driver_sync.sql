CREATE TABLE IF NOT EXISTS driver_telemetry_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    driver_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    client_batch_id UUID NOT NULL,
    sequence_number INT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed_kmh DOUBLE PRECISION NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_client_event UNIQUE (tenant_id, client_batch_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_driver_queue_tenant ON driver_telemetry_queue (tenant_id, client_batch_id);
CREATE INDEX IF NOT EXISTS idx_driver_queue_recorded ON driver_telemetry_queue (recorded_at DESC);

ALTER TABLE driver_telemetry_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_telemetry_queue FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_driver_queue ON driver_telemetry_queue;
CREATE POLICY tenant_isolation_driver_queue ON driver_telemetry_queue
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

GRANT ALL PRIVILEGES ON driver_telemetry_queue TO app_user;
