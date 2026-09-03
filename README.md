# An IoT-Based Intelligent Waste Management and Resource Recovery System for Local Communities

**Academic Major Project (Semester III)**  
**Programme:** M.Sc. Artificial Intelligence & Machine Learning  
**Institution:** National Institute of Electronics & Information Technology (NIELIT) / NDU Campus, Srinagar  
**Candidate:** Mohd Faisal Wani (Enrolment No: NDU202500069)  
**Evaluation Context:** Major Project Viva & Dissertation Defense  

---

## 1. System Philosophy
$$\text{Generate Less} \longrightarrow \text{Reuse} \longrightarrow \text{Compost/Recover} \longrightarrow \text{Recycle} \longrightarrow \text{Collect} \longrightarrow \text{Process} \longrightarrow \text{Dispose Only What Remains}$$

The system operates as an intelligent municipal coordination layer connecting citizens, collection fleets, municipal administrators, certified recyclers, and IoT smart bins across Srinagar, Jammu & Kashmir.

---

## 2. Monorepo Structure
* **`backend/`**: Node.js + Express REST API Gateway, Socket.io real-time bus, Mongoose schemas with 2dsphere spatial indexing, and automated Jest test suites (44/44 tests passing).
* **`frontend/`**: Vite + React SPA, Tailwind CSS, Leaflet interactive GIS maps, Recharts analytics, and 1-Click Viva Demo Login pills.
* **`ai-service/`**: Python FastAPI microservice with MobileNetV3 9-class deep CNN classifier, confidence calibration engine, and transfer learning training pipeline (`train.py`).
* **`iot/firmware/`**: Production ESP32 FreeRTOS C++ firmware, ultrasonic median filter (N=5), HX711 load-cell integration, and $5\text{V} \rightarrow 3.3\text{V}$ voltage divider circuit schematics.
* **`iot/simulator/`**: Virtual Smart-Bin Fleet Simulator emulating 20 smart bins across Srinagar wards.
* **`docs/`**: Master SRS, Architecture specifications, Benchmark reports, and Viva defense presentation guide.

---

## 3. Quick Start (Development & Viva Demonstration)

### Prerequisites
* Node.js v18+ (Verified on v24.19.0)
* Python 3.10+ (Verified on 3.13.14)
* No manual MongoDB setup required (automatically launches an embedded in-memory MongoDB server if local daemon is inactive).

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Seed Database with Srinagar Demo Data
```bash
cd backend
npm run seed
cd ..
```

### 3. Run Web Application (Frontend + Backend Concurrently)
```bash
npm run dev
```
* **Frontend Application:** `http://localhost:5173`
* **Backend Gateway:** `http://localhost:5000/api/v1`
* **API Health Check:** `http://localhost:5000/api/v1/health`

### 4. (Optional) Run Virtual Smart-Bin Fleet Simulator
In a separate terminal window:
```bash
node iot/simulator/fleet_simulator.js
```
* Emulates live ultrasonic fill changes, weight readings, and temperatures across 20 Srinagar smart bins, streaming real-time updates over WebSocket to the Leaflet map at `/bins`.

---

## 4. Default Demo Accounts (1-Click Viva Evaluation)

The web login page features **⚡ 1-Click Quick Demo Login Pills** so examiners can switch roles instantly:

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **Citizen** | `citizen@ecocycle.local` | `Citizen@123` | AI Scan, Composting Guide, P2P Resource Exchange, GIS Dumping Complaints, Eco-Credits Ledger |
| **Driver** | `driver@ecocycle.local` | `Driver@123` | Turn-by-turn VRP manifest, HTML5 Live GPS tracking, Stop check-off, 500m proximity triggers |
| **Admin** | `admin@ecocycle.local` | `Admin@123` | City KPI Overview, Smart-bin provisioning & hardware tokens, Dumping complaint verification (+50 pts) |

---

## 5. Verification & Automated Test Suite

Run full backend unit and integration test suites:
```bash
cd backend
npm test
```
**Results:** All 8 test suites passed, 44/44 tests passed with zero failures.

---

## 6. Academic Documentation & Viva Defense Guide
* **Master Architecture & SRS Specification:** [`srs_and_architecture_specification.md`](file:///C:/Users/Faysa/.gemini/antigravity/brain/828e225e-db96-484b-8b5b-4b4484d90156/srs_and_architecture_specification.md)
* **Comprehensive Implementation Walkthrough:** [`walkthrough.md`](file:///C:/Users/Faysa/.gemini/antigravity/brain/828e225e-db96-484b-8b5b-4b4484d90156/walkthrough.md)
* **Academic Benchmark Report:** [`docs/benchmark_report.md`](file:///d:/Waste%20management/docs/benchmark_report.md)
* **Viva Defense Guide & Demonstration Script:** [`docs/viva_defense_guide.md`](file:///d:/Waste%20management/docs/viva_defense_guide.md)
* **ESP32 Circuit Schematic & Electrical Derivation:** [`iot/firmware/schematic/circuit_diagram.md`](file:///d:/Waste%20management/iot/firmware/schematic/circuit_diagram.md)
