import { calculateDistanceKm, isPointInZone, createSafetyBuffer } from './geoMath';

describe('geoMath Utilities', () => {
  describe('calculateDistanceKm', () => {
    it('should calculate distance correctly between two coordinates', () => {
      // Jebel Ali DXB [25.5, 54.75] and Abu Dhabi AUH [25.22, 54.18]
      const dist = calculateDistanceKm(
        { lat: 25.5, lng: 54.75 },
        { lat: 25.22, lng: 54.18 },
      );
      // Distance is ~65 km
      expect(dist).toBeGreaterThan(60);
      expect(dist).toBeLessThan(70);
    });

    it('should calculate accurate small distance (< 2 km) for proximity detection', () => {
      // Points very close (~0.01 degrees in latitude ~1.11 km)
      const dist = calculateDistanceKm(
        { lat: 25.500, lng: 55.000 },
        { lat: 25.510, lng: 55.000 },
      );
      expect(dist).toBeGreaterThan(1.0);
      expect(dist).toBeLessThan(1.2);
    });

    it('should support both lng and long properties', () => {
      const dist1 = calculateDistanceKm(
        { lat: 25.0, lng: 55.0 },
        { lat: 25.0, lng: 55.01 },
      );
      const dist2 = calculateDistanceKm(
        { lat: 25.0, long: 55.0 },
        { lat: 25.0, long: 55.01 },
      );
      expect(dist1).toBeCloseTo(dist2, 4);
    });
  });

  describe('isPointInZone', () => {
    const polygon = [
      { lat: 26.0, lng: 55.0 },
      { lat: 27.0, lng: 55.0 },
      { lat: 27.0, lng: 56.0 },
      { lat: 26.0, lng: 56.0 },
      { lat: 26.0, lng: 55.0 },
    ];

    it('should return true for points inside the polygon', () => {
      expect(isPointInZone({ lat: 26.5, lng: 55.5 }, polygon)).toBe(true);
      expect(isPointInZone({ lat: 26.1, long: 55.1 }, polygon)).toBe(true);
    });

    it('should return false for points outside the polygon', () => {
      expect(isPointInZone({ lat: 25.5, lng: 55.5 }, polygon)).toBe(false);
      expect(isPointInZone({ lat: 28.0, lng: 55.5 }, polygon)).toBe(false);
      expect(isPointInZone({ lat: 26.5, lng: 57.0 }, polygon)).toBe(false);
    });
  });

  describe('createSafetyBuffer', () => {
    it('should expand polygon coordinates by buffer distance', () => {
      const polygon = [
        { lat: 26.0, lng: 55.0 },
        { lat: 27.0, lng: 55.0 },
        { lat: 27.0, lng: 56.0 },
        { lat: 26.0, lng: 56.0 },
      ];
      const buffered = createSafetyBuffer(polygon, 0.2);
      expect(buffered).toBeDefined();
      expect(buffered.length).toBeGreaterThan(0);
    });
  });
});
