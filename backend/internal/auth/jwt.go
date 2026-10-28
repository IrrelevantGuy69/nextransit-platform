package auth

import (
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	RoleRider         = "RIDER"
	RoleDriver        = "DRIVER"
	RoleOperatorAdmin = "OPERATOR_ADMIN"
	RoleSuperAdmin    = "SUPER_ADMIN"
)

var (
	ErrInvalidRole  = errors.New("invalid user role")
	ErrInvalidToken = errors.New("invalid token")
	ErrMissingKey   = errors.New("missing secret or jwks url")
)

type Claims struct {
	jwt.RegisteredClaims
	TenantID string `json:"tenant_id,omitempty"`
	Role     string `json:"role"`
	Email    string `json:"email,omitempty"`
	UserID   string `json:"user_id,omitempty"`
}

type TokenValidator interface {
	ValidateToken(tokenString string) (*Claims, error)
}

type JWTManager struct {
	devSecret []byte
	jwksURL   string
	client    *http.Client
	mu        sync.RWMutex
	keysCache map[string]interface{}
}

func NewJWTManager(devSecret []byte, jwksURL string) *JWTManager {
	return &JWTManager{
		devSecret: devSecret,
		jwksURL:   jwksURL,
		client:    &http.Client{Timeout: 10 * time.Second},
		keysCache: make(map[string]interface{}),
	}
}

func (m *JWTManager) GenerateDevToken(sub, tenantID, role string, expiry time.Duration) (string, error) {
	return m.GenerateToken(sub, tenantID, role, "", expiry)
}

func (m *JWTManager) GenerateToken(sub, tenantID, role, email string, expiry time.Duration) (string, error) {
	if !IsValidRole(role) {
		return "", ErrInvalidRole
	}
	now := time.Now()
	claims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   sub,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(expiry)),
		},
		TenantID: tenantID,
		Role:     role,
		Email:    email,
		UserID:   sub,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.devSecret)
}

func (m *JWTManager) ValidateToken(tokenString string) (*Claims, error) {
	parser := jwt.NewParser()
	claims := &Claims{}

	token, err := parser.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); ok {
			if len(m.devSecret) == 0 {
				return nil, errors.New("hmac token received but dev secret not configured")
			}
			return m.devSecret, nil
		}
		return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
	})

	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}

	if !token.Valid {
		return nil, ErrInvalidToken
	}

	if !IsValidRole(claims.Role) {
		return nil, ErrInvalidRole
	}

	if claims.UserID == "" && claims.Subject != "" {
		claims.UserID = claims.Subject
	}
	if claims.Subject == "" && claims.UserID != "" {
		claims.Subject = claims.UserID
	}

	return claims, nil
}

func IsValidRole(role string) bool {
	switch role {
	case RoleRider, RoleDriver, RoleOperatorAdmin, RoleSuperAdmin:
		return true
	default:
		return false
	}
}

func GenerateDevToken(secret []byte, sub, tenantID, role string, expiry time.Duration) (string, error) {
	manager := NewJWTManager(secret, "")
	return manager.GenerateDevToken(sub, tenantID, role, expiry)
}

func ValidateDevToken(secret []byte, tokenString string) (*Claims, error) {
	manager := NewJWTManager(secret, "")
	return manager.ValidateToken(tokenString)
}
