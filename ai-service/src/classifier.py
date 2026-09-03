import os
import io
import time
from PIL import Image

# 9 Standard Waste Classes defined in Synopsis
WASTE_CLASSES = [
    'Plastic',
    'Paper/Cardboard',
    'Glass',
    'Metal',
    'Organic/Food Waste',
    'E-Waste',
    'Textile',
    'Hazardous/Special Waste',
    'Residual Waste'
]

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'waste_model.pt')

class WasteClassifier:
    def __init__(self):
        self.classes = WASTE_CLASSES
        self.device = 'cpu'
        self.is_trained = os.path.exists(MODEL_PATH)
        self.model = None
        self._init_model()

    def _init_model(self):
        """Attempts to load PyTorch MobileNetV3 model if available, else runs demo baseline."""
        try:
            import torch
            import torchvision.models as models
            import torch.nn as nn
            self.torch_available = True
            
            # Architecture: MobileNetV3-Small with 9-class classification head
            self.model = models.mobilenet_v3_small(weights=None)
            in_features = self.model.classifier[3].in_features
            self.model.classifier[3] = nn.Linear(in_features, len(self.classes))
            
            if self.is_trained:
                self.model.load_state_dict(torch.load(MODEL_PATH, map_location=self.device))
                self.model.eval()
                print(f"[AI Service] Custom trained model weights loaded from: {MODEL_PATH}")
            else:
                print(f"[AI Service] Notice: No weights found at {MODEL_PATH}. Operating in Demo / Baseline mode.")
        except ImportError:
            self.torch_available = False
            print("[AI Service] PyTorch not installed locally. Operating in Lightweight PIL Baseline mode.")

    def classify_image(self, image_bytes: bytes):
        start_time = time.time()
        
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        except Exception as e:
            raise ValueError(f"Invalid image content: {str(e)}")

        # If trained PyTorch weights are available, run true forward pass
        if self.is_trained and self.torch_available and self.model is not None:
            import torch
            import torchvision.transforms as transforms
            
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
            # Baseline / Demo Mode feature-based probability simulation
            # Analyzes dominant image tone and byte signature to produce deterministic, realistic probabilities
            model_status = "Model not trained / Demo mode"
            probabilities = self._generate_baseline_probabilities(image)

        # Sort classes by descending probability
        ranked_indices = probabilities.argsort()[::-1]
        predicted_idx = ranked_indices[0]
        top_prob = float(probabilities[predicted_idx])
        predicted_class = self.classes[predicted_idx]

        # Top 3 alternative predictions
        top_predictions = [
            {
                "category": self.classes[idx],
                "probability": round(float(probabilities[idx]) * 100, 1)
            }
            for idx in ranked_indices[:3]
        ]

        # Calibrate confidence level
        if top_prob >= 0.80:
            confidence_level = "HIGH"
        elif top_prob >= 0.50:
            confidence_level = "MEDIUM"
        else:
            confidence_level = "LOW"

        inference_time_ms = round((time.time() - start_time) * 1000, 1)

        return {
            "predictedCategory": predicted_class,
            "confidence": round(top_prob * 100, 1),
            "confidenceLevel": confidence_level,
            "topPredictions": top_predictions,
            "modelStatus": model_status,
            "inferenceTimeMs": inference_time_ms,
            "architecture": "MobileNetV3-Small (9 Classes)",
            "imageDimensions": {"width": image.width, "height": image.height}
        }

    def _generate_baseline_probabilities(self, image: Image.Image):
        """Generates realistic softmax probabilities based on image color statistics."""
        import numpy as np
        
        # Downsample image to 32x32 to compute fast channel statistics
        thumb = image.resize((32, 32))
        stat_array = np.array(thumb, dtype=float)
        r_mean, g_mean, b_mean = stat_array.mean(axis=(0, 1))

        # Heuristic seed: Greenish -> Organic; Blueish/Clear -> Plastic/Glass; Brownish -> Paper/Cardboard
        raw_logits = np.array([2.0, 1.8, 1.5, 1.4, 2.2, 1.0, 1.1, 0.8, 1.2])

        if g_mean > r_mean + 15 and g_mean > b_mean:
            raw_logits[4] += 3.5  # Organic/Food Waste
        elif b_mean > r_mean + 10:
            raw_logits[0] += 3.0  # Plastic
        elif r_mean > 160 and g_mean > 140 and b_mean < 120:
            raw_logits[1] += 3.2  # Paper/Cardboard
        elif abs(r_mean - g_mean) < 10 and abs(g_mean - b_mean) < 10:
            raw_logits[3] += 2.8  # Metal / Residual

        # Softmax conversion
        exp_logits = np.exp(raw_logits - np.max(raw_logits))
        return exp_logits / exp_logits.sum()

# Singleton instance
classifier_instance = WasteClassifier()
