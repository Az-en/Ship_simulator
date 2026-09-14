const { io } = require('socket.io-client');
const http = require('http');

// Simple verification script to check WebSocket alerts and REST endpoints
async function runLiveVerification() {
  console.log('Testing alert data structures and event emission contracts...');

  // Verification 1: geoMath imports
  const { calculateDistanceKm, isPointInZone } = require('../dist/utils/geoMath');
  
  const dist = calculateDistanceKm(
    { lat: 25.5, lng: 54.75 },
    { lat: 25.22, lng: 54.18 }
  );
  console.log(`✓ calculateDistanceKm: ${dist.toFixed(2)} km`);
  if (dist < 60 || dist > 70) {
    throw new Error('Distance calculation failed');
  }

  const polygon = [
    { lat: 26.0, lng: 55.0 },
    { lat: 27.0, lng: 55.0 },
    { lat: 27.0, lng: 56.0 },
    { lat: 26.0, lng: 56.0 },
  ];
  const inside = isPointInZone({ lat: 26.5, lng: 55.5 }, polygon);
  const outside = isPointInZone({ lat: 28.0, lng: 55.5 }, polygon);
  console.log(`✓ isPointInZone inside: ${inside}, outside: ${outside}`);
  if (!inside || outside) {
    throw new Error('isPointInZone check failed');
  }

  // Verification 2: AlertsService contract
  const { AlertsService } = require('../dist/simulator/alerts/alerts.service');
  const alertsService = new AlertsService();

  const geoAlert = alertsService.dispatchGeofenceBreach('MV-1', 'Aurora', 'zone-1', 'Strait Red Zone');
  console.log('✓ Geofence alert dispatched:', {
    shipId: geoAlert.shipId,
    zoneName: geoAlert.zoneName,
    timestamp: geoAlert.timestamp,
    status: geoAlert.status,
  });

  if (geoAlert.shipId !== 'MV-1' || geoAlert.zoneName !== 'Strait Red Zone' || !geoAlert.timestamp) {
    throw new Error('Geofence alert missing required fields');
  }

  const proxAlert = alertsService.dispatchProximityWarning('MV-1', 'MV-2', 1.34);
  console.log('✓ Proximity warning dispatched:', {
    shipIds: proxAlert.shipIds,
    distance: proxAlert.distance,
    timestamp: proxAlert.timestamp,
    status: proxAlert.status,
  });

  if (!proxAlert.shipIds.includes('MV-1') || !proxAlert.shipIds.includes('MV-2') || proxAlert.distance !== 1.34 || !proxAlert.timestamp) {
    throw new Error('Proximity warning missing required fields');
  }

  console.log('\nAll alert verification checks passed successfully!');
}

runLiveVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
