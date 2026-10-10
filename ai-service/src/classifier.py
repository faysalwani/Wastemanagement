import os
import io
import time
import logging
from PIL import Image

logger = logging.getLogger("ai_service.classifier")

# 9 Standard Waste Classes defined in EcoCycle Srinagar
WASTE_CLASSES = [
    'Plastic',                 # 0
    'Paper/Cardboard',         # 1
    'Glass',                   # 2
    'Metal',                   # 3
    'Organic/Food Waste',      # 4
    'E-Waste',                 # 5
    'Textile',                 # 6
    'Hazardous/Special Waste', # 7
    'Residual Waste'           # 8
]

DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'waste_model.pt')
MODEL_PATH = os.getenv('MODEL_PATH', DEFAULT_MODEL_PATH)
MODEL_VERSION = os.getenv('MODEL_VERSION', '1.0.0')
REQUIRE_TRAINED_MODEL = os.getenv('REQUIRE_TRAINED_MODEL', '0').lower() in ('1', 'true', 'yes')

class WasteClassifier:
    def __init__(self, model_path: str = MODEL_PATH):
        self.classes = WASTE_CLASSES
        self.model_path = model_path
        self.model_version = MODEL_VERSION
        self.device = 'cpu'
        self.torch_available = False
        self.is_trained = os.path.exists(self.model_path)
        self.model = None
        self._init_model()

    def _init_model(self):
        """Initializes and loads PyTorch MobileNetV3 model once at startup."""
        try:
            import torch
            import torchvision.models as models
            import torch.nn as nn
            self.torch_available = True
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'

            # Architecture: MobileNetV3-Small with 9-class linear head matching train_9class.py
            self.model = models.mobilenet_v3_small(weights=None)
            in_features = self.model.classifier[3].in_features
            self.model.classifier[3] = nn.Linear(in_features, len(self.classes))

            if self.is_trained:
                try:
                    state_dict = torch.load(self.model_path, map_location=self.device)
                    self.model.load_state_dict(state_dict)
                    self.model.to(self.device)
                    self.model.eval()
                    logger.info("Custom trained 9-class model loaded successfully (device: %s)", self.device)
                except Exception as e:
                    self.is_trained = False
                    logger.error("Failed to load weights from %s: %s", os.path.basename(self.model_path), str(e))
                    if REQUIRE_TRAINED_MODEL:
                        raise RuntimeError(f"Critical: Trained model file corrupted or unreadable: {str(e)}")
            else:
                logger.warning("No model weights found at %s. Running in baseline fallback mode.", os.path.basename(self.model_path))
                if REQUIRE_TRAINED_MODEL:
                    raise RuntimeError(f"Critical: REQUIRE_TRAINED_MODEL is set but {os.path.basename(self.model_path)} is missing.")

        except ImportError:
            self.torch_available = False
            logger.warning("PyTorch not installed. Operating in lightweight baseline mode.")
            if REQUIRE_TRAINED_MODEL:
                raise RuntimeError("Critical: REQUIRE_TRAINED_MODEL is set but PyTorch is not available.")

    def classify_image(self, image_bytes: bytes) -> dict:
        """Runs inference on uploaded image bytes with input validation and exact preprocessing."""
        start_time = time.time()

        if not image_bytes or len(image_bytes) == 0:
            raise ValueError("Empty image payload received.")

        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Verify image integrity
            image.verify()
            # Reopen after verify (PIL design requirement)
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        except Exception as e:
            raise ValueError(f"Invalid or corrupted image format: {str(e)}")

        # Forward pass using trained PyTorch model
        if self.is_trained and self.torch_available and self.model is not None:
            import torch
            import torchvision.transforms as transforms

            # Exact evaluation transforms from train_9class.py
            preprocess = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])

            input_tensor = preprocess(image).unsqueeze(0).to(self.device)
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = torch.softmax(outputs, dim=1)[0].cpu().numpy()

            model_status = "Trained MobileNetV3 (Active)"
        else:
            # Deterministic color-statistics fallback when weights are absent
            model_status = "Model not trained / Demo mode"
            probabilities = self._generate_baseline_probabilities(image)

        # Ranked predictions
        ranked_indices = probabilities.argsort()[::-1]
        predicted_idx = ranked_indices[0]
        top_prob = float(probabilities[predicted_idx])
        predicted_class = self.classes[predicted_idx]

        top_predictions = [
            {
                "category": self.classes[idx],
                "probability": round(float(probabilities[idx]) * 100, 1)
            }
            for idx in ranked_indices[:3]
        ]

        if top_prob >= 0.80:
            confidence_level = "HIGH"
        elif top_prob >= 0.50:
            confidence_level = "MEDIUM"
        else:
            confidence_level = "LOW"

        inference_time_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "predictedCategory": predicted_class,
            "confidence": round(top_prob * 100, 1),
            "confidenceLevel": confidence_level,
            "topPredictions": top_predictions,
            "modelStatus": model_status,
            "modelVersion": self.model_version,
            "inferenceTimeMs": inference_time_ms,
            "architecture": "MobileNetV3-Small (9 Classes)",
            "imageDimensions": {"width": image.width, "height": image.height}
        }

    def get_model_info(self) -> dict:
        """Returns safe model metadata without exposing local host paths."""
        return {
            "modelName": "MobileNetV3-Small 9-Class Waste Classifier",
            "modelVersion": self.model_version,
            "architecture": "MobileNetV3-Small",
            "classesCount": len(self.classes),
            "classes": self.classes,
            "inputResolution": [224, 224],
            "isTrained": self.is_trained,
            "device": self.device,
            "torchAvailable": self.torch_available,
            "modelSizeBytes": os.path.getsize(self.model_path) if self.is_trained else 0
        }

    def _generate_baseline_probabilities(self, image: Image.Image):
        """Generates realistic softmax probabilities based on image color statistics for demo fallback."""
        import numpy as np

        thumb = image.resize((32, 32))
        stat_array = np.array(thumb, dtype=float)
        r_mean, g_mean, b_mean = stat_array.mean(axis=(0, 1))

        raw_logits = np.array([2.0, 1.8, 1.5, 1.4, 2.2, 1.0, 1.1, 0.8, 1.2])
        if g_mean > r_mean + 15 and g_mean > b_mean:
            raw_logits[4] += 3.5  # Organic
        elif b_mean > r_mean + 10:
            raw_logits[0] += 3.0  # Plastic
        elif r_mean > 160 and g_mean > 140 and b_mean < 120:
            raw_logits[1] += 3.2  # Paper/Cardboard
        elif abs(r_mean - g_mean) < 10 and abs(g_mean - b_mean) < 10:
            raw_logits[3] += 2.8  # Metal

        exp_logits = np.exp(raw_logits - np.max(raw_logits))
        return exp_logits / exp_logits.sum()

# Module-level singleton instance initialized once at startup
classifier_instance = WasteClassifier()
