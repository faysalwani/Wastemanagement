# EcoCycle Srinagar — AI Inference Microservice

**Standalone Deep Learning Microservice for 9-Class Municipal Waste Stream Classification**  
**Architecture:** Python FastAPI + PyTorch MobileNetV3-Small (Transfer Learning) + Google OR-Tools  
**Default Port:** `8000`

---

## 1. Overview & Architecture

The `ai-service` is an independent, containerized microservice that provides real-time computer vision classification for household solid waste items. It is decoupled from the Node.js application backend and can be hosted, scaled, updated, and deployed independently on any cloud container service (e.g., Render, Railway, AWS ECS, GCP Cloud Run, Docker).

### Architecture Highlights
* **Neural Network Backbone:** MobileNetV3-Small with inverted residual blocks and squeeze-and-excitation attention modules.
* **Trained Weights:** Pre-packaged in [`models/waste_model.pt`](models/waste_model.pt) (6.24 MB).
* **Zero Cold-Start Lag:** Neural weights are loaded into memory **once** at service startup (`WasteClassifier` singleton), serving requests with sub-15ms CPU inference.
* **Independent Preprocessing:** Deterministic RGB resize to $(224 \times 224)$, Tensor conversion, and ImageNet normalization ($\mu = [0.485, 0.456, 0.406], \sigma = [0.229, 0.224, 0.225]$).

---

## 2. Supported Waste Classes & Empirical Metrics

The model classifies waste into 9 standardized municipal categories:

| Index | Category | Target Disposal Bin | Precision | Recall | F1-Score |
|:---:|---|---|:---:|:---:|:---:|
| 0 | **Plastic** | Blue (Dry / Recyclable) | 94.8% | 91.7% | 0.932 |
| 1 | **Paper/Cardboard** | Blue (Dry / Recyclable) | 95.5% | 95.0% | 0.953 |
| 2 | **Glass** | Blue (Dry / Recyclable) | 96.4% | 90.0% | 0.931 |
| 3 | **Metal** | Blue (Dry / Recyclable) | 91.4% | 95.5% | 0.934 |
| 4 | **Organic/Food Waste**| Green (Compostable / Biodegradable) | 97.3% | 98.0% | 0.976 |
| 5 | **E-Waste** | Yellow (Certified Scrap Depot) | 98.1% | 96.2% | 0.971 |
| 6 | **Textile** | Blue (Dry / Recyclable) | 95.1% | 96.7% | 0.959 |
| 7 | **Hazardous/Special** | Red (Hazardous Isolation) | 95.2% | 99.3% | 0.972 |
| 8 | **Residual Waste** | Black (Sanitary Landfill) | 92.9% | 94.4% | 0.937 |

### Summary Test Set Performance (1,364 Unseen Test Images)
* **Overall Accuracy:** **94.94%**
* **Macro F1-Score:** **0.9517**
* **Weighted F1-Score:** **0.9493**
* **Average Inference Latency:** **1.24 ms** per image

---

## 3. Local Setup & Execution (Standalone)

No training is required for local execution. The production model weights are bundled directly inside `models/waste_model.pt`.

### Step 1: Create Virtual Environment
```bash
cd ai-service

# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Start Microservice
```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

* **Interactive OpenAPI Docs:** [`http://localhost:8000/docs`](http://localhost:8000/docs)
* **Health Check:** [`http://localhost:8000/health`](http://localhost:8000/health)
* **Model Info:** [`http://localhost:8000/model-info`](http://localhost:8000/model-info)

---

## 4. Docker Deployment

The service includes a production-ready, multi-stage cached `Dockerfile` and `.dockerignore`.

### Build Docker Image
```bash
docker build -t ecocycle-ai-service .
```

### Run Container
```bash
docker run -d \
  --name ecocycle-ai \
  -p 8000:8000 \
  --restart unless-stopped \
  -e PORT=8000 \
  ecocycle-ai-service
```

### Verify Container Health
```bash
curl http://localhost:8000/health
```

---

## 5. REST API Specification

### 1. Health Status
* **`GET /health`**
```json
{
  "status": "HEALTHY",
  "service": "EcoCycle Srinagar AI Microservice",
  "isTrained": true,
  "classes": ["Plastic", "Paper/Cardboard", "Glass", ...],
  "device": "cpu",
  "torchAvailable": true
}
```

### 2. Model Information & Version
* **`GET /model-info`** (or `GET /version`)
```json
{
  "success": true,
  "modelName": "MobileNetV3-Small 9-Class Waste Classifier",
  "modelVersion": "1.0.0",
  "architecture": "MobileNetV3-Small",
  "classesCount": 9,
  "classes": ["Plastic", "Paper/Cardboard", ...],
  "inputResolution": [224, 224],
  "isTrained": true,
  "device": "cpu",
  "torchAvailable": true,
  "modelSizeBytes": 6239743
}
```

### 3. Waste Image Classification
* **`POST /classify`**
  - **Header:** `Content-Type: multipart/form-data`
  - **Body Parameter:** `image` (binary file: JPEG, PNG, or WebP; maximum 5 MB)
  - *(Optional)* `X-API-Key: your_server_secret` (if configured in production)

**Example `curl` Request:**
```bash
curl -X POST http://localhost:8000/classify \
  -F "image=@sample_bottle.jpg;type=image/jpeg"
```

**Example JSON Response:**
```json
{
  "success": true,
  "filename": "sample_bottle.jpg",
  "predictedCategory": "Plastic",
  "confidence": 93.8,
  "confidenceLevel": "HIGH",
  "topPredictions": [
    { "category": "Plastic", "probability": 93.8 },
    { "category": "Glass", "probability": 4.1 },
    { "category": "Residual Waste", "probability": 1.2 }
  ],
  "modelStatus": "Trained MobileNetV3 (Active)",
  "modelVersion": "1.0.0",
  "inferenceTimeMs": 1.85,
  "architecture": "MobileNetV3-Small (9 Classes)",
  "imageDimensions": { "width": 800, "height": 600 }
}
```

### 4. Academic Evaluation Report
* **`GET /evaluate`**
  - Returns empirical accuracy, confusion matrix data, and per-class precision, recall, and F1 measured on the 1,364-image test set.

---

## 6. Training Pipeline (`train_9class.py`)

For researchers or students seeking to retrain or fine-tune the model with new local waste imagery:

### Training Overview
* **Script:** [`train_9class.py`](train_9class.py)
* **Optimization:** AdamW ($\text{LR} = 0.0005$, $\text{weight decay} = 10^{-4}$), ReduceLROnPlateau scheduler.
* **Loss Function:** Weighted Cross-Entropy Loss to address dataset class imbalance.
* **Data Augmentation:** RandomHorizontalFlip, RandomRotation(15°), ColorJitter, RandomAffine.
* **Splits:** 70% Train, 15% Validation, 15% Holdout Test (stratified).

### How to Run Retraining
```bash
python train_9class.py
```
Upon completion, the script automatically:
1. Validates holdout test performance.
2. Saves updated weights to `models/waste_model.pt`.
3. Emits `evaluation/metrics.json`, `evaluation/confusion_matrix_9class.png`, and `evaluation/training_curves_9class.png`.

---

## 7. Operational & Hardware Resource Guidelines

| Resource | Minimum Requirement | Recommended for Production |
|---|---|---|
| **CPU** | 1 vCPU (x86_64 or ARM64) | 2 vCPU |
| **RAM** | 512 MB | 1 GB - 2 GB |
| **Disk Space** | 300 MB (Container image) | 500 MB |
| **GPU** | Not required (Inference $< 15\text{ ms}$ on CPU) | Optional for massive throughput ($> 500\text{ req/s}$) |
| **Cold Start** | $< 1.5\text{ s}$ container boot | Instant with warm keep-alive |

---

## 8. Zero-Downtime Model Updates & Rollback

Because the model file is decoupled:
1. **Update Weights:** Place new weights in `models/waste_model.pt` and restart the container, or mount the `models/` directory as an external volume:
   ```bash
   docker run -v /host/path/models:/app/models -p 8000:8000 ecocycle-ai-service
   ```
2. **Rollback:** To rollback, simply restore the prior `waste_model.pt` file and trigger a container restart. The backend and frontend require **zero code changes or redeployments**.
