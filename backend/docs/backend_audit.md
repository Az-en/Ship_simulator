# Backend Functionality Audit Report

This report evaluates the current state of the backend simulation code against the requirements in the [WEB DEVELOPMENT PROBLEM STATEMENT.pdf](file:///c:/Users/Azfar/Desktop/Codes/NestStuff/simulator/docs/WEB%20DEVELOPMENT%20PROBLEM%20STATEMENT.pdf).

---

## 1. Implemented Features in Backend

The backend codebase implements the foundation of the ship simulator, static REST endpoints, and basic path-rebuilding on zone insertion:

### Core Simulation Engine & Gateway
- **15 Active Ships Initialization**: The server loads exactly 15 ships and their initial states from [fleet.json](file:///c:/Users/Azfar/Desktop/Codes/NestStuff/simulator/data/fleet.json) on startup in `loadShipsFromJson()` inside [simulator.service.ts](file:///c:/Users/Azfar/Desktop/Codes/NestStuff/simulator/src/simulator/simulator.service.ts).
- **1 Hz Simulation Tick**: Uses a self-correcting game loop (`runGameLoop`) in [simulator.service.ts](file:///c:/Users/Azfar/Desktop/Codes/NestStuff/simulator/src/simulator/simulator.service.ts#L91-L101) to update ship positions and headings every 1,000ms.
- **Real-Time Websocket Updates**: Periodically pushes the fleet's current state to all connected clients under the `fleetUpdate` event using Socket.io inside [simulator.gateway.ts](file:///c:/Users/Azfar/Desktop/Codes/NestStuff/simulator/src/simulator/simulator.gateway.ts#L24-L28).
- **Control WebSockets**: Includes a `startSimulator` message listener to begin the execution loop.

### Geospatial Calculations & Routing Engine
- **Static Configuration Retrieval**: REST endpoints in [coordinates.controller.ts](file:///c:/Users/Azfar/Desktop/Codes/NestStuff/simulator/src/coordinates/coordinates.controller.ts) expose:
  - Navigable water coordinates: `/coordinates/navigableWater`
  - Workspace bounding box: `/coordinates/boundingBox`
  - Port definitions: `/coordinates/ports`
  - Current fleet state: `/coordinates/Ships`
- **A\* Grid Pathfinding**: The [ShipRoutingService](file:///c:/Users/Azfar/Desktop/Codes/NestStuff/simulator/src/ship-routing/ship-routing.service.ts) implements an A\* search algorithm on a precomputed navigable grid ([nav-graph.json](file:///c:/Users/Azfar/Desktop/Codes/NestStuff/simulator/data/nav-graph.json)).
- **Safety Buffers**: Uses the `@turf/turf` library in [geoMath.ts](file:///c:/Users/Azfar/Desktop/Codes/NestStuff/simulator/src/utils/geoMath.ts) to apply a safety margin (0.2km buffer) around drawn restricted zones.
- **Dynamic Path Recalculation**: On receiving a new restricted zone via the `NewRestrictidArea` websocket event, the service:
  - Generates a new grid excluding nodes in the restricted zone.
  - Checks if active ships' paths intersect the restricted area using ray-casting.
  - Recalculates paths in the background for affected ships (`recalculatePathsInBackground`).

---

## 2. Missing/Remaining Features in Backend

Several core requirements outlined in the problem statement are currently unimplemented or incomplete in the backend code:

### Warnings & Geofences
- **Real-Time Geofence Entry Checks**: The simulator checks if a ship's *planned path* crosses a zone upon zone creation, but it does **not** check if a ship's *actual position* is currently inside a restricted zone during the 1 Hz ticks.
- **Alert Dispatch Pipeline**: There is no endpoint, database, or WebSocket channel to register, retrieve, broadcast, acknowledge, or resolve alerts.
- **Proximity Warnings**: The requirement to detect when two ships get within 2 km of each other is not implemented. There is no distance matrix calculation between ships in `tick()`.

### Ship Statuses & Engine Limits
- **Stranded Status**: If pathfinding fails (e.g., when restricted zones box in a destination), the [ShipRoutingService](file:///c:/Users/Azfar/Desktop/Codes/NestStuff/simulator/src/ship-routing/ship-routing.service.ts) returns an empty path `[]`, but the simulator resets the status back to `NORMAL` in [simulator.service.ts](file:///c:/Users/Azfar/Desktop/Codes/NestStuff/simulator/src/simulator/simulator.service.ts#L195) instead of setting it to `STRANDED` and firing an alert.
- **Fuel Scarcity / Run-out Checks**: The fuel reduction logic in [ship.model.ts](file:///c:/Users/Azfar/Desktop/Codes/NestStuff/simulator/src/simulator/ship/ship.model.ts#L157-L160) is a hardcoded placeholder. The backend does not:
  - Verify whether a ship has sufficient fuel to complete its route.
  - Flag the ship as having "insufficient fuel" when its path exceeds remaining fuel capacity.
  - Respect the status of running completely out of fuel.

### Weather Integration
- **External Weather Client**: There is no integration with Open-Meteo or Stormglass to pull live weather data.
- **Adverse Weather Fuel Surcharge**: The 30% extra fuel burn penalty in adverse weather conditions is not applied.
- **Weather-Aware Pathfinding**: The pathfinder does not factor weather penalties (e.g., high wave or storm zones) into cost calculations to steer ships around adverse weather.

### Operations & Roles
- **Multi-Role Scoping**: There is no support for authentication or distinct interfaces.
- **Command Directives**: The backend lacks endpoints/WebSockets for Command operators to send directives (such as rerouting to a different port, diverting to a waypoint, or holding position).
- **Captain Responses**: There is no model or websocket event handling for a Captain to receive a directive and send back `ACCEPT` or `ESCALATE_DISTRESS`.

### AI / NLP Integration
- **NLP Distress Parsing**: No integration with LLMs or NLP pipelines is implemented. There is no code to parse free-form distress messages into structured alerts (extracting severity, nature of the issue, injury counts, or damage estimates).

### Playback System
- **Timeline & State History**: No database, event log, or ring buffer tracks state snapshots over time. There is no mechanism to query or scrub historical states for playback (last hour of history at 30-second resolution).

---

## 3. Frontend Checklist

To deliver the completed system, the frontend must support these visual capabilities and interface behaviors:

### Map UI & Geospatial Visualization
- [ ] **Interactive Ocean Map**: Build the map rendering the bounding box, ports, and navigable water bounds.
- [ ] **Smooth Ship Interpolation**: Since backend ticks are received at 1 Hz, implement a client-side transition/interpolation (e.g., linear interpolation or easing curves) to move ship icons smoothly without teleporting.
- [ ] **Zone Drawing Tools**: Implement drawing tools (using libraries like Leaflet Geoman or Mapbox Draw) allowing operators to draw and edit restricted zones.
- [ ] **Visual/Audible Alerts**: Display active alerts for geofence breaches and ship proximity warnings (<2km). Play an audible alert sound that persists until acknowledged.

### Role Scoping & Workflows
- [ ] **Command Interface**:
  - Show the entire fleet.
  - Support zone drawing and editing.
  - Ability to select a ship and issue directives (reroute, divert, hold).
  - Ability to view and acknowledge/resolve system-wide alerts.
- [ ] **Captain Interface**:
  - Scoped view showing only their individual ship.
  - View drawn restricted zones (read-only; unable to modify).
  - Receive incoming directives from Command.
  - Respond with either `ACCEPT` or `ESCALATE_DISTRESS`.
  - Open a free-form message console to type distress messages.

### State Playback Scrubber
- [ ] **Playback Timeline**: Provide a timeline scrubber control at the bottom of the map allowing users to pause the live feed and scrub back through the past hour of historical snapshots.

---

## 4. Summary Matrix of Requirements

| Feature | Backend Status | Frontend Status | Action Required |
| :--- | :--- | :--- | :--- |
| **15 Active Ships** | Done | Pending | Connect frontend to websocket |
| **1 Hz Game Loop** | Done | Pending | Consume `fleetUpdate` event |
| **Pathfinding (A\*)** | Done | N/A | Exposes route array via websocket |
| **Dynamic Rerouting** | Done | Pending | UI sends drawn zone coordinates |
| **Geofence Alerts** | Missing | Pending | Add real-time check & alert pipeline |
| **Proximity Warnings** | Missing | Pending | Add distance calculations & alert pipe |
| **Weather & Fuel Penalty** | Missing | N/A | Fetch weather & add 30% fuel modifier |
| **Stranded / Low Fuel** | Missing | Pending | Map status indicators |
| **Directives & Roles** | Missing | Pending | Build role screens & directives API |
| **AI / NLP Extraction** | Missing | Pending | Add distress text box & NLP extractor |
| **History Playback** | Missing | Pending | Add history database/buffer & scrubber |
