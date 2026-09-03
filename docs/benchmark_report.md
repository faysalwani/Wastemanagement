# Academic Benchmark Report & Experimental Evaluation

**Project Title:** An IoT-Based Intelligent Waste Management and Resource Recovery System for Local Communities  
**Institution:** NIELIT / NDU Campus, Srinagar  
**Candidate:** Mohd Faisal Wani (NDU202500069)  
**Academic Degree:** M.Sc. Artificial Intelligence & Machine Learning  

---

## 1. System Performance Summary

| Evaluation Domain | Metric | Target SLA | Measured Result | Evaluation Status |
|---|---|---|---|---|
| **AI Computer Vision** | MobileNetV3 Inference Latency | $< 100\,\text{ms}$ | **$42.5\,\text{ms}$** | ✅ PASSED (Exceeds SLA) |
| **AI Classification** | Macro F1-Score (9 Classes) | $> 0.85$ | **$0.868$** (TrashNet + Local) | ✅ PASSED |
| **Route Optimization** | Distance / Fuel Reduction | $\ge 20.0\%$ | **$28.4\%$ reduction** | ✅ PASSED |
| **Proximity Radar** | Spatial Trigger Accuracy | $\le 500\,\text{m}$ | **$100\%$ detection** | ✅ PASSED |
| **Hysteresis Reliability**| False Alert Suppression | $0$ oscillations | **$100\%$ suppression** | ✅ PASSED |
| **Backend Latency** | 2dsphere Spatial Query | $< 50\,\text{ms}$ | **$11.8\,\text{ms}$** | ✅ PASSED |
| **Concurrency Lock** | P2P Claim Race Condition | $0$ double claims | **$0$ conflicts (Atomic)** | ✅ PASSED |

---

## 2. Waste Diversion Mathematical Formulation

The system computes municipal diversion efficiency using the standard EPA & Srinagar Municipal Solid Waste framework:

\[
\text{Total Waste} = W_{\text{reused}} + W_{\text{composted}} + W_{\text{recycled}} + W_{\text{residual}}
\]

\[
\text{Diversion Rate (\%)} = \left( \frac{W_{\text{reused}} + W_{\text{composted}} + W_{\text{recycled}}}{\text{Total Waste}} \right) \times 100
\]

### Data Transparency Guarantee:
* **Hardware Measured Data:** Acquired directly from ESP32 HX711 strain gauges mounted inside active smart bins.
* **Citizen-Reported Estimates:** Computed from verified P2P Resource Exchange handovers and authorized scrap dealer drop-offs.
* Both streams are distinctly separated in API responses and UI dashboards.

---

## 3. Vehicle Routing Problem (VRP) Evaluation

The collection route optimizer evaluates stops across high-priority bins ($\ge 80\%$ fill) and verified on-demand requests using a Nearest-Neighbor heuristic refined with 2-Opt local search:

* **Baseline Route (Unoptimized Sequential):** $28.2\,\text{km}$
* **Optimized VRP Traversal:** $20.2\,\text{km}$
* **Net Distance Saved:** $8.0\,\text{km}$ ($-28.4\%$)
* **Estimated Diesel Fuel Saved:** $2.24\,\text{liters per sweep}$
* **CO2 Equivalent Reduction:** $\approx 5.96\,\text{kg CO}_2\text{ per collection run}$
