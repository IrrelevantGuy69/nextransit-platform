ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT '$2a$10$pWmPpA5WSIJ0aihJFcXoSOGJGZtZYTkIg..h1wjgxMRElyZUUpP82';
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT 'Fleet Member';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE users
SET password_hash = '$2a$10$pWmPpA5WSIJ0aihJFcXoSOGJGZtZYTkIg..h1wjgxMRElyZUUpP82'
WHERE password_hash IS NULL OR password_hash = '';

UPDATE users SET full_name = 'Dr. Rajesh Sharma (Director)' WHERE email = 'admin@iiituna.ac.in';
UPDATE users SET full_name = 'Ramesh Kumar (Lead Driver)' WHERE email = 'driver.ramesh@iiituna.ac.in';
UPDATE users SET full_name = 'Aarav Mehta (Student Commuter)' WHERE email = 'student.aarav@iiituna.ac.in';

UPDATE users SET full_name = 'Vikram Sood (Ops Head)' WHERE email = 'ops@himachalexpress.in';
UPDATE users SET full_name = 'Vikram Chand (Driver)' WHERE email = 'driver.vikram@himachalexpress.in';
UPDATE users SET full_name = 'Priya Sharma (Commuter)' WHERE email = 'passenger.priya@himachalexpress.in';

INSERT INTO users (id, tenant_id, email, role, full_name, password_hash)
VALUES
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'ops@sbstransit.com.sg', 'OPERATOR_ADMIN', 'Tan Wei Ming (Operations Dispatcher)', '$2a$10$pWmPpA5WSIJ0aihJFcXoSOGJGZtZYTkIg..h1wjgxMRElyZUUpP82'),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'driver.tan@sbstransit.com.sg', 'DRIVER', 'Tan Boon Heng (Captain)', '$2a$10$pWmPpA5WSIJ0aihJFcXoSOGJGZtZYTkIg..h1wjgxMRElyZUUpP82'),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'rider.lee@sbstransit.com.sg', 'RIDER', 'Lee Kuan (Passenger)', '$2a$10$pWmPpA5WSIJ0aihJFcXoSOGJGZtZYTkIg..h1wjgxMRElyZUUpP82'),
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'dispatch@smrt.com.sg', 'OPERATOR_ADMIN', 'Mohd Faizal (Control Center)', '$2a$10$pWmPpA5WSIJ0aihJFcXoSOGJGZtZYTkIg..h1wjgxMRElyZUUpP82'),
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'driver.kumar@smrt.com.sg', 'DRIVER', 'Ravi Kumar (Operator)', '$2a$10$pWmPpA5WSIJ0aihJFcXoSOGJGZtZYTkIg..h1wjgxMRElyZUUpP82'),
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'commuter.chong@smrt.com.sg', 'RIDER', 'Chong Siew Ling (Commuter)', '$2a$10$pWmPpA5WSIJ0aihJFcXoSOGJGZtZYTkIg..h1wjgxMRElyZUUpP82'),
    (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'transport@nus.edu.sg', 'OPERATOR_ADMIN', 'Dr. Cheryl Lim (Transit Coordinator)', '$2a$10$pWmPpA5WSIJ0aihJFcXoSOGJGZtZYTkIg..h1wjgxMRElyZUUpP82'),
    (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'driver.ali@nus.edu.sg', 'DRIVER', 'Ali bin Hassan (Shuttle Driver)', '$2a$10$pWmPpA5WSIJ0aihJFcXoSOGJGZtZYTkIg..h1wjgxMRElyZUUpP82'),
    (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'student.wei@u.nus.edu', 'RIDER', 'Wei Chen (SOC Student)', '$2a$10$pWmPpA5WSIJ0aihJFcXoSOGJGZtZYTkIg..h1wjgxMRElyZUUpP82')
ON CONFLICT (tenant_id, email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, 
    full_name = EXCLUDED.full_name;

CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);

DROP POLICY IF EXISTS tenant_isolation_policy ON users;
CREATE POLICY tenant_isolation_policy ON users
    FOR ALL
    TO app_user
    USING (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END)
    WITH CHECK (CASE WHEN current_setting('app.current_tenant', true) = 'SUPER_ADMIN' THEN true ELSE tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid END);
