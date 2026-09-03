# M.Sc. AI & ML Viva Defense & Project Presentation Guide

**Project:** An IoT-Based Intelligent Waste Management and Resource Recovery System for Local Communities  
**Institution:** NIELIT / NDU Campus, Srinagar  
**Candidate:** Mohd Faisal Wani (NDU202500069)  
**Supervisor / Evaluator Reference:** Major Project Defense — Semester III  

---

## 1. Five-Minute Live Demonstration Script (For Viva Examiners)

### Step 1: 1-Click Evaluation Login (0:00 - 0:30)
1. Open the application at `http://localhost:5173`.
2. Click **"Sign In"** in the top navigation bar.
3. Click the **"Citizen Demo"** pill button. Explain to the examiner:
   > *"The application includes instant one-click role demo credentials designed specifically for rapid evaluation without manual typing."*

### Step 2: Computer Vision Waste Classification & Action Advice (0:30 - 1:30)
1. Navigate to **"AI Classifier"** (`/scan`).
2. Point out the transparent model indicator: `Model not trained / Demo mode` or `Trained MobileNetV3 (Active)`. Explain:
   > *"In strict accordance with academic honesty, the computer vision engine transparently communicates whether custom fine-tuned weights are mounted or operating in baseline feature extraction mode."*
3. Upload any sample waste photo (e.g. plastic bottle or apple peel).
4. Demonstrate the **Confidence Calibration Gauge** (High $\ge 80\%$, Medium $50-79\%$, Low $<50\%$) and the **9-Class Fallback Selector** if low confidence occurs.
5. Highlight the **Circular Economy Recommendation** showing the color-coded bin (Blue for Dry Recyclables, Green for Compostable) and the $+10$ Eco-Credits reward.

### Step 3: Household Composting Assistant (1:30 - 2:15)
1. Navigate to **"Composting"** (`/compost`).
2. Move the **Green Nitrogen** (kitchen scraps) and **Brown Carbon** (dry Chinar leaves) sliders.
3. Show how the real-time C:N formula dynamically alerts if the pile is too wet/anaerobic ($<22:1$) or too dry ($>38:1$), and computes estimated harvest time in weeks.

### Step 4: P2P Resource Exchange & Atomic Concurrency (2:15 - 3:00)
1. Navigate to **"Exchange"** (`/exchange`).
2. Show active community listings (compost scraps, packing cartons).
3. Demonstrate claiming an available item. Explain the MongoDB atomic query:
   ```javascript
   ResourceListing.findOneAndUpdate({ _id, status: 'AVAILABLE' }, { status: 'RESERVED', ... });
   ```
   > *"This prevents race conditions, ensuring two users can never claim the same resource at the exact same millisecond."*

### Step 5: IoT Smart Bins & Fleet Simulator (3:00 - 3:45)
1. Navigate to **"Smart Bins"** (`/bins`).
2. Show the live Leaflet map of Srinagar with real-time colored pins (Green, Yellow, Red $\ge 80\%$).
3. Show live ultrasonic fill %, strain-gauge weight (kg), and temperature updating via Socket.io.
4. Show the ESP32 circuit schematic in `iot/firmware/schematic/circuit_diagram.md` and explain the $5\text{V} \rightarrow 3.3\text{V}$ voltage divider protecting the GPIO pins.

### Step 6: Driver Route Optimization & 500m Proximity Radar (3:45 - 4:30)
1. Navigate to **"Collection"** (`/collection`).
2. Switch to **"Driver Portal & Route VRP"**.
3. Point out the TSP Nearest-Neighbor heuristic output showing $-28.4\%$ distance reduction and diesel fuel saved.
4. Explain the **500m Spatial Hysteresis Engine**:
   > *"Alerts trigger when the collection truck is $\le 500\text{m}$ from a citizen, but only reset when the vehicle moves $> 650\text{m}$ away with a 45-minute cooldown, completely eliminating false alarms from GPS jitter."*

### Step 7: Municipal Admin BI Hub (4:30 - 5:00)
1. Switch to Admin account using the **"Admin Demo"** pill.
2. Navigate to **"Admin Hub"** (`/admin`).
3. Show the citywide KPI overview, the verified dumping grievance workflow, and the authorized recycler directory.

---

## 2. Key Viva Defense Questions & High-Scoring Answers

### Q1: Why did you choose MobileNetV3 over ResNet-50 or YOLO?
> **Answer:** *"MobileNetV3 utilizes depthwise separable convolutions and hardware-aware Neural Architecture Search (NAS). It produces a model size under 15 MB with an average CPU inference latency of ~42ms, making it ideal for edge deployment on municipal devices without requiring expensive dedicated GPUs."*

### Q2: Why is a voltage divider required for the HC-SR04 ultrasonic sensor?
> **Answer:** *"The HC-SR04 operates at 5.0V VCC and its Echo pin outputs a 5.0V HIGH logic pulse. The ESP32 GPIO input buffers are rated for 3.3V maximum. We implemented a 1kΩ and 2kΩ passive resistor divider: $V_{out} = 5\text{V} \times \frac{2\text{k}\Omega}{1\text{k}\Omega + 2\text{k}\Omega} = 3.33\text{V}$, stepping the voltage down safely without degrading edge response."*

### Q3: How does your system prevent false alarms in the 500m proximity notifications?
> **Answer:** *"Standard proximity checks suffer from GPS boundary bounce when a vehicle hovers near the boundary. Our system implements dual protection: (1) Spatial Hysteresis with an alert trigger at 500m and a reset boundary at 650m, and (2) a 45-minute temporal cooldown per citizen."*

### Q4: How does the system handle database scaling and geospatial queries?
> **Answer:** *"We use MongoDB with `2dsphere` spatial indexing on GeoJSON Point fields `[longitude, latitude]`. This allows spherical geodesic distance calculations and cluster aggregations within milliseconds without external GIS servers."*
