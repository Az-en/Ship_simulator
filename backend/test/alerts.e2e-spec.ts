import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { SimulatorService } from '../src/simulator/simulator.service';
import { AlertsService } from '../src/simulator/alerts/alerts.service';
import { AlertType, AlertStatus } from '../src/simulator/alerts/alert.model';

describe('Alerts Pipeline & Endpoints (e2e)', () => {
  let app: INestApplication;
  let simulatorService: SimulatorService;
  let alertsService: AlertsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    simulatorService = app.get<SimulatorService>(SimulatorService);
    alertsService = app.get<AlertsService>(AlertsService);
  });

  afterAll(async () => {
    simulatorService.stopSimulation();
    await app.close();
  });

  it('GET /simulator/alerts initially returns empty or clean list', async () => {
    const res = await request(app.getHttpServer())
      .get('/simulator/alerts')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /simulator/zones creates a restricted zone and detects geofence breaches', async () => {
    // Ship MV-1 is at [26.55, 56.2]
    const ships = simulatorService.getShips();
    const mv1 = ships.find((s) => s.getId() === 'MV-1') || ships[0];
    const pos = mv1.getPosition();

    const restrictedArea = {
      id: 'strait-zone-1',
      name: 'Strait Sector 1 Blockade',
      coordinates: [
        { lat: pos.lat - 0.2, lng: pos.long - 0.2 },
        { lat: pos.lat + 0.2, lng: pos.long - 0.2 },
        { lat: pos.lat + 0.2, lng: pos.long + 0.2 },
        { lat: pos.lat - 0.2, lng: pos.long + 0.2 },
        { lat: pos.lat - 0.2, lng: pos.long - 0.2 },
      ],
    };

    // Add zone via REST endpoint
    await request(app.getHttpServer())
      .post('/simulator/zones')
      .send(restrictedArea)
      .expect(201);

    // Trigger tick
    simulatorService.tick();

    // Check alerts
    const alertsRes = await request(app.getHttpServer())
      .get('/simulator/alerts')
      .expect(200);

    expect(alertsRes.body.length).toBeGreaterThan(0);
    const geofenceAlert = alertsRes.body.find(
      (a: any) =>
        a.type === AlertType.GEOFENCE_BREACH && a.shipId === mv1.getId(),
    );

    expect(geofenceAlert).toBeDefined();
    expect(geofenceAlert.shipId).toBe(mv1.getId());
    expect(geofenceAlert.zoneName).toBe('Strait Sector 1 Blockade');
    expect(geofenceAlert.timestamp).toBeDefined();

    // Test acknowledge endpoint
    const ackRes = await request(app.getHttpServer())
      .post(`/simulator/alerts/${geofenceAlert.id}/acknowledge`)
      .expect(201);

    expect(ackRes.body.status).toBe('Acknowledged');
    expect(ackRes.body.alert.status).toBe(AlertStatus.ACKNOWLEDGED);

    // Test resolve endpoint
    const resolveRes = await request(app.getHttpServer())
      .post(`/simulator/alerts/${geofenceAlert.id}/resolve`)
      .expect(201);

    expect(resolveRes.body.status).toBe('Resolved');
    expect(resolveRes.body.alert.status).toBe(AlertStatus.RESOLVED);
  });

  it('generates proximity warning when ships come within 2 km of each other', async () => {
    const ships = simulatorService.getShips();
    const ship1 = ships[0];
    const ship2 = ships[1];

    // Place ship2 within ~1 km of ship1
    const p1 = ship1.getPosition();
    ship2.getPosition().lat = p1.lat + 0.008;
    ship2.getPosition().long = p1.long;

    // Run tick
    simulatorService.tick();

    const alertsRes = await request(app.getHttpServer())
      .get('/simulator/alerts')
      .expect(200);

    const proxAlert = alertsRes.body.find(
      (a: any) =>
        a.type === AlertType.PROXIMITY_WARNING &&
        a.shipIds?.includes(ship1.getId()) &&
        a.shipIds?.includes(ship2.getId()),
    );

    expect(proxAlert).toBeDefined();
    expect(proxAlert.shipIds).toContain(ship1.getId());
    expect(proxAlert.shipIds).toContain(ship2.getId());
    expect(proxAlert.distance).toBeLessThanOrEqual(2.0);
    expect(proxAlert.timestamp).toBeDefined();
  });
});
