import { describe, expect, it } from "bun:test"
import {
  boundingBox,
  haversineMiles,
  ipLocationFromHeaders,
  parseNearbyParams,
} from "../geo"

describe("geo", () => {
  it("computes haversine distance", () => {
    expect(haversineMiles(40.7128, -74.006, 34.0522, -118.2437)).toBeCloseTo(
      2445,
      -1
    )
    expect(haversineMiles(10, 10, 10, 10)).toBe(0)
  })
  it("bounding box contains points inside the radius", () => {
    const box = boundingBox(40, -75, 10)
    expect(box.minLat).toBeLessThan(40)
    expect(box.maxLat).toBeGreaterThan(40)
    expect(box.maxLng - box.minLng).toBeGreaterThan(box.maxLat - box.minLat)
  })
  it("validates params", () => {
    expect(
      parseNearbyParams({ lat: "40.7128", lng: "-74.006", radius: "20" })
    ).toEqual({
      lat: 40.713,
      lng: -74.006,
      radius: 20,
    })
    expect(
      parseNearbyParams({ lat: "40", lng: "-74", radius: null })?.radius
    ).toBe(10)
    expect(parseNearbyParams({ lat: "91", lng: "0", radius: "5" })).toBeNull()
    expect(parseNearbyParams({ lat: "abc", lng: "0", radius: "5" })).toBeNull()
    expect(parseNearbyParams({ lat: "0", lng: "0", radius: "7" })).toBeNull()
    expect(parseNearbyParams({ lat: null, lng: "0", radius: "5" })).toBeNull()
  })

  it("reads approximate location from Cloudflare headers", () => {
    const h = new Headers({
      "cf-iplatitude": "41.8781",
      "cf-iplongitude": "-87.6298",
      "cf-ipcity": "Chicago",
      "cf-region-code": "IL",
      "cf-ipcountry": "US",
    })
    expect(ipLocationFromHeaders(h)).toEqual({
      lat: 41.88,
      lng: -87.63,
      city: "Chicago",
      region: "IL",
      country: "US",
    })
    expect(ipLocationFromHeaders(new Headers())).toBeNull()
    expect(
      ipLocationFromHeaders(
        new Headers({ "cf-iplatitude": "x", "cf-iplongitude": "1" })
      )
    ).toBeNull()
  })
})
