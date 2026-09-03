# An IoT-Based Intelligent Waste Management and Resource Recovery System for Local Communities

**Academic Major Project (Semester III)**  
**Programme:** M.Sc. Artificial Intelligence & Machine Learning  
**Institution:** National Institute of Electronics & Information Technology (NIELIT) / NDU Campus, Srinagar  
**Candidate:** Mohd Faisal Wani (Enrolment No: NDU202500069)  
**Supervisor / Evaluation Context:** Major Project Viva & Dissertation  

---

## System Philosophy
$$\text{Generate Less} \longrightarrow \text{Reuse} \longrightarrow \text{Compost/Recover} \longrightarrow \text{Recycle} \longrightarrow \text{Collect} \longrightarrow \text{Process} \longrightarrow \text{Dispose Only What Remains}$$

The system acts as a digital coordination layer bridging citizens, collection services, administrators, recyclers, and IoT smart bins across local communities.

---

## Monorepo Architecture
* **`backend/`**: Node.js + Express REST API, Socket.io real-time engine, Mongoose schemas with 2dsphere spatial indexing.
* **`frontend/`**: Vite + React SPA, Tailwind CSS, Lucide Icons, Leaflet interactive maps, Recharts analytics.
* **`ai-service/`**: Python FastAPI microservice with MobileNetV3 waste classification and Google OR-Tools route optimizer.
* **`iot/`**: ESP32 C++ firmware with circuit schematics + Virtual Smart-Bin Fleet Simulator.
* **`docs/`**: Architecture diagrams, SRS, API documentation, and viva defense slides.

---

## Quick Start (Development)

### Prerequisites
* Node.js v18+ (Current environment: v24.19.0)
* Python 3.10+ (Current environment: 3.13.14)
* MongoDB (Auto-falls back to embedded memory server if local daemon is inactive)

### Installation
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

### Running the System
```bash
# Starts both Backend (Port 5000) and Frontend (Port 5173) concurrently:
npm run dev
```

* **Frontend Web App:** `http://localhost:5173`
* **Backend API Gateway:** `http://localhost:5000/api/v1`
* **Health Check:** `http://localhost:5000/api/v1/health`
