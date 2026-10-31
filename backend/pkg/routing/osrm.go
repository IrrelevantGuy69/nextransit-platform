package routing

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"os"
	"strings"
	"time"
)

type RouteResult struct {
	Coordinates     [][]float64 `json:"coordinates"`
	DistanceMeters  float64     `json:"distance_meters"`
	DurationSeconds float64     `json:"duration_seconds"`
}

type Client struct {
	baseURL         string
	valhallaBaseURL string
	httpClient      *http.Client
}

func NewClient(baseURL string) *Client {
	if baseURL == "" {
		baseURL = os.Getenv("OSRM_BASE_URL")
	}
	if baseURL == "" {
		baseURL = "https://router.project-osrm.org"
	}
	valhallaURL := os.Getenv("VALHALLA_BASE_URL")
	return &Client{
		baseURL:         baseURL,
		valhallaBaseURL: valhallaURL,
		httpClient: &http.Client{
			Timeout: 2800 * time.Millisecond,
		},
	}
}

type osrmAPIResponse struct {
	Code   string `json:"code"`
	Routes []struct {
		Geometry struct {
			Coordinates [][]float64 `json:"coordinates"`
			Type        string      `json:"type"`
		} `json:"geometry"`
		Distance float64 `json:"distance"`
		Duration float64 `json:"duration"`
	} `json:"routes"`
}

type valhallaRouteRequest struct {
	Locations []struct {
		Lat float64 `json:"lat"`
		Lon float64 `json:"lon"`
	} `json:"locations"`
	Costing string `json:"costing"`
}

type valhallaRouteResponse struct {
	Trip struct {
		Summary struct {
			Length float64 `json:"length"`
			Time   float64 `json:"time"`
		} `json:"summary"`
		Legs []struct {
			Shape string `json:"shape"`
		} `json:"legs"`
	} `json:"trip"`
}

func (c *Client) GetRoute(ctx context.Context, fromLat, fromLng, toLat, toLng float64) (*RouteResult, error) {
	return c.GetMultiPointRoute(ctx, [][2]float64{
		{fromLat, fromLng},
		{toLat, toLng},
	})
}

func (c *Client) GetMultiPointRoute(ctx context.Context, waypoints [][2]float64) (*RouteResult, error) {
	if len(waypoints) < 2 {
		return nil, fmt.Errorf("at least 2 waypoints required")
	}

	var coordStrs []string
	for _, wp := range waypoints {
		coordStrs = append(coordStrs, fmt.Sprintf("%0.6f,%0.6f", wp[1], wp[0]))
	}

	reqURL := fmt.Sprintf("%s/route/v1/driving/%s?overview=full&geometries=geojson",
		c.baseURL, strings.Join(coordStrs, ";"))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err == nil {
		req.Header.Set("User-Agent", "NextTransit-Platform/2.0")
		resp, reqErr := c.httpClient.Do(req)
		if reqErr == nil && resp.StatusCode == http.StatusOK {
			var apiResp osrmAPIResponse
			if decErr := json.NewDecoder(resp.Body).Decode(&apiResp); decErr == nil && apiResp.Code == "Ok" && len(apiResp.Routes) > 0 {
				_ = resp.Body.Close()
				r0 := apiResp.Routes[0]
				coords := make([][]float64, 0, len(r0.Geometry.Coordinates))
				for _, pt := range r0.Geometry.Coordinates {
					if len(pt) >= 2 {
						coords = append(coords, []float64{pt[1], pt[0]})
					}
				}
				if len(coords) >= 2 {
					return &RouteResult{
						Coordinates:     coords,
						DistanceMeters:  r0.Distance,
						DurationSeconds: r0.Duration,
					}, nil
				}
			}
			_ = resp.Body.Close()
		} else if resp != nil {
			_ = resp.Body.Close()
		}
	}

	if c.valhallaBaseURL != "" {
		if vRes := c.tryValhalla(ctx, waypoints); vRes != nil {
			return vRes, nil
		}
	}

	return c.fallbackMultiPointRoute(waypoints), nil
}

func (c *Client) tryValhalla(ctx context.Context, waypoints [][2]float64) *RouteResult {
	valReq := valhallaRouteRequest{Costing: "auto"}
	for _, wp := range waypoints {
		valReq.Locations = append(valReq.Locations, struct {
			Lat float64 `json:"lat"`
			Lon float64 `json:"lon"`
		}{Lat: wp[0], Lon: wp[1]})
	}
	payloadBytes, err := json.Marshal(valReq)
	if err != nil {
		return nil
	}

	reqURL := fmt.Sprintf("%s/route", strings.TrimRight(c.valhallaBaseURL, "/"))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, reqURL, bytes.NewReader(payloadBytes))
	if err != nil {
		return nil
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		if resp != nil {
			_ = resp.Body.Close()
		}
		return nil
	}
	defer resp.Body.Close()

	var valResp valhallaRouteResponse
	if err := json.NewDecoder(resp.Body).Decode(&valResp); err != nil {
		return nil
	}

	distMeters := valResp.Trip.Summary.Length * 1000.0
	durSec := valResp.Trip.Summary.Time
	if len(valResp.Trip.Legs) > 0 && valResp.Trip.Legs[0].Shape != "" {
		coords := decodePolyline6(valResp.Trip.Legs[0].Shape)
		if len(coords) >= 2 {
			return &RouteResult{
				Coordinates:     coords,
				DistanceMeters:  distMeters,
				DurationSeconds: durSec,
			}
		}
	}
	return nil
}

func decodePolyline6(encoded string) [][]float64 {
	var points [][]float64
	index, lat, lng, length := 0, 0, 0, len(encoded)
	factor := 1e6

	for index < length {
		b, shift, result := 0, 0, 0
		for {
			if index >= length {
				break
			}
			b = int(encoded[index]) - 63
			index++
			result |= (b & 0x1f) << shift
			shift += 5
			if b < 0x20 {
				break
			}
		}
		dlat := result >> 1
		if (result & 1) != 0 {
			dlat = ^dlat
		}
		lat += dlat

		shift, result = 0, 0
		for {
			if index >= length {
				break
			}
			b = int(encoded[index]) - 63
			index++
			result |= (b & 0x1f) << shift
			shift += 5
			if b < 0x20 {
				break
			}
		}
		dlng := result >> 1
		if (result & 1) != 0 {
			dlng = ^dlng
		}
		lng += dlng

		points = append(points, []float64{float64(lat) / factor, float64(lng) / factor})
	}
	return points
}

func (c *Client) fallbackMultiPointRoute(waypoints [][2]float64) *RouteResult {
	if len(waypoints) == 2 {
		return c.fallbackRoute(waypoints[0][0], waypoints[0][1], waypoints[1][0], waypoints[1][1])
	}

	var allCoords [][]float64
	var totalDist float64
	for i := 0; i < len(waypoints)-1; i++ {
		p1 := waypoints[i]
		p2 := waypoints[i+1]
		sub := c.fallbackRoute(p1[0], p1[1], p2[0], p2[1])
		totalDist += sub.DistanceMeters
		if i == 0 {
			allCoords = append(allCoords, sub.Coordinates...)
		} else if len(sub.Coordinates) > 1 {
			allCoords = append(allCoords, sub.Coordinates[1:]...)
		}
	}

	totalDur := (totalDist / 1000.0) / 32.0 * 3600.0
	return &RouteResult{
		Coordinates:     allCoords,
		DistanceMeters:  totalDist,
		DurationSeconds: totalDur,
	}
}

func (c *Client) fallbackRoute(fromLat, fromLng, toLat, toLng float64) *RouteResult {
	dLat := toLat - fromLat
	dLng := toLng - fromLng
	dist := HaversineDistanceMeters(fromLat, fromLng, toLat, toLng) * 1.35
	dur := (dist / 1000.0) / 32.0 * 3600.0

	steps := 16
	coords := make([][]float64, 0, steps+1)
	coords = append(coords, []float64{fromLat, fromLng})

	for i := 1; i < steps; i++ {
		t := float64(i) / float64(steps)
		var lat, lng float64
		if t <= 0.45 {
			s := t / 0.45
			lat = fromLat + dLat*s*0.92
			lng = fromLng + dLng*s*0.08
		} else if t <= 0.55 {
			s := (t - 0.45) / 0.10
			lat = fromLat + dLat*(0.92+s*0.04)
			lng = fromLng + dLng*(0.08+s*0.84)
		} else {
			s := (t - 0.55) / 0.45
			lat = fromLat + dLat*(0.96+s*0.04)
			lng = fromLng + dLng*(0.92+s*0.08)
		}
		coords = append(coords, []float64{lat, lng})
	}
	coords = append(coords, []float64{toLat, toLng})

	return &RouteResult{
		Coordinates:     coords,
		DistanceMeters:  dist,
		DurationSeconds: dur,
	}
}

func HaversineDistanceMeters(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadiusMeters = 6371000.0
	dLat := (lat2 - lat1) * (math.Pi / 180.0)
	dLon := (lon2 - lon1) * (math.Pi / 180.0)

	rLat1 := lat1 * (math.Pi / 180.0)
	rLat2 := lat2 * (math.Pi / 180.0)

	a := math.Sin(dLat/2.0)*math.Sin(dLat/2.0) +
		math.Cos(rLat1)*math.Cos(rLat2)*math.Sin(dLon/2.0)*math.Sin(dLon/2.0)
	c := 2.0 * math.Atan2(math.Sqrt(a), math.Sqrt(1.0-a))

	return earthRadiusMeters * c
}
