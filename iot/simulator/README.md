# Virtual Smart-Bin Fleet Simulator
**Purpose:** Emulates 20 smart bins distributed across Srinagar wards for viva demonstration and testing.

## Features
* Simulates dynamic fill rates based on diurnal time curves.
* Simulates random waste deposition events, temperature fluctuations, and network dropouts.
* Ingests directly into the Node.js backend using valid `X-Device-Token` headers.

## Run Simulator
```bash
node iot/simulator/fleet_simulator.js
```
