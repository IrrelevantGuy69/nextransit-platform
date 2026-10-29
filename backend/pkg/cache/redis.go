package cache

import (
	"context"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisBroker struct {
	client    *redis.Client
	available bool
	mu        sync.RWMutex
}

func NewRedisBroker(addr string) *RedisBroker {
	if addr == "" {
		addr = os.Getenv("REDIS_URL")
	}
	if addr == "" {
		addr = "localhost:6379"
	}

	var opt *redis.Options
	if strings.HasPrefix(addr, "redis://") || strings.HasPrefix(addr, "rediss://") {
		parsedOpt, err := redis.ParseURL(addr)
		if err == nil {
			opt = parsedOpt
		}
	}

	if opt == nil {
		cleanAddr := addr
		if strings.HasPrefix(cleanAddr, "tcp://") {
			cleanAddr = strings.TrimPrefix(cleanAddr, "tcp://")
		}
		opt = &redis.Options{
			Addr:         cleanAddr,
			DialTimeout:  1500 * time.Millisecond,
			ReadTimeout:  1500 * time.Millisecond,
			WriteTimeout: 1500 * time.Millisecond,
			PoolSize:     20,
			MinIdleConns: 5,
		}
	}

	client := redis.NewClient(opt)
	ctx, cancel := context.WithTimeout(context.Background(), 1500*time.Millisecond)
	defer cancel()

	available := false
	if err := client.Ping(ctx).Err(); err == nil {
		available = true
		log.Printf("[redis] Connected to telemetry broker at %s", opt.Addr)
	} else {
		log.Printf("[redis] Warning: Redis broker unavailable at %s (%v); falling back to direct database streaming", opt.Addr, err)
	}

	return &RedisBroker{
		client:    client,
		available: available,
	}
}

func (b *RedisBroker) IsAvailable() bool {
	if b == nil {
		return false
	}
	b.mu.RLock()
	defer b.mu.RUnlock()
	return b.available
}

func (b *RedisBroker) GeoAdd(ctx context.Context, key string, lng, lat float64, member string) error {
	if b == nil || !b.IsAvailable() {
		return nil
	}
	return b.client.GeoAdd(ctx, key, &redis.GeoLocation{
		Name:      member,
		Longitude: lng,
		Latitude:  lat,
	}).Err()
}

func (b *RedisBroker) Publish(ctx context.Context, channel string, message interface{}) error {
	if b == nil || !b.IsAvailable() {
		return nil
	}
	return b.client.Publish(ctx, channel, message).Err()
}

func (b *RedisBroker) Subscribe(ctx context.Context, channels ...string) *redis.PubSub {
	if b == nil || !b.IsAvailable() {
		return nil
	}
	return b.client.Subscribe(ctx, channels...)
}

func (b *RedisBroker) Close() error {
	if b == nil || b.client == nil {
		return nil
	}
	return b.client.Close()
}
