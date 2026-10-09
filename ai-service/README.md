# AI Computer Vision & Route Optimization Microservice
**Architecture:** Python FastAPI + PyTorch MobileNetV3-Small + Google OR-Tools  
**Port:** `http://localhost:8000`

---

## 1. Trained Waste Classifier Model (`waste_model.pt`)

The fine-tuned **MobileNetV3-Small** neural network weights are included in [`models/waste_model.pt`](models/waste_model.pt) (5.95 MB).  
**You do NOT need to retrain this model on your home PC.** It is ready for immediate production inference.

### Empirical Test Set Metrics (1,364 Unseen Holdout Images)
- **Overall Accuracy:** **94.94%**
- **Macro F1-Score:** **0.9517**
- **Weighted F1-Score:** **0.9493**
- **Average Inference Latency:** **1.24 ms** per image
- **Model File Size:** **5.95 MB**

### Supported 9 Waste Classes & Test Performance
1. **Plastic:** Precision: 94.8% | Recall: 91.7% | F1: **0.932** (Blue Bin)
2. **Paper/Cardboard:** Precision: 95.5% | Recall: 95.0% | F1: **0.953** (Blue Bin)
3. **Glass:** Precision: 96.4% | Recall: 90.0% | F1: **0.931** (Blue Bin)
4. **Metal:** Precision: 91.4% | Recall: 95.5% | F1: **0.934** (Blue Bin)
5. **Organic/Food Waste:** Precision: 97.3% | Recall: 98.0% | F1: **0.976** (Green Bin)
6. **E-Waste:** Precision: 98.1% | Recall: 96.2% | F1: **0.971** (Yellow Bin - SIDCO Rangreth)
7. **Textile:** Precision: 95.1% | Recall: 96.7% | F1: **0.959** (Blue Bin)
8. **Hazardous/Special Waste:** Precision: 95.2% | Recall: 99.3% | F1: **0.972** (Red Bin)
9. **Residual Waste:** Precision: 92.9% | Recall: 94.4% | F1: **0.937** (Black Bin)

---

## 2. Quickstart on Your Home PC

No model training is required. Simply start the microservice:

```bash
cd ai-service
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Health Check:** `http://localhost:8000/health`
- **Evaluation Report:** `http://localhost:8000/evaluate`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`

---

## 3. Endpoints

- `GET /health`: Reports model status (`isTrained: true`), device, and the 9 classes.
- `POST /classify`: Upload a waste photo (`multipart/form-data`, key: `image`). Returns predicted category, confidence %, confidence level, and top 3 probabilities.
- `GET /evaluate`: Returns empirical academic metrics, confusion matrix data, and per-class precision/recall/F1.
