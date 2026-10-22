# Continuous Mathnuscripts world

Recovered from the user's July 19 project session, “Update mwaweru.com personal website plan.” The user's current instruction supersedes its rendering lens and asks for natively rendered scenery, seamless map traversal, and mobile support.

## Product structure

- A central Trailhead and five connected territories: computing, building, knowledge, Africa, and philosophy.
- Published vault metadata generates essay objects, growth stages, related-note connections, and optional Origins / Wanderer / Maker / Sovereign journeys.
- Kijazo is an in-world, deterministic guide. Search and direct note links remain accessible independently of movement.
- A single map with traversable paths, river crossings, coastal terrain, woodland, and rising highlands. The four Pinterest references guide shapes, ink lines, materials, and lighting.

## Runtime boundaries

- Three.js handles native meshes, instancing, shadows, water, vegetation, and ink rendering.
- A fixed-step kinematic controller handles terrain grounding, acceleration, sliding collisions, and jumping.
- Navigation uses one walkability model for click/tap pathfinding, walking to territories, and keyboard/touch motion.
- The camera follows the character continuously. Map view is an overview of the same terrain.
- React handles reading, search, Kijazo dialogue, map controls, and narrative journeys; frame-by-frame positions stay inside the engine.
- Mobile uses a camera-relative thumbstick, tap-to-walk, an explicit nearby-object action, portrait-aware framing, reduced rendering density, and a sheet that pauses movement.

## Verification

Test connected routes between all territories, river/bridge traversal, collision sliding, frame-rate-independent simulation, and seeded content placement. In the browser, verify real position changes between territories, manual movement, camera following, proximity interaction, touch cancellation, orientation changes, reading return, and search/deep links. Measure renderer work rather than asserting a device frame rate from an emulator.
