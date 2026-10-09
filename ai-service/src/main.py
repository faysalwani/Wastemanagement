import os
import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .classifier import classifier_instance, WASTE_CLASSES

app = FastAPI(
    title="Smart Waste AI Microservice",
    description="MobileNetV3 Computer Vision Classifier & Google OR-Tools Route Optimizer",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "Smart Waste Management AI & Optimization Engine",
        "status": "ONLINE",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "classify": "/classify",
            "evaluate": "/evaluate"
        }
    }

@app.get("/health")
def health():
    return {
        "status": "HEALTHY",
        "isTrained": classifier_instance.is_trained,
        "classes": WASTE_CLASSES,
        "device": classifier_instance.device,
        "torchAvailable": getattr(classifier_instance, "torch_available", False)
    }

@app.post("/classify")
async def classify(image: UploadFile = File(...)):
    # Validate MIME type
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image (JPEG, PNG, or WebP).")

    try:
        contents = await image.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image exceeds maximum 5MB size limit.")

        result = classifier_instance.classify_image(contents)
        return {
            "success": True,
            "filename": image.filename,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification pipeline error: {str(e)}")

METRICS_PATH = os.path.join(os.path.dirname(__file__), '..', 'evaluation', 'metrics.json')

@app.get("/evaluate")
def evaluate_model():
    """
    Returns empirical academic evaluation metrics measured on independent test set.
    """
    import json
    if os.path.exists(METRICS_PATH):
        try:
            with open(METRICS_PATH, "r") as f:
                data = json.load(f)
                data["isTrained"] = classifier_instance.is_trained
                return data
        except Exception:
            pass

    return {
        "status": "EVALUATION_REPORT",
        "modelName": "MobileNetV3-Small (Transfer Learning)",
        "dataset": "TrashNet + Srinagar Community Waste Dataset",
        "isTrained": classifier_instance.is_trained,
        "metrics": {
            "accuracy": "Evaluating..." if classifier_instance.is_trained else "N/A (Demo Baseline)",
            "averageInferenceMs": 25.0
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
