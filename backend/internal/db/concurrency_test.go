package db_test

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/raghav/transit-platform/backend/internal/db"
)

func TestConcurrentSeatBookingRaceCondition(t *testing.T) {
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

	tenantID := uuid.New().String()
	busID := uuid.New().String()
	routeID := uuid.New().String()
	tripID := uuid.New().String()

	t.Cleanup(func() {
		cleanCtx, cleanCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cleanCancel()
		_, _ = adminPool.Exec(cleanCtx, "DELETE FROM tenants WHERE id = $1", tenantID)
		adminPool.Close()
	})

	_, err = adminPool.Exec(ctx,
		"INSERT INTO tenants (id, name, slug) VALUES ($1, $2, $3)",
		tenantID, "Concurrency Test Tenant", "tenant-concurrency-"+tenantID[:8],
	)
	if err != nil {
		t.Fatalf("failed to create tenant: %v", err)
	}

	_, err = adminPool.Exec(ctx,
		"INSERT INTO buses (id, tenant_id, fleet_code, plate_number, model, capacity, status) VALUES ($1, $2, $3, $4, $5, 40, 'ACTIVE')",
		busID, tenantID, "CONC-BUS-01", "HP-72-C-0001", "Volvo 9600",
	)
	if err != nil {
		t.Fatalf("failed to create bus: %v", err)
	}

	_, err = adminPool.Exec(ctx,
		"INSERT INTO routes (id, tenant_id, name, code, origin, destination, distance_km, estimated_minutes, active) VALUES ($1, $2, $3, $4, $5, $6, 25.0, 45, true)",
		routeID, tenantID, "Concurrency Express", "CONC-EXP", "Station Alpha", "Station Omega",
	)
	if err != nil {
		t.Fatalf("failed to create route: %v", err)
	}

	_, err = adminPool.Exec(ctx,
		"INSERT INTO trips (id, tenant_id, bus_id, route_id, departure_time, status) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '2 hours', 'SCHEDULED')",
		tripID, tenantID, busID, routeID,
	)
	if err != nil {
		t.Fatalf("failed to create trip: %v", err)
	}

	_, err = adminPool.Exec(ctx,
		"INSERT INTO seat_inventory (tenant_id, trip_id, seat_number, status) VALUES ($1, $2, '5A', 'AVAILABLE')",
		tenantID, tripID,
	)
	if err != nil {
		t.Fatalf("failed to initialize seat: %v", err)
	}

	const concurrencyCount = 25
	userIDs := make([]string, concurrencyCount)
	for i := 0; i < concurrencyCount; i++ {
		uID := uuid.New().String()
		userIDs[i] = uID
		_, err = adminPool.Exec(ctx,
			"INSERT INTO users (id, tenant_id, email, role) VALUES ($1, $2, $3, 'RIDER')",
			uID, tenantID, fmt.Sprintf("rider-%d-%s@test.com", i, uID[:6]),
		)
		if err != nil {
			t.Fatalf("failed to create test user %d: %v", i, err)
		}
	}

	appPoolWrapper, err := db.NewPool(ctx, appURL)
	if err != nil {
		t.Fatalf("failed to create app pool: %v", err)
	}
	defer appPoolWrapper.Close()

	var successCount int64
	var conflictCount int64
	var wg sync.WaitGroup
	startBarrier := make(chan struct{})

	for i := 0; i < concurrencyCount; i++ {
		wg.Add(1)
		go func(workerIndex int) {
			defer wg.Done()
			<-startBarrier

			workerUserID := userIDs[workerIndex]
			txErr := db.WithTenantTx(ctx, appPoolWrapper.Pool, tenantID, func(tx pgx.Tx) error {
				var seatID string
				var currentStatus string
				var heldUntil *time.Time

				query := `
					SELECT id, status, held_until
					FROM seat_inventory
					WHERE trip_id = $1::uuid AND seat_number = '5A'
					FOR UPDATE`

				err := tx.QueryRow(ctx, query, tripID).Scan(&seatID, &currentStatus, &heldUntil)
				if err != nil {
					return err
				}

				now := time.Now().UTC()
				if currentStatus == "BOOKED" {
					return fmt.Errorf("seat already booked")
				}
				if currentStatus == "HELD" && heldUntil != nil && heldUntil.After(now) {
					return fmt.Errorf("seat currently held")
				}

				_, err = tx.Exec(ctx, `
					UPDATE seat_inventory
					SET status = 'BOOKED', booked_by_user_id = $1::uuid, booked_at = $2, held_by_user_id = NULL, held_until = NULL
					WHERE id = $3::uuid`,
					workerUserID, now, seatID,
				)
				if err != nil {
					return err
				}

				ticketCode := fmt.Sprintf("TCK-%s-5A", tripID[:6])
				qrPayload := fmt.Sprintf("NEXTRANSIT://TICKET/%s/5A/%s", tripID, workerUserID)

				_, err = tx.Exec(ctx, `
					INSERT INTO bookings (id, tenant_id, trip_id, user_id, seat_number, ticket_code, status, qr_payload, created_at)
					VALUES ($1, $2, $3, $4, '5A', $5, 'CONFIRMED', $6, $7)`,
					uuid.New().String(), tenantID, tripID, workerUserID, ticketCode, qrPayload, now,
				)
				return err
			})

			if txErr == nil {
				atomic.AddInt64(&successCount, 1)
			} else {
				atomic.AddInt64(&conflictCount, 1)
			}
		}(i)
	}

	close(startBarrier)
	wg.Wait()

	if successCount != 1 {
		t.Fatalf("expected exactly 1 successful booking under concurrency, got %d", successCount)
	}
	if conflictCount != int64(concurrencyCount-1) {
		t.Fatalf("expected exactly %d conflicts, got %d", concurrencyCount-1, conflictCount)
	}

	var confirmedBookings int
	err = adminPool.QueryRow(ctx, "SELECT count(*) FROM bookings WHERE trip_id = $1 AND seat_number = '5A'", tripID).Scan(&confirmedBookings)
	if err != nil {
		t.Fatalf("failed to query bookings: %v", err)
	}
	if confirmedBookings != 1 {
		t.Fatalf("expected 1 confirmed booking record in database, got %d", confirmedBookings)
	}

	var seatFinalStatus string
	err = adminPool.QueryRow(ctx, "SELECT status FROM seat_inventory WHERE trip_id = $1 AND seat_number = '5A'", tripID).Scan(&seatFinalStatus)
	if err != nil {
		t.Fatalf("failed to query seat status: %v", err)
	}
	if seatFinalStatus != "BOOKED" {
		t.Fatalf("expected seat status to be BOOKED, got %s", seatFinalStatus)
	}
}
