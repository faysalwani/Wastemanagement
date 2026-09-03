# AI Computer Vision & Route Optimization Microservice
**Architecture:** Python FastAPI + PyTorch MobileNetV3 + Google OR-Tools  
**Port:** `http://localhost:8000`

## Features
1. **Waste Image Classification:** 9-class deep convolutional network (MobileNetV3 / EfficientNet-B0) with confidence scoring.
2. **Academic Evaluation Harness:** Computes Accuracy, Precision, Recall, Macro F1, and Confusion Matrix.
3. **Route Optimization Solver:** Capacitated Vehicle Routing Problem (CVRP) with Google OR-Tools.

## Local Execution
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```
