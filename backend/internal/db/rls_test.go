package db_test

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/raghav/transit-platform/backend/internal/db"
)

func getDBURL(envVar, defaultLocal, fallbackIP string) string {
	if v := os.Getenv(envVar); v != "" {
		return v
	}
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()
	cfg, err := pgxpool.ParseConfig(defaultLocal)
	if err == nil {
		if pool, err := pgxpool.NewWithConfig(ctx, cfg); err == nil {
			if err := pool.Ping(ctx); err == nil {
				pool.Close()
				return defaultLocal
			}
			pool.Close()
		}
	}
	return fallbackIP
}

func applyMigrations(ctx context.Context, adminPool *pgxpool.Pool, t *testing.T) {
	files := []string{
		"000001_init_tenancy_and_rls.up.sql",
		"002_fleet_routes_stops.sql",
		"003_telemetry_and_etas.sql",
		"004_seed_5_curated_tenants.sql",
		"005_trip_lifecycle_geofences_etas.sql",
		"006_seat_reservations_concurrency.sql",
		"006_offline_driver_sync.sql",
		"007_phase8_security_audit.sql",
		"008_auth_credentials.sql",
	}

	prefixes := []string{
		"../../migrations/",
		"../migrations/",
		"migrations/",
	}

	for _, file := range files {
		var content []byte
		for _, prefix := range prefixes {
			if data, err := os.ReadFile(prefix + file); err == nil {
				content = data
				break
			}
		}
		if len(content) == 0 {
			t.Fatalf("failed to locate migration file %s", file)
		}
		if _, err := adminPool.Exec(ctx, string(content)); err != nil {
			t.Fatalf("failed to execute migration %s: %v", file, err)
		}
	}
}

func TestRowLevelSecurityIsolation(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	adminURL := getDBURL("TEST_DB_ADMIN_URL",
		"postgres://postgres:password@localhost:5432/transit_db?sslmode=disable",
		"postgres://postgres:password@192.168.13.13:5432/transit_db?sslmode=disable",
	)

	appURL := getDBURL("TEST_DB_APP_URL",
		"postgres://app_user:app_password@localhost:5432/transit_db?sslmode=disable",
		"postgres://app_user:app_password@192.168.13.13:5432/transit_db?sslmode=disable",
	)

	adminPool, err := pgxpool.New(ctx, adminURL)
	if err != nil {
		t.Fatalf("failed to connect as admin: %v", err)
	}

	applyMigrations(ctx, adminPool, t)

	tenantAID := uuid.New().String()
	tenantBID := uuid.New().String()

	t.Cleanup(func() {
		cleanCtx, cleanCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cleanCancel()
		_, _ = adminPool.Exec(cleanCtx, "DELETE FROM tenants WHERE id IN ($1, $2)", tenantAID, tenantBID)
		adminPool.Close()
	})

	_, err = adminPool.Exec(ctx,
		"INSERT INTO tenants (id, name, slug) VALUES ($1, $2, $3), ($4, $5, $6)",
		tenantAID, "Tenant Alpha", "tenant-alpha-"+tenantAID[:8],
		tenantBID, "Tenant Beta", "tenant-beta-"+tenantBID[:8],
	)
	if err != nil {
		t.Fatalf("failed to seed tenants: %v", err)
	}

	userA1ID := uuid.New().String()
	userA2ID := uuid.New().String()
	userB1ID := uuid.New().String()

	_, err = adminPool.Exec(ctx,
		"INSERT INTO users (id, tenant_id, email, role) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8), ($9, $10, $11, $12)",
		userA1ID, tenantAID, "a1-"+tenantAID[:6]+"@alpha.com", "OPERATOR_ADMIN",
		userA2ID, tenantAID, "a2-"+tenantAID[:6]+"@alpha.com", "RIDER",
		userB1ID, tenantBID, "b1-"+tenantBID[:6]+"@beta.com", "RIDER",
	)
	if err != nil {
		t.Fatalf("failed to seed users: %v", err)
	}

	busA1ID := uuid.New().String()
	busB1ID := uuid.New().String()
	_, err = adminPool.Exec(ctx,
		"INSERT INTO buses (id, tenant_id, fleet_code, plate_number, model, capacity, status) VALUES ($1, $2, $3, $4, $5, $6, $7), ($8, $9, $10, $11, $12, $13, $14)",
		busA1ID, tenantAID, "ALPHA-BUS-01", "HP-72-A-9901", "Tata Starbus", 40, "ACTIVE",
		busB1ID, tenantBID, "BETA-BUS-01", "HP-01-B-9902", "Volvo B11R", 50, "ACTIVE",
	)
	if err != nil {
		t.Fatalf("failed to seed buses: %v", err)
	}

	stopA1ID := uuid.New().String()
	stopB1ID := uuid.New().String()
	_, err = adminPool.Exec(ctx,
		"INSERT INTO stops (id, tenant_id, name, code, latitude, longitude, location) VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography), ($7, $8, $9, $10, $11, $12, ST_SetSRID(ST_MakePoint($12, $11), 4326)::geography)",
		stopA1ID, tenantAID, "Alpha Terminal", "ALP-01", 31.48, 76.19,
		stopB1ID, tenantBID, "Beta Junction", "BET-01", 30.90, 77.09,
	)
	if err != nil {
		t.Fatalf("failed to seed stops: %v", err)
	}

	routeA1ID := uuid.New().String()
	routeB1ID := uuid.New().String()
	_, err = adminPool.Exec(ctx,
		"INSERT INTO routes (id, tenant_id, name, code, origin, destination, distance_km, estimated_minutes, active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9), ($10, $11, $12, $13, $14, $15, $16, $17, $18)",
		routeA1ID, tenantAID, "Alpha Route 1", "ALP-R1", "Alpha Origin", "Alpha Dest", 15.0, 30, true,
		routeB1ID, tenantBID, "Beta Route 1", "BET-R1", "Beta Origin", "Beta Dest", 45.0, 80, true,
	)
	if err != nil {
		t.Fatalf("failed to seed routes: %v", err)
	}

	appPoolWrapper, err := db.NewPool(ctx, appURL)
	if err != nil {
		t.Fatalf("failed to connect as app_user: %v", err)
	}
	defer appPoolWrapper.Close()

	t.Run("Tenant A context queries only Tenant A users", func(t *testing.T) {
		err := db.WithTenantTx(ctx, appPoolWrapper.Pool, tenantAID, func(tx pgx.Tx) error {
			rows, err := tx.Query(ctx, "SELECT id, tenant_id, email FROM users")
			if err != nil {
				return err
			}
			defer rows.Close()

			var foundIDs []string
			for rows.Next() {
				var id, tenantID, email string
				if err := rows.Scan(&id, &tenantID, &email); err != nil {
					return err
				}
				if tenantID != tenantAID {
					return fmt.Errorf("expected tenant %s, got row for tenant %s", tenantAID, tenantID)
				}
				foundIDs = append(foundIDs, id)
			}
			if err := rows.Err(); err != nil {
				return err
			}

			if len(foundIDs) != 2 {
				return fmt.Errorf("expected 2 users for tenant A, found %d", len(foundIDs))
			}
			return nil
		})
		if err != nil {
			t.Fatalf("tenant A isolation check failed: %v", err)
		}
	})

	t.Run("Tenant A context queries only Tenant A buses", func(t *testing.T) {
		err := db.WithTenantTx(ctx, appPoolWrapper.Pool, tenantAID, func(tx pgx.Tx) error {
			rows, err := tx.Query(ctx, "SELECT id, tenant_id, fleet_code FROM buses")
			if err != nil {
				return err
			}
			defer rows.Close()

			count := 0
			for rows.Next() {
				var id, tenantID, fleetCode string
				if err := rows.Scan(&id, &tenantID, &fleetCode); err != nil {
					return err
				}
				if tenantID != tenantAID {
					return fmt.Errorf("expected tenant %s, got bus for tenant %s", tenantAID, tenantID)
				}
				count++
			}
			if err := rows.Err(); err != nil {
				return err
			}
			if count != 1 {
				return fmt.Errorf("expected 1 bus for tenant A, found %d", count)
			}
			return nil
		})
		if err != nil {
			t.Fatalf("tenant A buses isolation check failed: %v", err)
		}
	})

	t.Run("Tenant A context queries only Tenant A stops", func(t *testing.T) {
		err := db.WithTenantTx(ctx, appPoolWrapper.Pool, tenantAID, func(tx pgx.Tx) error {
			rows, err := tx.Query(ctx, "SELECT id, tenant_id, name, code, latitude, longitude FROM stops")
			if err != nil {
				return err
			}
			defer rows.Close()

			count := 0
			for rows.Next() {
				var id, tenantID, name, code string
				var lat, lng float64
				if err := rows.Scan(&id, &tenantID, &name, &code, &lat, &lng); err != nil {
					return err
				}
				if tenantID != tenantAID {
					return fmt.Errorf("expected tenant %s, got stop for tenant %s", tenantAID, tenantID)
				}
				count++
			}
			if err := rows.Err(); err != nil {
				return err
			}
			if count != 1 {
				return fmt.Errorf("expected 1 stop for tenant A, found %d", count)
			}
			return nil
		})
		if err != nil {
			t.Fatalf("tenant A stops isolation check failed: %v", err)
		}
	})

	t.Run("Tenant A context queries only Tenant A routes", func(t *testing.T) {
		err := db.WithTenantTx(ctx, appPoolWrapper.Pool, tenantAID, func(tx pgx.Tx) error {
			rows, err := tx.Query(ctx, "SELECT id, tenant_id, name, code FROM routes")
			if err != nil {
				return err
			}
			defer rows.Close()

			count := 0
			for rows.Next() {
				var id, tenantID, name, code string
				if err := rows.Scan(&id, &tenantID, &name, &code); err != nil {
					return err
				}
				if tenantID != tenantAID {
					return fmt.Errorf("expected tenant %s, got route for tenant %s", tenantAID, tenantID)
				}
				count++
			}
			if err := rows.Err(); err != nil {
				return err
			}
			if count != 1 {
				return fmt.Errorf("expected 1 route for tenant A, found %d", count)
			}
			return nil
		})
		if err != nil {
			t.Fatalf("tenant A routes isolation check failed: %v", err)
		}
	})

	t.Run("Cross-tenant insert violates RLS policy on users", func(t *testing.T) {
		err := db.WithTenantTx(ctx, appPoolWrapper.Pool, tenantAID, func(tx pgx.Tx) error {
			maliciousUserID := uuid.New().String()
			_, err := tx.Exec(ctx,
				"INSERT INTO users (id, tenant_id, email, role) VALUES ($1, $2, $3, $4)",
				maliciousUserID, tenantBID, "intruder-"+tenantBID[:6]+"@beta.com", "RIDER",
			)
			return err
		})

		if err == nil {
			t.Fatal("expected cross-tenant insert on users to fail with RLS violation, but it succeeded")
		}

		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code != "42501" {
				t.Fatalf("expected SQLSTATE 42501, got %s", pgErr.Code)
			}
		} else if !strings.Contains(err.Error(), "violates row-level security policy") {
			t.Fatalf("expected RLS policy violation error, got: %v", err)
		}
	})

	t.Run("Cross-tenant insert violates RLS policy on buses", func(t *testing.T) {
		err := db.WithTenantTx(ctx, appPoolWrapper.Pool, tenantAID, func(tx pgx.Tx) error {
			maliciousBusID := uuid.New().String()
			_, err := tx.Exec(ctx,
				"INSERT INTO buses (id, tenant_id, fleet_code, plate_number, model, capacity, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
				maliciousBusID, tenantBID, "ROGUE-01", "HP-00-Z-0000", "Rogue Bus", 30, "ACTIVE",
			)
			return err
		})

		if err == nil {
			t.Fatal("expected cross-tenant insert on buses to fail with RLS violation, but it succeeded")
		}

		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code != "42501" {
				t.Fatalf("expected SQLSTATE 42501, got %s", pgErr.Code)
			}
		} else if !strings.Contains(err.Error(), "violates row-level security policy") {
			t.Fatalf("expected RLS policy violation error, got: %v", err)
		}
	})

	t.Run("Cross-tenant insert violates RLS policy on stops", func(t *testing.T) {
		err := db.WithTenantTx(ctx, appPoolWrapper.Pool, tenantAID, func(tx pgx.Tx) error {
			maliciousStopID := uuid.New().String()
			_, err := tx.Exec(ctx,
				"INSERT INTO stops (id, tenant_id, name, code, latitude, longitude, location) VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography)",
				maliciousStopID, tenantBID, "Rogue Stop", "ROG-01", 32.0, 76.0,
			)
			return err
		})

		if err == nil {
			t.Fatal("expected cross-tenant insert on stops to fail with RLS violation, but it succeeded")
		}

		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code != "42501" {
				t.Fatalf("expected SQLSTATE 42501, got %s", pgErr.Code)
			}
		} else if !strings.Contains(err.Error(), "violates row-level security policy") {
			t.Fatalf("expected RLS policy violation error, got: %v", err)
		}
	})

	t.Run("Cross-tenant insert violates RLS policy on routes", func(t *testing.T) {
		err := db.WithTenantTx(ctx, appPoolWrapper.Pool, tenantAID, func(tx pgx.Tx) error {
			maliciousRouteID := uuid.New().String()
			_, err := tx.Exec(ctx,
				"INSERT INTO routes (id, tenant_id, name, code, origin, destination, distance_km, estimated_minutes, active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
				maliciousRouteID, tenantBID, "Rogue Route", "ROG-R1", "Nowhere", "Nowhere", 10.0, 15, true,
			)
			return err
		})

		if err == nil {
			t.Fatal("expected cross-tenant insert on routes to fail with RLS violation, but it succeeded")
		}

		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code != "42501" {
				t.Fatalf("expected SQLSTATE 42501, got %s", pgErr.Code)
			}
		} else if !strings.Contains(err.Error(), "violates row-level security policy") {
			t.Fatalf("expected RLS policy violation error, got: %v", err)
		}
	})

	t.Run("Zero tenant context returns 0 rows", func(t *testing.T) {
		err := db.WithTenantTx(ctx, appPoolWrapper.Pool, "", func(tx pgx.Tx) error {
			tables := []string{"users", "buses", "stops", "routes", "bus_telemetry", "transit_events", "route_segment_stats"}
			for _, table := range tables {
				rows, err := tx.Query(ctx, fmt.Sprintf("SELECT COUNT(*) FROM %s", table))
				if err != nil {
					return err
				}

				var count int
				if rows.Next() {
					_ = rows.Scan(&count)
				}
				rows.Close()
				if err := rows.Err(); err != nil {
					return err
				}

				if count != 0 {
					return fmt.Errorf("expected 0 rows in %s with empty tenant context, got %d", table, count)
				}
			}
			return nil
		})
		if err != nil {
			t.Fatalf("zero tenant context query failed: %v", err)
		}
	})
}

func TestTelemetryAndETAIsolation(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	adminURL := getDBURL("TEST_DB_ADMIN_URL",
		"postgres://postgres:password@localhost:5432/transit_db?sslmode=disable",
		"postgres://postgres:password@192.168.13.13:5432/transit_db?sslmode=disable",
	)

	appURL := getDBURL("TEST_DB_APP_URL",
		"postgres://app_user:app_password@localhost:5432/transit_db?sslmode=disable",
		"postgres://app_user:app_password@192.168.13.13:5432/transit_db?sslmode=disable",
	)

	adminPool, err := pgxpool.New(ctx, adminURL)
	if err != nil {
		t.Fatalf("failed to connect as admin: %v", err)
	}

	applyMigrations(ctx, adminPool, t)

	tenantAID := uuid.New().String()
	tenantBID := uuid.New().String()

	t.Cleanup(func() {
		cleanCtx, cleanCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cleanCancel()
		_, _ = adminPool.Exec(cleanCtx, "DELETE FROM tenants WHERE id IN ($1, $2)", tenantAID, tenantBID)
		adminPool.Close()
	})

	_, err = adminPool.Exec(ctx,
		"INSERT INTO tenants (id, name, slug) VALUES ($1, $2, $3), ($4, $5, $6)",
		tenantAID, "Telemetry Tenant A", "tel-tenant-a-"+tenantAID[:8],
		tenantBID, "Telemetry Tenant B", "tel-tenant-b-"+tenantBID[:8],
	)
	if err != nil {
		t.Fatalf("failed to seed tenants: %v", err)
	}

	busAID := uuid.New().String()
	busBID := uuid.New().String()
	userAID := uuid.New().String()
	userBID := uuid.New().String()
	_, err = adminPool.Exec(ctx,
		"INSERT INTO users (id, tenant_id, email, role) VALUES ($1, $2, $3, 'RIDER'), ($4, $5, $6, 'RIDER')",
		userAID, tenantAID, "tel-rider-a@alpha.com",
		userBID, tenantBID, "tel-rider-b@beta.com",
	)
	if err != nil {
		t.Fatalf("failed to seed users: %v", err)
	}
	_, err = adminPool.Exec(ctx,
		"INSERT INTO buses (id, tenant_id, fleet_code, plate_number, model, capacity, status) VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE'), ($7, $8, $9, $10, $11, $12, 'ACTIVE')",
		busAID, tenantAID, "TEL-BUS-A", "HP-72-T-0001", "Model A", 40,
		busBID, tenantBID, "TEL-BUS-B", "HP-01-T-0002", "Model B", 50,
	)
	if err != nil {
		t.Fatalf("failed to seed buses: %v", err)
	}

	stopAID := uuid.New().String()
	stopBID := uuid.New().String()
	_, err = adminPool.Exec(ctx,
		"INSERT INTO stops (id, tenant_id, name, code, latitude, longitude, location) VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($6, $5), 4326)::geography), ($7, $8, $9, $10, $11, $12, ST_SetSRID(ST_MakePoint($12, $11), 4326)::geography)",
		stopAID, tenantAID, "Stop Alpha Point", "ST-AP", 31.4800, 76.1900,
		stopBID, tenantBID, "Stop Beta Point", "ST-BP", 30.9000, 77.1000,
	)
	if err != nil {
		t.Fatalf("failed to seed stops: %v", err)
	}

	routeAID := uuid.New().String()
	routeBID := uuid.New().String()
	_, err = adminPool.Exec(ctx,
		"INSERT INTO routes (id, tenant_id, name, code, origin, destination, distance_km, estimated_minutes, active) VALUES ($1, $2, $3, $4, $5, $6, 10.0, 20, true), ($7, $8, $9, $10, $11, $12, 20.0, 40, true)",
		routeAID, tenantAID, "Route Alpha", "RT-A", "Origin A", "Dest A",
		routeBID, tenantBID, "Route Beta", "RT-B", "Origin B", "Dest B",
	)
	if err != nil {
		t.Fatalf("failed to seed routes: %v", err)
	}

	_, err = adminPool.Exec(ctx,
		"INSERT INTO route_stops (id, tenant_id, route_id, stop_id, stop_sequence, eta_offset_minutes) VALUES ($1, $2, $3, $4, 1, 0), ($5, $6, $7, $8, 1, 0)",
		uuid.New().String(), tenantAID, routeAID, stopAID,
		uuid.New().String(), tenantBID, routeBID, stopBID,
	)
	if err != nil {
		t.Fatalf("failed to seed route stops: %v", err)
	}

	_, err = adminPool.Exec(ctx,
		"INSERT INTO bus_telemetry (recorded_at, tenant_id, bus_id, route_id, latitude, longitude, location, speed_kmh, heading_deg, occupancy) VALUES (NOW(), $1, $2, $3, 31.4750, 76.2000, ST_SetSRID(ST_MakePoint(76.2000, 31.4750), 4326)::geography, 45.0, 90.0, 20), (NOW(), $4, $5, $6, 30.8900, 77.0800, ST_SetSRID(ST_MakePoint(77.0800, 30.8900), 4326)::geography, 50.0, 180.0, 30)",
		tenantAID, busAID, routeAID,
		tenantBID, busBID, routeBID,
	)
	if err != nil {
		t.Fatalf("failed to seed telemetry: %v", err)
	}

	appPoolWrapper, err := db.NewPool(ctx, appURL)
	if err != nil {
		t.Fatalf("failed to connect as app_user: %v", err)
	}
	defer appPoolWrapper.Close()

	t.Run("Tenant A queries only Tenant A telemetry points", func(t *testing.T) {
		err := db.WithTenantTx(ctx, appPoolWrapper.Pool, tenantAID, func(tx pgx.Tx) error {
			rows, err := tx.Query(ctx, "SELECT bus_id, tenant_id, speed_kmh FROM bus_telemetry")
			if err != nil {
				return err
			}
			defer rows.Close()

			count := 0
			for rows.Next() {
				var bID, tID string
				var spd float64
				if err := rows.Scan(&bID, &tID, &spd); err != nil {
					return err
				}
				if tID != tenantAID {
					return fmt.Errorf("expected tenant %s, got telemetry for %s", tenantAID, tID)
				}
				if bID != busAID {
					return fmt.Errorf("expected bus %s, got telemetry for %s", busAID, bID)
				}
				count++
			}
			if err := rows.Err(); err != nil {
				return err
			}
			if count != 1 {
				return fmt.Errorf("expected 1 telemetry row for tenant A, got %d", count)
			}
			return nil
		})
		if err != nil {
			t.Fatalf("telemetry isolation check failed: %v", err)
		}
	})

	t.Run("Cross-tenant insert on bus_telemetry violates RLS policy", func(t *testing.T) {
		err := db.WithTenantTx(ctx, appPoolWrapper.Pool, tenantAID, func(tx pgx.Tx) error {
			_, err := tx.Exec(ctx,
				"INSERT INTO bus_telemetry (recorded_at, tenant_id, bus_id, latitude, longitude, location) VALUES (NOW(), $1, $2, 30.0, 77.0, ST_SetSRID(ST_MakePoint(77.0, 30.0), 4326)::geography)",
				tenantBID, busBID,
			)
			return err
		})

		if err == nil {
			t.Fatal("expected cross-tenant insert on bus_telemetry to fail with RLS violation, but it succeeded")
		}

		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code != "42501" {
				t.Fatalf("expected SQLSTATE 42501, got %s", pgErr.Code)
			}
		} else if !strings.Contains(err.Error(), "violates row-level security policy") {
			t.Fatalf("expected RLS policy violation error, got: %v", err)
		}
	})

	t.Run("Tenant A computes PostGIS ETA only for Tenant A route and telemetry", func(t *testing.T) {
		err := db.WithTenantTx(ctx, appPoolWrapper.Pool, tenantAID, func(tx pgx.Tx) error {
			query := `
				WITH latest_bus AS (
					SELECT DISTINCT ON (bus_id) bus_id, route_id, location, speed_kmh, recorded_at
					FROM bus_telemetry
					WHERE route_id = $1::uuid
					ORDER BY bus_id, recorded_at DESC
				)
				SELECT 
					s.name,
					COALESCE(ST_Distance(b.location, s.location), 0),
					ROUND(COALESCE(ST_Distance(b.location, s.location) / 1000.0, 0)::numeric, 2),
					ROUND(COALESCE(ST_Distance(b.location, s.location) / (GREATEST(b.speed_kmh, 25.0) * 1000.0 / 60.0), 0)::numeric, 1)
				FROM route_stops rs
				JOIN stops s ON rs.stop_id = s.id
				LEFT JOIN latest_bus b ON b.route_id = rs.route_id
				WHERE rs.route_id = $1::uuid`

			rows, err := tx.Query(ctx, query, routeAID)
			if err != nil {
				return err
			}
			defer rows.Close()

			count := 0
			for rows.Next() {
				var name string
				var distM, distKm, etaMin float64
				if err := rows.Scan(&name, &distM, &distKm, &etaMin); err != nil {
					return err
				}
				if distM <= 0 {
					return fmt.Errorf("expected positive distance, got %f", distM)
				}
				count++
			}
			if err := rows.Err(); err != nil {
				return err
			}
			if count != 1 {
				return fmt.Errorf("expected 1 ETA record for route A, got %d", count)
			}

			bRows, err := tx.Query(ctx, query, routeBID)
			if err != nil {
				return err
			}
			defer bRows.Close()

			bCount := 0
			for bRows.Next() {
				bCount++
			}
			if bCount != 0 {
				return fmt.Errorf("expected 0 ETA records for route B under tenant A context, got %d", bCount)
			}

			return nil
		})
		if err != nil {
			t.Fatalf("ETA isolation check failed: %v", err)
		}
	})

	t.Run("TripSeatInventoryAndBookingIsolation", func(t *testing.T) {
		tripAID := uuid.New().String()
		tripBID := uuid.New().String()
		bookingAID := uuid.New().String()
		bookingBID := uuid.New().String()

		_, err := adminPool.Exec(ctx, `
			INSERT INTO trips (id, tenant_id, bus_id, route_id, departure_time, status)
			VALUES 
				($1, $2, $3, $4, NOW() + INTERVAL '1 hour', 'SCHEDULED'),
				($5, $6, $7, $8, NOW() + INTERVAL '1 hour', 'SCHEDULED')`,
			tripAID, tenantAID, busAID, routeAID,
			tripBID, tenantBID, busBID, routeBID,
		)
		if err != nil {
			t.Fatalf("failed to insert trips: %v", err)
		}

		_, err = adminPool.Exec(ctx, `
			INSERT INTO seat_inventory (tenant_id, trip_id, seat_number, status)
			VALUES 
				($1, $2, '1A', 'AVAILABLE'),
				($3, $4, '1A', 'AVAILABLE')`,
			tenantAID, tripAID,
			tenantBID, tripBID,
		)
		if err != nil {
			t.Fatalf("failed to insert seat inventory: %v", err)
		}

		_, err = adminPool.Exec(ctx, `
			INSERT INTO bookings (id, tenant_id, trip_id, user_id, seat_number, ticket_code, status, qr_payload)
			VALUES 
				($1, $2, $3, $4, '1A', 'TCK-A1-1A', 'CONFIRMED', 'QR-A1'),
				($5, $6, $7, $8, '1A', 'TCK-B1-1A', 'CONFIRMED', 'QR-B1')`,
			bookingAID, tenantAID, tripAID, userAID,
			bookingBID, tenantBID, tripBID, userBID,
		)
		if err != nil {
			t.Fatalf("failed to insert bookings: %v", err)
		}

		err = db.WithTenantTx(ctx, appPoolWrapper.Pool, tenantAID, func(tx pgx.Tx) error {
			var tripCount int
			if err := tx.QueryRow(ctx, "SELECT count(*) FROM trips WHERE id = $1", tripBID).Scan(&tripCount); err != nil {
				return err
			}
			if tripCount != 0 {
				return fmt.Errorf("tenant A can see tenant B trip")
			}

			var seatCount int
			if err := tx.QueryRow(ctx, "SELECT count(*) FROM seat_inventory WHERE trip_id = $1", tripBID).Scan(&seatCount); err != nil {
				return err
			}
			if seatCount != 0 {
				return fmt.Errorf("tenant A can see tenant B seat inventory")
			}

			var bookingCount int
			if err := tx.QueryRow(ctx, "SELECT count(*) FROM bookings WHERE id = $1", bookingBID).Scan(&bookingCount); err != nil {
				return err
			}
			if bookingCount != 0 {
				return fmt.Errorf("tenant A can see tenant B booking")
			}

			return nil
		})
		if err != nil {
			t.Fatalf("RLS isolation failed for trips/seats/bookings: %v", err)
		}
	})
}
