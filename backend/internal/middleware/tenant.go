package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/raghav/transit-platform/backend/internal/auth"
)

type contextKey string

const (
	TenantIDKey contextKey = "tenant_id"
	UserIDKey   contextKey = "user_id"
	RoleKey     contextKey = "role"
	ClaimsKey   contextKey = "claims"
)

func AuthMiddleware(validator auth.TokenValidator) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var tokenString string
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.SplitN(authHeader, " ", 2)
				if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
					tokenString = parts[1]
				}
			}
			if tokenString == "" {
				if cookie, err := r.Cookie("auth_token"); err == nil {
					tokenString = cookie.Value
				}
			}

			if tokenString == "" {
				respondJSONError(w, http.StatusUnauthorized, "missing authorization credentials")
				return
			}

			claims, err := validator.ValidateToken(tokenString)
			if err != nil {
				respondJSONError(w, http.StatusUnauthorized, "unauthorized: "+err.Error())
				return
			}

			ctx := r.Context()
			ctx = context.WithValue(ctx, TenantIDKey, claims.TenantID)
			ctx = context.WithValue(ctx, UserIDKey, claims.Subject)
			ctx = context.WithValue(ctx, RoleKey, claims.Role)
			ctx = context.WithValue(ctx, ClaimsKey, claims)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRole(roles ...string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, ok := RoleFromContext(r.Context())
			if !ok {
				respondJSONError(w, http.StatusForbidden, "role missing in context")
				return
			}

			for _, allowed := range roles {
				if role == allowed {
					next.ServeHTTP(w, r)
					return
				}
			}

			respondJSONError(w, http.StatusForbidden, "forbidden: insufficient permissions")
		})
	}
}

func TenantIDFromContext(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(TenantIDKey).(string)
	return val, ok
}

func UserIDFromContext(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(UserIDKey).(string)
	return val, ok
}

func RoleFromContext(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(RoleKey).(string)
	return val, ok
}

func ClaimsFromContext(ctx context.Context) (*auth.Claims, bool) {
	val, ok := ctx.Value(ClaimsKey).(*auth.Claims)
	return val, ok
}

func respondJSONError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}
