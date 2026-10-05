# Frontend Functionality Audit Report

This report evaluates the current state of the Next.js frontend codebase against the requirements in the [WEB DEVELOPMENT PROBLEM STATEMENT.pdf](file:///c:/Users/Azfar/Desktop/Codes/NestStuff/simulator/docs/WEB%20DEVELOPMENT%20PROBLEM%20STATEMENT.pdf).

---

## 1. Implemented Features in Frontend

The frontend is a Next.js (App Router) project styled with TailwindCSS. It implements a dark tactical map overlay and establishes real-time synchronization with the backend:

### Connection & Store Setup
- **Landing Role Selection**: The home page [page.tsx](file:///c:/Users/Azfar/Desktop/Codes/NextStuff/commandcentrefe/src/app/page.tsx) allows the user to choose between the **Command Center** or **Captain** roles, which are saved in a Zustand role store [role.ts](file:///c:/Users/Azfar/Desktop/Codes/NextStuff/commandcentrefe/src/stores/role.ts).
- **Static Map Assets Loading**: On app load, [init.tsx](file:///c:/Users/Azfar/Desktop/Codes/NextStuff/commandcentrefe/src/app/init.tsx) fetches the bounding box, navigable water polygon, and port markers from the backend REST endpoints and commits them to [coordinatesStore.ts](file:///c:/Users/Azfar/Desktop/Codes/NextStuff/commandcentrefe/src/stores/coordinatesStore.ts).
- **Socket.io Handshake**: Integrates `socket.io-client` inside [fleetStore.ts](file:///c:/Users/Azfar/Desktop/Codes/NextStuff/commandcentrefe/src/stores/fleetStore.ts) to establish real-time links with the simulation server on port `4000`.
- **Dynamic Fleet Data Merging**: The store listens to the `fleetUpdate` websocket event, parsing and merging incoming coordinate/path streams into `fleetUpdates` dynamically.

### Interactive Tactical Map
- **React-Leaflet Container**: Renders a dark-theme basemap ([CARTO Dark Matter](https://carto.com/)) in [mapCanvas.tsx](file:///c:/Users/Azfar/Desktop/Codes/NextStuff/commandcentrefe/src/components/mapCanvas.tsx).
- **Overlay Plots**: 
  - Navigable water polygon bounds are plotted in semi-transparent blue.
  - Ports are indicated with green circle markers.
  - All 15 active ships are plotted as white circles (turning yellow when selected) with hover tooltips displaying their speeds and destinations.
- **Active Path Overlays**: If a ship is selected and has an active route returned by the backend routing engine, a cyan polyline is rendered with a pulse animation (`animated-ship-path`).
- **Restricted Zone Drawing**: Integrates `react-leaflet-draw` (`EditControl`). When a Command operator draws a polygon, it intercepts the geometry coordinates and:
  - Dispatches the `NewRestrictidArea` event to the backend simulator.
  - Saves the new zone shape locally in `restrictedAreas` to render it in red-violet.

---

## 2. Missing/Remaining Features in Frontend

The frontend is currently a visual layout shell containing several placeholders and static templates that must be connected to live data and backend operations:

### Roles & Scoped Interfaces
- **View Scoping**: Clicking "Captain" toggle changes the state in the Zustand role store, but the actual dashboard (/fleet) is identical to Command. It still displays the entire fleet overview instead of scoping the view down to a single captain's ship.
- **Role Restrictions**: The UI does not lock out captains from viewing other vessels or drawing new zones on the map.

### Directives & Command Controls
- **Directives Panel Hookups**: The Command Controls box in the sidebar is a static template block in [Sidebar.tsx](file:///c:/Users/Azfar/Desktop/Codes/NextStuff/commandcentrefe/src/components/Sidebar.tsx#L52-L82). Selecting a port dropdown or clicking "Set Course," "Reroute," or "Hold Position" does nothing. They are not hooked up to emit websocket events to the backend.
- **Waypoint Selection Tool**: There is no map tool enabling users to click and select coordinates to input custom waypoints.

### Live Alerts & Auditory Alarms
- **Alert Panel Integration**: The [alerts-panel.tsx](file:///c:/Users/Azfar/Desktop/Codes/NextStuff/commandcentrefe/src/components/alerts-panel.tsx) component is defined but is **not** imported or rendered anywhere in the active dashboard UI.
- **Mock Alert Feeds**: All alert items are static placeholders imported from [fleet-data.ts](file:///c:/Users/Azfar/Desktop/Codes/NextStuff/commandcentrefe/src/lib/fleet-data.ts#L376-L433). There are no websocket listeners to catch geofence or proximity warnings from the backend.
- **Audible and Persisting State**: No audio alert playback is configured, and there is no UI workflow for Command to acknowledge or resolve active alerts.

### Interactive Zones Listing
- **Zones Sidebar**: The [zones-panel.tsx](file:///c:/Users/Azfar/Desktop/Codes/NextStuff/commandcentrefe/src/components/zones-panel.tsx) is not mounted in the sidebar.
- **Zone Deletion / Editing**: The layout includes edit/delete buttons for zones, but they are unmapped and cannot modify active areas in the backend.

### State Timeline Playback
- **Historical Scrubbing**: No playback controller or timeline slider is rendered on the map screen. There are no client-side methods to call backend APIs for historical event records or to toggle between the live simulation feed and past logs.

### Motion Interpolation
- **Smooth Easing**: Ships jump positions abruptly every second when a new websocket packet arrives. There is no linear interpolation (LERP) or CSS transition handling implemented on the Leaflet markers to move them smoothly between ticks.

---

## 3. Comparative Integration Matrix

| Requirement Detail | Frontend Status | Backend Status | Gap / Action Needed |
| :--- | :--- | :--- | :--- |
| **Draw Restricted Zones** | Map drawing tools exist. | Receives zone & updates grid. | Hook up [zones-panel.tsx](file:///c:/Users/Azfar/Desktop/Codes/NextStuff/commandcentrefe/src/components/zones-panel.tsx) list to Zustand state. |
| **Command Directives** | UI displays static controls. | Missing (No listener/endpoints). | Define websocket channel (`issueDirective`) & write inputs in UI. |
| **Captain Responses** | Missing (No response panel). | Missing (No state logic). | Create captain directive popup, ACCEPT/DISTRESS buttons & text box. |
| **Geofence Alerts** | Mock alerts list only. | Recalculates paths but no alerts. | Detect breaches on tick; emit socket alerts; trigger audio in UI. |
| **Proximity Alarms** | Mock alerts list only. | Missing (No pairwise check). | Add proximity math on tick; emit alert on trigger; display warning. |
| **AI / NLP Parsing** | Missing. | Missing. | Create a text input for Captain; send text to AI processor endpoint. |
| **Timeline Playback** | Missing (No timeline slider). | Missing (No snapshot database). | Design a scrubber at the bottom; query historical log API on scrub. |
| **Smooth Movement** | Markers teleport on tick. | Emits states at 1 Hz. | Add client-side animation/easing to Leaflet markers. |
