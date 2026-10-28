CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password';
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('RIDER', 'DRIVER', 'OPERATOR_ADMIN', 'SUPER_ADMIN')),
    oidc_sub TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, email)
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON users;
CREATE POLICY tenant_isolation_policy ON users
    FOR ALL
    TO app_user
    USING (current_setting('app.current_tenant', true) = 'SUPER_ADMIN' OR tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
    WITH CHECK (current_setting('app.current_tenant', true) = 'SUPER_ADMIN' OR tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON tenants TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO app_user;
