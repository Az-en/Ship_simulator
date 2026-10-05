# Maritime Fleet Command & Simulation System

A full-stack maritime operations and vessel simulation platform composed of a high-performance **NestJS simulation backend** and a real-time **Next.js tactical command centre frontend**. The system simulates a commercial fleet of 15 vessels navigating ocean waters, computes dynamic A* routes around interactive exclusion zones with safety buffers, performs real-time geofence and proximity conflict detection at 1 Hz, and enforces exclusive position locking between system-wide **Command** and per-vessel **Captain** roles.

```
Ship_simulator/
├── backend/       # NestJS 11 + Socket.IO maritime simulation engine
├── frontend/      # Next.js 16 + React 19 + Leaflet tactical command centre
└── README.md      # Root repository documentation
```

---

## 1. Project Overview

This platform provides an end-to-end operational environment for monitoring, routing, and commanding commercial maritime traffic within designated oceanic boundaries. It solves key challenges in maritime traffic management, fleet simulation, and command coordination:

- **Dual-Tier Operations Architecture**:
  - **Backend (`backend/`)**: Runs a drift-compensated 1 Hz simulation loop controlling 15 active commercial vessels with continuous telemetry (position, speed, heading, fuel burn, cargo, and operational status). Handles spatial graph pathfinding, Turf-buffered exclusion zones, automatic alert lifecycle management, and in-memory exclusive role allocation.
  - **Frontend (`frontend/`)**: An interactive Next.js tactical command dashboard featuring Leaflet-based vector ocean mapping, live vessel marker interpolation, in-browser polygon zone drawing, real-time alert triage, and command directive issuance.
- **Exclusive Multi-Role Operational Scoping**: Enforces strict role isolation via WebSockets. Exactly one active client can claim the system-wide `COMMAND` role (monitoring the full fleet, issuing navigation directives, and drawing restricted zones), while individual vessels can each be claimed by at most one `CAPTAIN` role (scoped single-vessel telemetry and directive monitoring).
- **Dynamic A\* Rerouting with Safety Buffers**: When operators draw restricted maritime zones on the map, the backend applies a 0.2 km safety margin using Turf.js, recalculates the ocean navigation graph, and recalculates paths for affected vessels in non-blocking background workers.
- **Automated Collision & Geofence Alerting**: Evaluates vessel positions on every tick to detect restricted zone breaches and vessel-to-vessel proximity conflicts (< 2.0 km), broadcasting stateful alerts (`ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`) to connected operators.
- **Live Command Directives**: Command operators can select any vessel to issue emergency stops (`DirectiveStop`), assign new destination ports with automatic route calculation (`DirectiveNewCourse`), or resume normal operations (`DirectiveResume`).

---

## 2. Implementation Details

### Architecture & System Data Flow

```
+---------------------------------------------------------------------------------------------------+
|                                      FRONTEND (Next.js 16)                                        |
|                                     http://localhost:3000                                         |
|                                                                                                   |
|  +--------------------+   +-----------------------+   +-------------------+   +----------------+  |
|  |     Role Gate      |   |   Tactical MapCanvas  |   |  Command Controls |   |  Alerts Panel  |  |
|  | (Command/Captain)  |   | (React-Leaflet/Draw)  |   |   (Directives)    |   | (Triage/Ack)   |  |
|  +---------+----------+   +-----------+-----------+   +---------+---------+   +-------+--------+  |
|            |                          |                         |                     |           |
|            |         Zustand Stores (fleetStore, roleStore, alertStore, coordinatesStore)         |
+------------+--------------------------+-------------------------+---------------------+-----------+
             |                          |                         |                     |
             |  REST API (Axios)        |                         |                     |
             |  /coordinates/*          |                         |                     |
             |  /simulator/*            |   WebSocket (Socket.IO) |                     |
             |                          |   Port 4000             |                     |
             v                          v                         v                     v
+---------------------------------------------------------------------------------------------------+
|                                      BACKEND (NestJS 11)                                          |
|                                     http://localhost:4000                                         |
|                                                                                                   |
|                       +--------------------------------------------------+                        |
|                       |        WebSocket Gateway (SimulatorGateway)      |                        |
|                       +------------------------+-------------------------+                        |
|                                                |                                                  |
|                  +-----------------------------+-----------------------------+                    |
|                  |                             |                             |                    |
|                  v                             v                             v                    |
|  +---------------+---------------+  +----------+----------+  +---------------+---------------+    |
|  |       SimulatorService        |  |     RoleService     |  |         AlertsService         |    |
|  | - 1 Hz Drift-Compensated Loop |  | - Socket Lock Map   |  | - Geofence Breaches           |    |
|  | - Ship Physics & Status       |  | - Disconnect Hooks  |  | - Proximity Warnings (<2km)   |    |
|  | - Directives Engine           |  | - Broadcast Sync    |  | - Deduplication & Auto-Resolve|    |
|  +---------------+---------------+  +---------------------+  +-------------------------------+    |
|                  |                                                                                |
|                  v                                                                                |
|  +---------------+---------------+                                                                |
|  |      ShipRoutingService       |                                                                |
|  | - A* Grid Pathfinding Engine  |                                                                |
|  | - Turf.js 0.2km Safety Buffer |                                                                |
|  | - Fresh Nav-Graph on Startup  |                                                                |
|  +-------------------------------+                                                                |
+---------------------------------------------------------------------------------------------------+
```

---

### Backend Core (`backend/`)

- **Framework**: Built with **NestJS 11** using modular dependency injection (`SimulatorModule`, `ShipRoutingModule`, `PortsModule`, `CoordinatesModule`).
- **Real-Time Gateway (`src/simulator/simulator.gateway.ts`)**: Socket.IO 4.8 server handling bi-directional event streaming with CORS enabled. Subscribes to internal RxJS event streams (`fleetUpdate$`, `alert$`) and broadcasts snapshots to connected clients.
- **Drift-Compensated 1 Hz Game Loop (`src/simulator/simulator.service.ts`)**:
  - Simulates physical movement across waypoints along calculated trajectories.
  - Mitigates JavaScript event-loop drift by calculating `drift = now - expectedNextTick` on each cycle and dynamically tuning the subsequent `setTimeout` delay (`Math.max(0, 1000 - drift)`).
- **A\* Pathfinding & Safety Margins (`src/ship-routing/ship-routing.service.ts` & `src/utils/geoMath.ts`)**:
  - Operates on a coordinate graph of navigable water nodes (`data/nav-graph.json`).
  - Automatically recalculates a clean baseline graph on startup (`createNavigableGrid([])`) to prevent persisted zones from leaking across server restarts.
  - When restricted zones are submitted, `@turf/buffer` generates an expanded safety envelope (+0.2 km). Affected nodes are removed from the graph, and ships with intersecting trajectories are transitioned to `REROUTING` while background workers recalculate safe routes.
- **Automated Collision & Geofence Alert Pipeline (`src/simulator/alerts/alerts.service.ts`)**:
  - **Geofence Breaches**: Tests ship coordinates against all active restricted polygons using ray-casting (`isPointInZone`).
  - **Proximity Warnings**: Calculates Haversine distances across all unique ship pairs ($O(n^2)$ matrix over 15 vessels). Ships within 2.0 km trigger a `PROXIMITY_WARNING`.
  - Alerts are stateful: continuous breaches update timestamps without spamming duplicates, and clearing conditions automatically transition alerts to `RESOLVED`.
- **In-Memory Role Locking (`src/simulator/roles/role.service.ts`)**:
  - Tracks client socket assignments. Rejects duplicate claims with structured errors and returns the freshest role availability state.
  - Implements `OnGatewayDisconnect` to automatically unlock roles when a socket disconnects, broadcasting updated states immediately.

---

### Frontend Core (`frontend/`)

- **Framework**: **Next.js 16 (App Router)** with **React 19** and **TypeScript 5**.
- **Interactive Map Engine (`src/components/mapCanvas.tsx`)**:
  - Rendered via **Leaflet 1.9** and **React-Leaflet 5**, dynamically imported with SSR disabled.
  - Renders vector layers:
    - Bounding box and ocean navigable water polygons.
    - Port coordinates with labeled tooltips.
    - 15 ship markers displaying vessel names, status badges, dynamic rotational headings, and path polylines.
  - Integrated **Leaflet-Draw (`EditControl`)**: Enables operators to draw polygon exclusion zones directly on the ocean surface, immediately sending coordinates to the backend via WebSocket.
- **State Management (Zustand 5)**:
  - `useFleetStore`: Manages the Socket.IO client instance, connection states, 1 Hz fleet telemetry snapshots, selected ship selection, and simulation start/stop controls.
  - `useRoleStore`: Tracks local session role (`COMMAND`, `CAPTAIN`), assigned vessel ID, and server role availability snapshots (`serverRoleState`).
  - `useAlertStore`: Manages active, acknowledged, and resolved alerts received via real-time socket events.
  - `useCoordinatesStore`: Stores bounding box, port definitions, and navigable water polygons fetched on initialization.
- **Scoped Operational Views & Route Protection (`src/app/fleet/layout.tsx` & `src/components/Sidebar.tsx`)**:
  - Route guard redirects unauthenticated users or users without a claimed role back to `/`.
  - **Command Mode**: Displays full fleet telemetry in the sidebar, zone drawing tools on the map, and the full Command Controls panel.
  - **Captain Mode**: Restricts sidebar telemetry strictly to the assigned vessel, provides read-only visibility into exclusion zones, and hides fleet-wide controls.
- **Styling & UI Components**: Built with **Tailwind CSS v4**, **Radix UI**, **Lucide React** icons, and **Sonner** notifications for responsive alerts and toast confirmations.

---

## 3. Getting Started / Installation

### Prerequisites

- **Node.js**: `v20.x` or higher recommended (`v18.x` minimum)
- **Package Manager**: `npm` (v9+) or `pnpm`
- **Network Ports**:
  - `4000`: Backend REST & WebSocket Gateway
  - `3000`: Frontend Next.js Web Application

---

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Ship_simulator
```

---

### Step 2: Install Dependencies & Configure Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Verify backend configuration files in `backend/data/`:
   - `fleet.json` (Fleet configurations, bounding box, ports, water boundaries)
   - `nav-graph.json` (Precomputed ocean navigation grid)

3. Start the backend development server:
   ```bash
   npm run start:dev
   ```
   *The backend will boot on `http://localhost:4000` and `ws://localhost:4000`.*

---

### Step 3: Install Dependencies & Configure Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Confirm or create the environment file `frontend/.env`:
   ```env
   BACKEND_URL="http://localhost:4000"
   ```

3. Start the frontend Next.js development server:
   ```bash
   npm run dev
   ```
   *The web application will be accessible at `http://localhost:3000`.*

---

## 4. Usage & Operator Workflows

### 1. Role Selection (`http://localhost:3000`)

Upon opening the application, operators land on the Role Selection screen:
- **Command Center**: Claim global fleet command. If another operator is already active as Commander, the card dynamically reflects `Unavailable — Active Commander` and disables entry.
- **Captain**: Select an assigned vessel from the dropdown (e.g. `MV-1 (Aurora)`). Ships with active captains are marked `• Captained` and disabled.
- Clicking **Click to Enter** or **Access Board** claims the role on the backend via WebSocket and redirects to `/fleet`.

```
+-----------------------------------------------------------------------------------+
|                                  COMMAND CENTRE                                   |
|               Select your role to access the fleet management system              |
|                                                                                   |
|        +--------------------------+        +--------------------------+           |
|        |      COMMAND CENTER      |        |         CAPTAIN          |           |
|        |                          |        |                          |           |
|        | Full Fleet Supervision   |        | Assigned Vessel:         |           |
|        | Issue Directives         |        | [ MV-1 (Aurora)      v ] |           |
|        | Draw Exclusion Zones     |        |                          |           |
|        |                          |        |                          |           |
|        | [AVAILABLE - CLICK ENTER]|        |      [ ACCESS BOARD ]    |           |
|        +--------------------------+        +--------------------------+           |
+-----------------------------------------------------------------------------------+
```

---

### 2. Tactical Operations Dashboard (`http://localhost:3000/fleet`)

Once logged in, the primary operational console mounts:
- **Top Navigation Bar**:
  - Displays session role badge (`COMMAND` or `CAPTAIN — Ship Name (ID)`).
  - Simulator Execution Control (`Start Simulator`, Command only).
  - Socket Link Health Indicator (`Link Secure` with real-time heartbeat animation).
  - UTC / Zulu Clock display.
  - **Log Out** button: cleanly releases the socket role lock on the backend and returns to the home screen.
- **Interactive Ocean Map Canvas**:
  - Live vessel positions updating smoothly at 1 Hz.
  - Polyline routes illustrating active navigational waypoints to destination ports.
  - Draw toolbar (top-left of map): select the polygon tool to sketch restricted zones over the water.
- **Sidebar Telemetry & Control Panel**:
  - **Fleet Overview**: List of all vessels with live status badges (`NORMAL`, `REROUTING`, `STOPPED`, `DISTRESSED`, `ARRIVED`, `STRANDED`).
  - **Vessel Details**: Real-time telemetry for selected vessel (Speed, Heading, Fuel gauge, Cargo, Lat/Long coordinates).
  - **Command Controls** (Command role only):
    - **Hold Position**: Dispatches `DirectiveStop`, commanding the vessel to halt.
    - **Resume**: Dispatches `DirectiveResume`, clearing hold state and resuming transit.
    - **Set Course**: Select an alternative destination port from the dropdown and click **Set Course** to command a dynamic recalculation via `DirectiveNewCourse`.
- **Real-Time Alerts Tray (Bottom Panel)**:
  - Displays incoming `GEOFENCE_BREACH` and `PROXIMITY_WARNING` alerts.
  - Filter by status (`All`, `Active`, `Acknowledged`, `Resolved`).
  - Action buttons to **Acknowledge** or **Resolve** specific alerts.

---

## 5. API & WebSocket Specifications

### REST Endpoints (`http://localhost:4000`)

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/coordinates/boundingBox` | Retrieves simulation geographic bounding box coordinates |
| `GET` | `/coordinates/navigableWater` | Retrieves polygon arrays defining navigable ocean boundaries |
| `GET` | `/coordinates/ports` | Retrieves list of ports, identifiers, and geographic locations |
| `GET` | `/coordinates/Ships` | Retrieves baseline fleet ship configuration array |
| `POST` | `/simulator/start` | Starts the 1 Hz simulation tick loop |
| `POST` | `/simulator/stop` | Stops the simulation tick loop |
| `GET` | `/simulator/alerts` | Returns active alerts (append `?all=true` for full history) |
| `POST` | `/simulator/alerts/:id/acknowledge`| Acknowledges an alert by ID |
| `POST` | `/simulator/alerts/:id/resolve` | Resolves an alert by ID |
| `GET` | `/simulator/zones` | Returns currently active restricted zones |
| `POST` | `/simulator/zones` | Adds a new restricted zone with polygon coordinates |

---

### WebSocket Interface (`ws://localhost:4000`)

#### Client-Emitted Events

```typescript
// Start / Stop Game Loop
socket.emit("startSimulator", {});
socket.emit("stopSimulator", {});

// Role Locking & Session
socket.emit("getRoleState", {});
socket.emit("claimRole", { role: "COMMAND" }, (res) => { /* { success, error, roleState } */ });
socket.emit("claimRole", { role: "CAPTAIN", shipId: "MV-1" }, (res) => { /* ... */ });
socket.emit("releaseRole", {});

// Operator Directives
socket.emit("DirectiveStop", { shipId: "MV-1" });
socket.emit("DirectiveResume", { shipId: "MV-1" });
socket.emit("DirectiveNewCourse", { shipId: "MV-1", portId: "PORT-C" });

// Restricted Zones & Alerts
socket.emit("NewRestrictidArea", {
  id: "zone-alpha",
  name: "Hazard Zone",
  coordinates: [{ lat: 24.5, long: 54.1 }, { lat: 24.6, long: 54.1 }, { lat: 24.5, long: 54.3 }]
});
socket.emit("getAlerts", {});
socket.emit("acknowledgeAlert", { alertId: "alert-123" });
socket.emit("resolveAlert", { alertId: "alert-123" });
```

#### Server-Broadcast Events

| Event | Payload | Frequency / Trigger |
| :--- | :--- | :--- |
| `fleetUpdate` | `ShipConfig[]` | Broadcast every 1 second while simulator is active |
| `alert` | `Alert` | Broadcast immediately when an alert is created, updated, or resolved |
| `alerts` | `Alert[]` | Broadcast with full active alerts array on any alert state change |
| `roleState` | `RoleState` | Broadcast to all clients whenever any role is claimed, released, or dropped |

---

## 6. Development, Testing & Verification

### Running Backend Tests

Navigate to `backend/` to run unit and integration tests:

```bash
cd backend

# Run all unit tests serially
npx jest --runInBand

# Run specific domain test suites
npx jest src/simulator/roles/role.service.spec.ts
npx jest src/simulator/alerts/alerts.service.spec.ts
npx jest src/simulator/simulator.gateway.spec.ts
npx jest src/simulator/simulator.service.spec.ts

# Run with test coverage report
npm run test:cov
```

### Running Frontend Validation

Navigate to `frontend/` to run linting and type-checking:

```bash
cd frontend

# Run ESLint validation
npm run lint

# Verify Next.js production build compilation
npm run build
```

---

## 7. Complete Project Directory Layout

```
Ship_simulator/
├── backend/                                # NestJS Simulation Server
│   ├── data/
│   │   ├── fleet.json                      # Workspace boundaries, ports, 15 ships
│   │   ├── nav-graph.json                  # A* navigable coordinate grid
│   │   └── originalData.json               # Original baseline dataset
│   ├── docs/
│   │   ├── backend_audit.md                # Feature audit & requirement matrix
│   │   └── role_locking_plan.md            # Role-locking architecture spec
│   ├── src/
│   │   ├── coordinates/                    # REST controllers for map boundaries
│   │   │   ├── coordinates.controller.ts
│   │   │   └── coordinates.module.ts
│   │   ├── ports/                          # Port resolution services
│   │   │   ├── ports.service.ts
│   │   │   └── ports.module.ts
│   │   ├── ship-routing/                   # A* search & grid calculation
│   │   │   ├── ship-routing.service.ts
│   │   │   └── ship-routing.module.ts
│   │   ├── simulator/                      # Core simulation engine
│   │   │   ├── alerts/                     # Geofence & proximity alert system
│   │   │   │   ├── alert.model.ts
│   │   │   │   ├── alerts.service.ts
│   │   │   │   └── alerts.service.spec.ts
│   │   │   ├── roles/                      # In-memory exclusive role locks
│   │   │   │   ├── role.service.ts
│   │   │   │   └── role.service.spec.ts
│   │   │   ├── ship/                       # Ship physics model & status enums
│   │   │   │   └── ship.model.ts
│   │   │   ├── simulator.controller.ts     # REST endpoints for controls & alerts
│   │   │   ├── simulator.gateway.ts        # Socket.IO WebSocket gateway
│   │   │   ├── simulator.service.ts        # 1 Hz tick loop & directives handler
│   │   │   └── simulator.module.ts
│   │   ├── utils/                          # Turf buffering & geo-distance math
│   │   │   ├── convertPolygonToGrid.ts
│   │   │   └── geoMath.ts
│   │   ├── app.module.ts
│   │   └── main.ts                         # Server bootstrap (Port 4000)
│   ├── test/                               # E2E test suites
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                               # Next.js Command Centre Client
│   ├── public/                             # Static assets & icons
│   ├── src/
│   │   ├── api/                            # Axios REST API client & helpers
│   │   │   ├── apiClient.ts
│   │   │   └── coordinates.ts
│   │   ├── app/                            # Next.js App Router pages
│   │   │   ├── fleet/                      # Scoped dashboard (/fleet)
│   │   │   │   ├── layout.tsx              # Route protection & common layout
│   │   │   │   └── page.tsx                # Tactical Map canvas page
│   │   │   ├── globals.css                 # Global styling & Tailwind directives
│   │   │   ├── init.tsx                    # Global socket & coordinate bootstrap
│   │   │   ├── layout.tsx                  # Root HTML shell & sonner provider
│   │   │   └── page.tsx                    # Role selection landing screen (/)
│   │   ├── components/                     # Tactical UI components
│   │   │   ├── ui/                         # Radix & Shadcn UI primitives
│   │   │   ├── alerts-panel.tsx            # Bottom alerts triage drawer
│   │   │   ├── command-controls-panel.tsx  # Directives control panel
│   │   │   ├── fleet-panel.tsx             # Fleet overview list
│   │   │   ├── mapCanvas.tsx               # Leaflet map & drawing controls
│   │   │   ├── ship-card.tsx               # Individual vessel card item
│   │   │   ├── ship-details-panel.tsx      # Selected vessel telemetry display
│   │   │   ├── Sidebar.tsx                 # Right-hand operations drawer
│   │   │   ├── status-badge.tsx            # Ship status visual pill
│   │   │   └── topBar.tsx                  # Header bar, links, clock & logout
│   │   ├── stores/                         # Zustand state management
│   │   │   ├── alertStore.ts               # Alert state management
│   │   │   ├── coordinatesStore.ts         # Map boundaries & port coordinates
│   │   │   ├── fleetStore.ts               # Socket connection & fleet telemetry
│   │   │   └── role.ts                     # Session role & availability state
│   │   └── types/                          # TypeScript interface definitions
│   │       ├── alert.ts
│   │       ├── coordinates.ts
│   │       └── ship.ts
│   ├── package.json
│   └── tsconfig.json
│
└── README.md                               # Root Project Documentation
```
