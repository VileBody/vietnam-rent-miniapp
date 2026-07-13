package main

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestDecodeExtractedLocationsFlatAndWrapped(t *testing.T) {
	tests := []struct {
		name    string
		content string
	}{
		{
			name:    "flat envelope",
			content: `{"locations":[{"id":"one","city":"Nha Trang","street":"Nguyễn Thiện Thuật","query_candidates":["Nha Trang, Vietnam"]}]}`,
		},
		{
			name:    "wrapped array",
			content: `[{"id":"one","locations":[{"city":"Nha Trang","street":"Nguyễn Thiện Thuật","query_candidates":["Nha Trang, Vietnam"]}]}]`,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			locations, err := decodeExtractedLocations(test.content)
			if err != nil {
				t.Fatal(err)
			}
			if len(locations) != 1 {
				t.Fatalf("got %d locations", len(locations))
			}
			if locations[0].ID != "one" || locations[0].City != "Nha Trang" || locations[0].Street != "Nguyễn Thiện Thuật" {
				t.Fatalf("unexpected location: %+v", locations[0])
			}
		})
	}
}

func TestGeoMetadataKeepsOnlyGeographicFields(t *testing.T) {
	raw := json.RawMessage(`{
  "location":{"latitude":10.77,"longitude":106.68,"reverse_geocode":{"city":"Quận 3"}},
  "listingPhotos":[{"image":{"uri":"https://example.com/large.jpg"}}],
  "description":{"text":"large source description"}
}`)
	metadata := geoMetadata(listing{Raw: raw})
	encoded, err := json.Marshal(metadata)
	if err != nil {
		t.Fatal(err)
	}
	text := string(encoded)
	if !containsAll(text, "latitude", "longitude", "city") {
		t.Fatalf("missing geographic metadata: %s", text)
	}
	if containsAll(text, "listingPhotos") || containsAll(text, "large source description") {
		t.Fatalf("included unrelated raw payload: %s", text)
	}
}

func containsAll(value string, fragments ...string) bool {
	for _, fragment := range fragments {
		if !strings.Contains(value, fragment) {
			return false
		}
	}
	return true
}
