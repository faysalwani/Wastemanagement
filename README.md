# EcoCycle Srinagar — Smart Waste & Resource Recovery System

> **An IoT-Based Intelligent Waste Management and Resource Recovery System for Local Communities**  
> **Academic Major Project (Semester III/IV)** — M.Sc. Artificial Intelligence & Machine Learning  
> **Institution:** National Institute of Electronics & Information Technology (NIELIT) / NDU Campus, Srinagar  
> **Candidate:** Mohd Faisal Wani (Enrolment No: `NDU202500069`)  
> **Evaluation Context:** Major Project Viva & Dissertation Defense

[![Backend Tests](https://img.shields.io/badge/backend%20tests-124%2F124%20passing-brightgreen.svg)]()
[![Test Suites](https://img.shields.io/badge/test%20suites-15%2F15%20passed-success.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-blue.svg)]()
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)]()
[![PyTorch](https://img.shields.io/badge/PyTorch-MobileNetV3-orange.svg)]()
[![ESP32](https://img.shields.io/badge/ESP32-FreeRTOS%20C%2B%2B-red.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

---

## Table of Contents
1. [Executive Summary & Core Philosophy](#1-executive-summary--core-philosophy)
2. [What the System Does](#2-what-the-system-does)
   - [Citizen Portal](#21-citizen-portal)
   - [Municipal Admin Operations Hub](#22-municipal-admin-operations-hub-11-production-modules)
   - [Driver Logistics & Navigation Panel](#23-driver-logistics--navigation-panel)
   - [Super Admin Security & Governance Console](#24-super-admin-security--governance-console)
3. [Technology Stack](#3-technology-stack)
4. [Monorepo Architecture & Directory Layout](#4-monorepo-architecture--directory-layout)
5. [Prerequisites & System Requirements](#5-prerequisites--system-requirements)
6. [Step-by-Step Setup Guide (From Scratch)](#6-step-by-step-setup-guide-from-scratch)
   - [Step 1: Clone & Directory Navigation](#step-1-clone--directory-navigation)
   - [Step 2: Environment Configuration](#step-2-environment-configuration)
   - [Step 3: Dependency Installation](#step-3-dependency-installation)
   - [Step 4: Database Seeding](#step-4-database-seeding)
   - [Step 5: Running the System](#step-5-running-the-system)
   - [Step 6: (Optional) Running the AI Classification Microservice](#step-6-optional-running-the-ai-classification-microservice)
   - [Step 7: (Optional) Running the Virtual IoT Fleet Simulator](#step-7-optional-running-the-virtual-iot-fleet-simulator)
   - [Step 8: (Alternative) Running via Docker Compose](#step-8-alternative-running-via-docker-compose)
7. [Authentication, Security & Role-Based Access Control (RBAC)](#7-authentication-security--role-based-access-control-rbac)
   - [Public Citizen Registration Flow](#public-citizen-registration-flow)
   - [Staff & Privileged Login (Driver, Admin, Super Admin)](#staff--privileged-login-driver-admin-super-admin)
   - [Pre-Configured Evaluation Accounts](#pre-configured-evaluation-accounts)
8. [AI Microservice (MobileNetV3 & VRP Engine)](#8-ai-microservice-mobilenetv3--vrp-engine)
9. [IoT Hardware & Embedded Firmware](#9-iot-hardware--embedded-firmware)
10. [Scientific Formulas & Mathematical Formulations](#10-scientific-formulas--mathematical-formulations)
11. [REST API & Real-Time WebSocket Catalog](#11-rest-api--real-time-websocket-catalog)
12. [Automated Verification & Test Suites](#12-automated-verification--test-suites)
13. [Troubleshooting & Frequently Asked Questions (FAQ)](#13-troubleshooting--frequently-asked-questions-faq)
14. [Academic Dissertation References](#14-academic-dissertation-references)

---

## 1. Executive Summary & Core Philosophy

**EcoCycle Srinagar** is an intelligent, cyber-physical municipal waste management and resource recovery platform designed for local urban communities, specifically tailored to the geographical and infrastructural topography of **Srinagar, Jammu & Kashmir**.

### The Core Paradigm
$$\text{Generate Less} \longrightarrow \text{Reuse} \longrightarrow \text{Compost / Recover} \longrightarrow \text{Recycle} \longrightarrow \text{Collect} \longrightarrow \text{Process} \longrightarrow \text{Dispose Only What Remains}$$

Traditional municipal solid waste (MSW) approaches rely on static, blind collection schedules, causing overflowing dumpsters, high fuel consumption, and illegal open dumping along sensitive water bodies (e.g., Dal Lake, Jhelum River). **EcoCycle Srinagar** solves this through a multi-tiered architecture combining:
1. **IoT Smart Dustbins:** ESP32 nodes with ultrasonic fill telemetry and load-cell weight estimation.
2. **Deep Learning Vision:** MobileNetV3 CNN for real-time household waste stream classification.
3. **Vehicle Routing Problem (VRP):** Dynamic, capacity-constrained route optimization using Google OR-Tools.
4. **Decentralized Resource Recovery:** Community composting carbon-to-nitrogen ($C:N$) balancing, peer-to-peer (P2P) reusable item swapping, and certified scrap depot directory.
5. **Traceable Eco-Credits Economy:** Auditable double-entry reward points redeemable for physical composting equipment, segregation bins, and reusable bags.

---

## 2. What the System Does

The platform is structured into four distinct, role-segregated portals:

```
                            ┌─────────────────────────────────────────┐
                            │          EcoCycle Srinagar Grid         │
                            └────────────────────┬────────────────────┘
                                                 │
         ┌───────────────────┬───────────────────┼───────────────────┬───────────────────┐
         ▼                   ▼                   ▼                   ▼                   ▼
   [ CITIZEN ]         [ DRIVER ]          [ ADMIN ]       [ SUPER ADMIN ]         [ IoT BINS ]
• AI Waste Scanner   • Route Navigation  • 11 Admin Tabs    • Root Governance   • Ultrasonic (N=5)
• Compost Assistant  • Stop Manifest     • VRP Dispatch     • User Escalation   • HX711 Load Cell
• P2P Exchange       • Live GPS Tracking • Smart-Bin Health • Audit Logs        • HTTP / Socket.io
• Collection Radar   • Proximity Alerts  • Waste Analytics  • System Bootstrap  • 20 Srinagar Bins
• Dumping Grievance  • Pickup Logging    • Marketplace/Orders                   • Hardware Alerts
• Eco-Credits Wallet                     • Scrap Recyclers
• Rewards Shop                           • Reward Multipliers
```

### 2.1 Citizen Portal
* **AI Waste Classifier:** Citizens capture or upload a waste photo. The system uses a transfer-learned MobileNetV3 CNN model to classify the waste into 9 categories (Organic, Plastic, Paper, Metal, Glass, E-Waste, Biomedical, Hazardous, Residual), providing disposal recommendations and awarding Eco-Credits (`+10 EC`).
* **Scientific Composting Assistant:** Real-time $C:N$ ratio calculator. Citizens log organic waste inputs (kitchen scraps, dry leaves), receive balance recommendations (aiming for the optimal $25:1$ to $30:1$ ratio), track fermentation stages, and earn verification credits (`+20 EC`).
* **P2P Resource Exchange:** A hyper-local marketplace where citizens list clean reusable items (cardboard boxes, glass jars, wooden pallets, excess compost) for neighbours to claim, preventing landfill entry (`+25 EC`).
* **Doorstep Collection Radar:** Real-time schedule calendar and on-demand special pickup booking (e.g., bulk garden pruning, e-waste). When a municipal truck enters within a **500-meter radius**, the citizen receives a live audio-visual proximity notification.
* **Geotagged Dumping Grievance Reporting:** Citizens report open illegal dumps with camera capture, automatic GPS geotagging, and ward mapping. When municipal squads resolve the site, the citizen receives verification credits (`+50 EC`).
* **Eco-Credits Wallet & Tier System:** Full cryptographic-style double-entry ledger tracking all earned points with progression across **Bronze**, **Silver**, **Gold**, and **Eco-Champion** tiers. Displays personal landfill diversion efficiency:
  $$\text{Personal Diversion Rate} = \frac{\text{Mass Composted} + \text{Mass Exchanged}}{\text{Total Household Waste}} \times 100$$
* **Rewards Marketplace:** An e-commerce store with dual-pricing where citizens spend earned Eco-Credits (or INR cash) on composting kits, segregation bins, reusable jute bags, and aerator spirals. Features atomic stock reservation and instant compensating refunds upon cancellation.
* **Verified Recyclers Directory:** Searchable directory and OpenStreetMap GIS showing certified scrap dealers and authorized municipal recovery centers filtered by accepted material (PET, glass, paper, e-waste).

### 2.2 Municipal Admin Operations Hub (11 Production Modules)
1. **City Overview:** Real-time Srinagar municipal telemetry, urgent bins ($\ge 80\%$), pending pickup requests, active fleet vehicles, and city-wide diversion metrics.
2. **Collection Requests:** Review, accept, schedule, and assign citizen on-demand doorstep pickup requests to designated vehicles.
3. **Route Dispatch (VRP):** OpenStreetMap GIS displaying smart bins and pickup stops. Solves vehicle routing with capacity constraints and outputs driver manifests.
4. **Smart Bins Telemetry:** Real-time grid monitoring of all physical and simulated smart dustbins across Srinagar wards (Nishat, Shalimar, Lal Chowk, Dalgate, Hazratbal, Karan Nagar, Rajbagh).
5. **IoT Hardware Alerts:** Automated threshold alerts triggered when bins cross $80\%$ capacity or when ESP32 devices drop offline. Supports administrative acknowledgment and resolution workflows.
6. **Fleet & Drivers:** Real-time driver roster, vehicle payload status, active GPS telemetry, and maintenance status.
7. **Waste Diversion Analytics:** Aggregated municipal metrics separating waste streams into Reused, Composted, Recycled, and Residual Landfill.
8. **Rewards Store & Orders:** Manage the rewards catalog (add/edit products, stock control, dual pricing) and fulfill redemptions through the status lifecycle: `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `READY` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`.
9. **Recyclers Directory:** Administer authorized scrap dealer listings, update operating hours, accepted scrap materials, and geo-coordinates.
10. **Eco-Credits Configuration:** Dynamically calibrate reward point multipliers for all citizen actions (`compostingPoints`, `dumpingReportPoints`, `recyclingDropOffPoints`, `resourceExchangePoints`, `sourceSegregationPoints`) with zero server restarts.
11. **Reports Export:** Instant compilation and download of municipal operations reports and audit manifests.

### 2.3 Driver Logistics & Navigation Panel
* **Live GPS Tracking & Route Manifest:** Drivers view their assigned vehicle, turn-by-turn collection sequence, and destination stops ordered by optimal travel distance.
* **500-Meter Citizen Proximity Broadcast:** As the vehicle moves along its route, the backend continuously computes Haversine distances against citizen coordinates and fires automatic WebSocket alerts (`vehicle_proximity_alert`) to households within 500m.
* **Bin Clearance Check-Off:** Drivers verify bin emptyings and log measured net collection weight (kg).

### 2.4 Super Admin Security & Governance Console
* **Root Access Governance:** Manage administrative staff accounts, inspect system-wide audit trails (`AuditLog`), view privileged actions, and manage user tier elevation.
* **Bootstrap Reconciliation:** Securely reconciles the initial Super Admin account defined in `.env` without compromising public citizen registration endpoints.

---

## 3. Technology Stack

| Layer | Technologies & Libraries | Purpose |
|---|---|---|
| **Frontend UI/UX** | React 18, Vite, Tailwind CSS, Lucide React, Canvas Confetti | Responsive Single Page Application (SPA), role-tailored dashboards |
| **Interactive GIS Maps** | Leaflet, React-Leaflet, OpenStreetMap Tile API | Ward bin maps, vehicle GPS telemetry, recycler depot locator |
| **Data Visualization** | Recharts | Municipal waste diversion curves, tier progress, and sensor trends |
| **Backend API Gateway** | Node.js, Express.js (REST API) | Central business logic, controllers, security middleware |
| **Real-time Bus** | Socket.io (WebSocket Engine) | Live bin fill telemetry, vehicle proximity alerts, notification center |
| **Database & ODM** | MongoDB Atlas / Local MongoDB, Mongoose 8 | Document store, geospatial `2dsphere` indexes, atomic `$inc` updates |
| **Authentication & RBAC** | JWT (JSON Web Tokens), bcryptjs, Nodemailer (Google SMTP) | Role-Based Access Control, real 6-digit email OTPs, password hashing |
| **AI Vision Microservice** | Python 3.10+, FastAPI, PyTorch, Torchvision, PIL | Transfer-learned MobileNetV3 9-class waste classifier, softmax calibration |
| **Operations Research** | Google OR-Tools (Python) | Capacitated Vehicle Routing Problem (CVRP) route optimization |
| **Embedded IoT Firmware** | ESP32, FreeRTOS C++, Arduino Core | Sensor polling, median filter ($N=5$), HTTP JSON payloads |
| **Sensors & Circuitry** | HC-SR04 (Ultrasonic), HX711 + Strain Gauge Load Cell | Non-contact depth measurement, bin tare/gross weight calculation |
| **Testing & Quality** | Jest, Supertest, mongodb-memory-server | 15 automated test suites, 124 passing unit/integration tests |
| **Containerization** | Docker, Docker Compose | Multi-container microservice orchestration |

---

## 4. Monorepo Architecture & Directory Layout

```
Waste management/
├── package.json                    # Monorepo root scripts (dev, install:all, test)
├── docker-compose.yml              # Complete 4-service container stack
├── README.md                       # This comprehensive documentation
│
├── backend/                        # Node.js + Express + Socket.io Server
│   ├── package.json
│   ├── .env.example                # Environment configuration template
│   ├── .env                        # Local active environment (not checked into git)
│   ├── src/
│   │   ├── server.js               # Express app, HTTP server, Socket.io bootstrap
│   │   ├── config/                 # Database connection & Atlas configuration
│   │   ├── middleware/             # authMiddleware (protect, authorize), error handlers
│   │   ├── models/                 # Mongoose schemas (User, SmartBin, Order, Product, etc.)
│   │   ├── controllers/            # Business logic for auth, marketplace, credits, IoT, etc.
│   │   ├── routes/                 # REST endpoint routers (/auth, /marketplace, /iot, etc.)
│   │   ├── seeds/seedDatabase.js   # Production database seeder for Srinagar wards & accounts
│   │   └── utils/                  # VRP solver, OTP generator, email sender, audit logger
│   └── tests/                      # 15 Jest automated test suites (124 tests)
│
├── frontend/                       # React 18 + Vite SPA
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx                 # Route definitions & ProtectedRoute boundaries
│       ├── context/                # AuthContext, SocketContext
│       ├── services/api.js         # Axios HTTP client with JWT interceptors
│       ├── components/             # Reusable UI components & NotificationCenter
│       │   └── admin/              # 11 Modular AdminHub feature tabs
│       └── pages/                  # CitizenDashboard, AdminHub, DriverDashboard,
│                                   # Marketplace, Wallet, Orders, Recyclers, etc.
│
├── ai-service/                     # Python FastAPI Deep Learning Microservice
│   ├── requirements.txt            # Python dependencies (FastAPI, PyTorch, torchvision, OR-Tools)
│   ├── train.py                    # MobileNetV3 transfer learning training pipeline
│   ├── src/
│   │   ├── main.py                 # FastAPI application endpoints (/classify, /optimize-route)
│   │   └── classifier.py           # PyTorch inference engine with confidence thresholding
│   └── models/                     # Serialized PyTorch model weights (.pth)
│
├── iot/                            # Physical Embedded Systems & Virtual Simulator
│   ├── firmware/                   # ESP32 C++ Production Firmware
│   │   ├── src/main.cpp            # FreeRTOS tasks, HC-SR04 median filter, HTTP client
│   │   └── schematic/              # Circuit diagram & voltage divider specifications
│   └── simulator/
│       └── fleet_simulator.js      # Virtual fleet generator (20 Srinagar bins, live telemetry)
│
└── docs/                           # Academic viva defense guides, benchmark reports
```

---

## 5. Prerequisites & System Requirements

Before beginning installation, ensure your host environment meets the following specifications:

| Requirement | Minimum Version | Recommended | Notes |
|---|---|---|---|
| **Operating System** | Windows 10/11, macOS 12+, Ubuntu 20.04+ | Windows 11 / Ubuntu 22.04 LTS | Tested extensively on Windows PowerShell |
| **Node.js** | v18.0.0 LTS | v20 LTS or v22 LTS | Verified on v24.19.0 |
| **npm** | v9.0.0 | v10+ | Bundled with Node.js |
| **Python** | 3.10 | 3.11 or 3.12 | Required for `ai-service` |
| **MongoDB** | Optional | MongoDB Atlas or Local v7.0 | *Zero-config fallback: system automatically starts an in-memory database if no URI is provided* |
| **Git** | 2.30+ | Latest | For repository cloning |

---

## 6. Step-by-Step Setup Guide (From Scratch)

Follow these exact steps to get the entire platform up and running on your local machine:

### Step 1: Clone & Directory Navigation
Open your terminal (PowerShell, Command Prompt, or Bash) and navigate to your workspace:
```bash
git clone https://github.com/faysalwani/Waste-management.git
cd "Waste-management"
```

---

### Step 2: Environment Configuration

Navigate to the `backend/` directory and configure your `.env` file:
```bash
cd backend
cp .env.example .env
```
*(On Windows PowerShell, use: `copy .env.example .env`)*

Open `backend/.env` in your text editor. The default configuration is ready for immediate local execution:

```ini
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection
# Option A: Local MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/waste_management_db
# Option B: Leave blank or set to 'memory' to use auto-started in-memory MongoDB
# Option C: MongoDB Atlas Cloud Cluster
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/waste_management_db?retryWrites=true&w=majority

# Security & Authentication
JWT_SECRET=super_secret_jwt_key_srinagar_smart_waste_2026_msc_ai
JWT_EXPIRE=7d

# AI Microservice URL
AI_SERVICE_URL=http://127.0.0.1:8000

# File Upload Settings
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5

# Geofence & Proximity Settings
PROXIMITY_ALERT_RADIUS_METERS=500
PROXIMITY_RESET_RADIUS_METERS=650
PROXIMITY_COOLDOWN_MINUTES=45

# SMTP Email Configuration (Google Gmail for Real OTP Delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
SMTP_FROM="EcoCycle Srinagar <no-reply@ecocycle.in>"

# Initial Super Admin Bootstrap (Elevated automatically upon signup or seeding)
SUPER_ADMIN_EMAIL=chief@ecocycle.gov
SUPER_ADMIN_NAME="Chief Municipal Officer"
SUPER_ADMIN_PHONE="+91 94190 12345"
SUPER_ADMIN_WARD="Ward 1 - Nishat"
```

> **Note on SMTP Email Configuration:**  
> If you do not configure Gmail credentials right away, the backend will log all generated 6-digit OTP codes directly to the terminal console during registration and login, allowing seamless local testing without an active mail server.

Return to the project root:
```bash
cd ..
```

---

### Step 3: Dependency Installation

Install dependencies across the monorepo root, backend, and frontend using the unified root command:
```bash
npm run install:all
```

*Or install individually if preferred:*
```bash
# Install root orchestrator dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

---

### Step 4: Database Seeding

Populate your database with realistic baseline data for Srinagar: 8 municipal wards, 20 smart bins, driver fleet vehicles, verified scrap recyclers, rewards marketplace products, default dynamic incentive points, and pre-configured user accounts:

```bash
cd backend
npm run seed
cd ..
```

*Expected output:*
```text
[Seed] Successfully connected to MongoDB.
[Seed] Cleared existing baseline data.
[Seed] Created Srinagar Municipal Wards & 20 Smart Bins.
[Seed] Created Fleet Vehicles & Assigned Drivers.
[Seed] Created Verified Recycler Depots & Marketplace Products.
[Seed] Initialized Dynamic Reward Multipliers.
[Seed] Created Seeded Accounts (Citizen, Driver, Admin, Super Admin).
[Seed] Database seeding completed successfully!
```

---

### Step 5: Running the System

Start both the **Backend API Gateway** and the **Frontend Web App** concurrently with a single command from the project root:

```bash
npm run dev
```

*Once booted, open your web browser:*
* **Frontend Web Application:** [`http://localhost:5173`](http://localhost:5173)
* **Backend REST API:** [`http://localhost:5000/api/v1`](http://localhost:5000/api/v1)
* **Backend Health Check:** [`http://localhost:5000/api/v1/health`](http://localhost:5000/api/v1/health)

---

### Step 6: (Optional) Running the AI Classification Microservice

To enable local deep-learning classification via PyTorch rather than using heuristic fallback:

1. Open a new terminal and navigate to `ai-service/`:
   ```bash
   cd ai-service
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI microservice:
   ```bash
   uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *The AI API documentation will be available at [`http://localhost:8000/docs`](http://localhost:8000/docs).*

---

### Step 7: (Optional) Running the Virtual IoT Fleet Simulator

To simulate live sensor readings (fill level fluctuations, weight shifts, temperature changes) across 20 smart bins deployed across Srinagar:

Open a separate terminal window and run:
```bash
npm run dev:simulator
```
*(or `node iot/simulator/fleet_simulator.js`)*

Watch live ultrasonic percentages stream over WebSockets into the Leaflet map at [`http://localhost:5173/smart-bins`](http://localhost:5173/smart-bins) and [`http://localhost:5173/admin`](http://localhost:5173/admin).

---

### Step 8: (Alternative) Running via Docker Compose

To run the entire system in isolated containers (MongoDB, AI Service, Node.js Backend, and React Frontend Nginx container):

```bash
docker-compose up --build
```

* **Frontend:** `http://localhost:5173`
* **Backend:** `http://localhost:5000`
* **AI Service:** `http://localhost:8000`
* **MongoDB:** `localhost:27017`

---

## 7. Authentication, Security & Role-Based Access Control (RBAC)

The authentication system is strictly divided into two distinct flows to guarantee production-grade security:

### Public Citizen Registration Flow
```
[ Public /register Page ]
           │
           ▼ (Enter Name, Email, Password, Ward, Phone)
[ POST /api/v1/auth/register ]
           │
           ▼ (Generates 6-Digit Cryptographic OTP, Hash stored with 10-min TTL)
[ Email Sent via Google SMTP / Console Log ]
           │
           ▼ (Citizen Enters OTP)
[ POST /api/v1/auth/verify-registration-otp ]
           │
           ▼
[ Account Activated with Role: CITIZEN ] ──> [ Redirected to /citizen Dashboard ]
```
* **Security Rule:** A public user can **never** select a privileged role (`DRIVER`, `ADMIN`, or `SUPER_ADMIN`) during registration. All public signups are locked to `CITIZEN`.

### Staff & Privileged Login (Driver, Admin, Super Admin)
Staff members and municipal officials authenticate via two-factor email OTP login:
```
[ Login Page (/login) ]
           │
           ▼ (Enter Privileged Email)
[ POST /api/v1/auth/send-login-otp ]
           │
           ▼ (Validates Staff Role & Sends OTP)
[ Citizen/Staff Receives 6-Digit Code ]
           │
           ▼ (Submit Code)
[ POST /api/v1/auth/verify-login-otp ]
           │
           ▼ (Issues Signed JWT with Role Claim)
[ Route to Dedicated Portal: /driver, /admin, or /super-admin ]
```

### Pre-Configured Evaluation Accounts
For examination and live demonstration, the following accounts are pre-seeded in the database:

| Portal | Email | Password / Auth Mode | Initial Eco-Credits | Primary Capabilities |
|---|---|---|---|---|
| **Citizen** | `citizen@ecocycle.local` | `Citizen@123` | **1,250 EC** (Gold Champion) | AI Scan, Composting Assistant, P2P Exchange, Collection Radar, Dumping Reports, Rewards Marketplace, Wallet |
| **Driver** | `driver@ecocycle.local` | OTP Login (`Driver@123`) | — | Active Route Manifest, Turn-by-Turn Waypoints, 500m Proximity Trigger, Bin Clearance Logging |
| **Admin** | `admin@ecocycle.local` | OTP Login (`Admin@123`) | — | 11 Municipal Operations Tabs, VRP Dispatch, Smart Bin Telemetry, Alert Management, Fleet Control, Product Catalog |
| **Super Admin** | `faysalwani9086@gmail.com` | OTP Login (`SuperAdmin@123`) | — | Root Governance, System Bootstrap Elevation, Audit Logs, Staff Account Role Assignments |

*(Note: During local development, the generated OTP is always printed to the backend terminal if SMTP is unconfigured).*

---

## 8. AI Microservice (MobileNetV3 & VRP Engine)

The `ai-service/` microservice provides deep learning inference and combinatorial route optimization.

### Waste Classification Architecture
* **Backbone:** MobileNetV3-Small pre-trained on ImageNet, fine-tuned via transfer learning.
* **Classifier Head:** Dropout (0.2) $\rightarrow$ Linear(1024, 256) $\rightarrow$ ReLU $\rightarrow$ Linear(256, 9 classes).
* **Output Classes:**
  1. `ORGANIC_BIODEGRADABLE` (Food scraps, vegetable peels, fruit waste)
  2. `PLASTIC_RECYCLABLE` (PET bottles, HDPE containers)
  3. `PAPER_CARDBOARD` (Office paper, cartons, newspaper)
  4. `METALS` (Aluminium beverage cans, tin containers)
  5. `GLASS` (Bottles, broken glass containers)
  6. `E_WASTE` (Circuit boards, batteries, electronic items)
  7. `BIOMEDICAL` (Bandages, syringes, medical waste)
  8. `HAZARDOUS` (Paints, chemical containers, aerosol cans)
  9. `NON_RECYCLABLE_RESIDUAL` (Sanitary waste, mixed contaminated trash)
* **Confidence Calibration:** If the maximum softmax probability falls below $0.45$, the model triggers an `UNCERTAIN` classification and prompts human confirmation or guidance.

### Route Optimization (Google OR-Tools)
* **Algorithm:** Capacitated Vehicle Routing Problem (CVRP) with Distance Matrix evaluation.
* **Objective:** Minimize total fleet fuel consumption and travel distance across Srinagar while guaranteeing no collection vehicle exceeds its maximum capacity (e.g., $3,500\text{ kg}$).

---

## 9. IoT Hardware & Embedded Firmware

### Hardware Specifications
* **Microcontroller:** ESP32-WROOM-32 (Dual-core Xtensa 32-bit LX6 @ 240MHz, 520 KB SRAM, Wi-Fi 802.11 b/g/n).
* **Fill Level Sensor:** HC-SR04 Ultrasonic Ranging Module ($2\text{ cm} - 400\text{ cm}$ range, $\pm 3\text{ mm}$ accuracy).
* **Weight Sensor:** $4 \times 50\text{ kg}$ Half-Bridge Strain Gauges with HX711 24-bit ADC amplifier.
* **Power Management:** Deep sleep mode ($10\mu\text{A}$ quiescent draw) with hourly wakeups or ultrasonic interrupt triggers.

### Ultrasonic Signal Processing ($N=5$ Median Filter)
To reject acoustic false echoes and floating trash reflections, the firmware samples five successive readings at 50ms intervals and passes them through a median filter:
```
Raw Readings: [ 45.2, 44.8, 120.0 (noise), 45.0, 45.3 ]
Sorted Array: [ 44.8, 45.0, 45.2, 45.3, 120.0 ]
Filtered Output: 45.2 cm (Noise artifact completely eliminated)
```

### Electrical Schematic Summary
Because the HC-SR04 `ECHO` line outputs $5\text{V}$ TTL logic while the ESP32 GPIO pins are rated for $3.3\text{V}$ maximum, a resistive voltage divider is required:
$$V_{\text{out}} = V_{\text{in}} \times \left( \frac{R_2}{R_1 + R_2} \right) = 5\text{V} \times \left( \frac{2\text{k}\Omega}{1\text{k}\Omega + 2\text{k}\Omega} \right) = 3.33\text{V}$$
*(Detailed schematic diagrams and pin maps are documented in [`iot/firmware/schematic/circuit_diagram.md`](iot/firmware/schematic/circuit_diagram.md)).*

---

## 10. Scientific Formulas & Mathematical Formulations

### 10.1 Municipal Waste Diversion Efficiency
Measures the percentage of solid waste diverted from entering landfills:
$$\text{Diversion Rate (\%)} = \left( \frac{M_{\text{reused}} + M_{\text{composted}} + M_{\text{recycled}}}{M_{\text{total waste generated}}} \right) \times 100$$
Where:
* $M_{\text{reused}}$: Verified mass exchanged via peer-to-peer resource swapping.
* $M_{\text{composted}}$: Organic waste mass converted to compost in community/home digesters.
* $M_{\text{recycled}}$: Scrap mass dropped off at certified recycling centers.

### 10.2 Composting Carbon-to-Nitrogen ($C:N$) Mass Balance
The scientific formula for balancing carbon-rich "browns" ($C_b, N_b, m_b$) and nitrogen-rich "greens" ($C_g, N_g, m_g$):
$$\left( \frac{C}{N} \right)_{\text{mix}} = \frac{m_b \cdot C_b + m_g \cdot C_g}{m_b \cdot N_b + m_g \cdot N_g}$$
The system alerts the citizen if $(C/N)_{\text{mix}} < 20:1$ (risk of anaerobic odor and ammonia release) or $(C/N)_{\text{mix}} > 35:1$ (decomposition slows significantly).

### 10.3 Haversine Proximity Geofencing
To trigger the 500-meter proximity notification as vehicles move:
$$d = 2R \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$
Where $R = 6,371,000\text{ m}$ (mean radius of Earth), $\phi$ is latitude in radians, and $\lambda$ is longitude in radians.

---

## 11. REST API & Real-Time WebSocket Catalog

### Core REST Endpoints

| Category | Method | Path | Access | Description |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/register` | Public | Submit details for citizen signup |
| **Auth** | `POST` | `/api/v1/auth/verify-registration-otp` | Public | Verify OTP & activate citizen account |
| **Auth** | `POST` | `/api/v1/auth/login` | Public | Password login for citizens |
| **Auth** | `POST` | `/api/v1/auth/send-login-otp` | Public | Request 6-digit staff/privileged login OTP |
| **Auth** | `POST` | `/api/v1/auth/verify-login-otp` | Public | Complete OTP login & obtain JWT |
| **Marketplace** | `GET` | `/api/v1/marketplace/products` | Public | Browse rewards catalog with category/stock filters |
| **Marketplace** | `POST` | `/api/v1/marketplace/orders` | Citizen | Place dual-currency order (Cash / Eco-Credits) |
| **Marketplace** | `PATCH`| `/api/v1/marketplace/orders/:id/cancel` | Citizen | Cancel order with instant inventory & credit refund |
| **Marketplace** | `PATCH`| `/api/v1/marketplace/orders/:id/status` | Admin | Update fulfillment status (`PROCESSING`, `DELIVERED`) |
| **Recyclers** | `GET` | `/api/v1/recyclers` | Public | Directory of certified scrap drop-off depots |
| **Recyclers** | `POST` | `/api/v1/recyclers` | Admin | Register new verified recycling facility |
| **Credits & Wallet** | `GET` | `/api/v1/credits/wallet` | Citizen | User tier ranking, stats & paginated ledger |
| **Credits & Wallet** | `GET` | `/api/v1/credits/my-diversion` | Citizen | Household waste diversion efficiency stats |
| **Credits & Wallet** | `GET` | `/api/v1/credits/config` | Public | Current dynamic reward points multipliers |
| **Credits & Wallet** | `PATCH`| `/api/v1/credits/config` | Admin | Modify point multipliers in real-time |
| **IoT Bins** | `GET` | `/api/v1/iot/bins` | Public/Auth | Live list of all smart bins & fill telemetry |
| **IoT Bins** | `POST` | `/api/v1/iot/telemetry` | Device/Auth | Ingest ultrasonic sensor telemetry payload |
| **IoT Alerts** | `GET` | `/api/v1/iot/alerts` | Admin | List active hardware and threshold alerts |
| **Logistics** | `GET` | `/api/v1/collection-requests` | Staff | View pending citizen doorstep pickup requests |
| **Logistics** | `POST` | `/api/v1/collection-requests` | Citizen | Request special bulky/e-waste pickup |
| **Reports** | `POST` | `/api/v1/reports` | Citizen | Submit photo & geotag of illegal dumping site |
| **Reports** | `PATCH`| `/api/v1/reports/:id/verify` | Admin | Approve grievance & award `+50 EC` to citizen |

### Real-Time WebSocket Events (`Socket.io`)

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `smartbin_telemetry_updated` | Server $\rightarrow$ Client | `{ binId, fillPercent, weightKg }` | Live sensor update received from hardware |
| `vehicle_proximity_alert` | Server $\rightarrow$ Client | `{ vehicleId, distanceMeters, ward }` | Fired to citizens within 500m of incoming truck |
| `collection_request_updated` | Server $\rightarrow$ Client | `{ requestId, status }` | Doorstep pickup accepted, scheduled, or completed |
| `dumping_report_verified` | Server $\rightarrow$ Client | `{ reportId, creditsAwarded: 50 }` | Fired when admin marks illegal dumping site resolved |
| `smartbin_alert_created` | Server $\rightarrow$ Admin | `{ binId, alertType: 'FILL_CRITICAL' }` | Fired when bin crosses $80\%$ threshold |

---

## 12. Automated Verification & Test Suites

The backend includes a comprehensive automated test suite built on **Jest** and **Supertest**, utilizing an isolated in-memory MongoDB server (`mongodb-memory-server`) to ensure reproducible, zero-side-effect test runs.

### Running the Test Suite
From the root directory or inside `backend/`:
```bash
npm test
```

### Verified Test Results (15/15 Passed)
```text
PASS  tests/marketplace_wallet_production.test.js
PASS  tests/auth_rbac_otp.test.js
PASS  tests/revised_auth_matrix.test.js
PASS  tests/logistics_iot.test.js
PASS  tests/auth.test.js
PASS  tests/exchange.test.js
PASS  tests/bootstrap_reconciliation.test.js
PASS  tests/citizen_compost_production.test.js
PASS  tests/admin_driver_production.test.js
PASS  tests/credits.test.js
PASS  tests/models.test.js
PASS  tests/academic_benchmarks.test.js
PASS  tests/ai.test.js
PASS  tests/recommendations.test.js
PASS  tests/health.test.js

Test Suites: 15 passed, 15 total
Tests:       124 passed, 124 total
Snapshots:   0 total
Time:        64.008 s
Ran all test suites.
```

### Verifying Frontend Production Build
To ensure zero broken imports, syntax errors, or bundling issues:
```bash
cd frontend
npm run build
```
*Output: `✓ 1764 modules transformed. Built cleanly in ~11s without errors.`*

---

## 13. Troubleshooting & Frequently Asked Questions (FAQ)

### Q1: I don't have a MongoDB server installed. Will the application run?
**Yes!** The backend is configured to automatically launch an embedded, in-memory MongoDB instance (`mongodb-memory-server`) if no local MongoDB instance is reachable and no Atlas URI is provided. You do not need to install MongoDB separately for testing.

### Q2: I don't see any emails arriving for OTP verification. Where is the OTP?
1. **Terminal Console Output:** If `SMTP_USER` and `SMTP_PASS` are left with default placeholder values in `backend/.env`, the system automatically logs the generated 6-digit OTP code directly to your backend terminal console in bold:  
   `[AUTH] Verification OTP for user@example.com: 482910`
2. **Gmail App Password Setup:** If you wish to send real emails, you must create a 16-character **Google App Password** (not your regular Gmail password):
   - Go to [Google Account Security](https://myaccount.google.com/security).
   - Ensure **2-Step Verification** is enabled.
   - Search for **App passwords**, create one named "EcoCycle", and paste the 16-character code into `SMTP_PASS` in `backend/.env`.

### Q3: When I run `npm run dev`, one of the ports is already in use (`EADDRINUSE: 5000` or `5173`).
On Windows PowerShell, find and kill the process occupying the port:
```powershell
# Check what is using port 5000
netstat -ano | findstr :5000
# Kill the process using its PID (replace <PID>)
taskkill /PID <PID> /F
```

### Q4: How do I access the Super Admin Console?
Login at [`http://localhost:5173/login`](http://localhost:5173/login) using the pre-seeded Super Admin account (`faysalwani9086@gmail.com` or whatever email is defined in `SUPER_ADMIN_EMAIL` in `backend/.env`). Submit the OTP displayed in your terminal console to enter the `/super-admin` portal.

---

## 14. Academic Dissertation References

This codebase forms the practical prototype and experimental basis for the M.Sc. Major Project dissertation:

* **Project Title:** *An IoT-Based Intelligent Waste Management and Resource Recovery System for Local Communities*
* **Author:** Mohd Faisal Wani
* **Candidate Enrolment:** `NDU202500069`
* **Academic Year:** 2025–2026
* **Academic Institution:** NIELIT / NDU Srinagar
* **Related Documentation:**
  - Complete SRS & Architecture Spec: [`srs_and_architecture_specification.md`](file:///C:/Users/Faysa/.gemini/antigravity/brain/828e225e-db96-484b-8b5b-4b4484d90156/srs_and_architecture_specification.md)
  - Full Technical Walkthrough: [`walkthrough.md`](file:///C:/Users/Faysa/.gemini/antigravity/brain/828e225e-db96-484b-8b5b-4b4484d90156/walkthrough.md)
  - Viva Defense Presentation Guide: [`docs/viva_defense_guide.md`](docs/viva_defense_guide.md)
  - Benchmark Performance Analysis: [`docs/benchmark_report.md`](docs/benchmark_report.md)
  - Embedded Circuit Schematics: [`iot/firmware/schematic/circuit_diagram.md`](iot/firmware/schematic/circuit_diagram.md)

---

<p align="center">
  <b>EcoCycle Srinagar</b> • NIELIT Deemed to be University • NDU Campus Srinagar<br/>
  <i>Smart Cities Mission • Resource Recovery Grid • M.Sc. AI & ML</i>
</p>
