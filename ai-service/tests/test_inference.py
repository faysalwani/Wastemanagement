import io
import os
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from src.main import app
from src.classifier import WasteClassifier, WASTE_CLASSES, classifier_instance

client = TestClient(app)

def create_test_image(format="JPEG", color=(100, 150, 200), size=(224, 224)):
    """Helper to generate in-memory synthetic test image bytes."""
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    return buf.getvalue()

class TestAIServiceEndpoints:
    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ONLINE"
        assert "endpoints" in data

    def test_health_endpoint(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "HEALTHY"
        assert "classes" in data
        assert len(data["classes"]) == 9
        assert data["classes"] == WASTE_CLASSES

    def test_model_info_endpoint(self):
        response = client.get("/model-info")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["classesCount"] == 9
        assert data["architecture"] == "MobileNetV3-Small"
        assert "inputResolution" in data
        # Ensure no private file system paths leaked
        assert "D:\\" not in str(data) and "C:\\" not in str(data)

    def test_evaluate_endpoint(self):
        response = client.get("/evaluate")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "metrics" in data

    def test_classify_valid_jpeg(self):
        img_bytes = create_test_image(format="JPEG")
        response = client.post(
            "/classify",
            files={"image": ("sample_test.jpg", img_bytes, "image/jpeg")}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["predictedCategory"] in WASTE_CLASSES
        assert 0.0 <= data["confidence"] <= 100.0
        assert data["confidenceLevel"] in ["HIGH", "MEDIUM", "LOW"]
        assert len(data["topPredictions"]) <= 3
        assert "inferenceTimeMs" in data
        assert data["architecture"] == "MobileNetV3-Small (9 Classes)"

    def test_classify_valid_png(self):
        img_bytes = create_test_image(format="PNG")
        response = client.post(
            "/classify",
            files={"image": ("sample_test.png", img_bytes, "image/png")}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["predictedCategory"] in WASTE_CLASSES

    def test_classify_invalid_file_type(self):
        text_bytes = b"This is a text file, not a valid image."
        response = client.post(
            "/classify",
            files={"image": ("test.txt", text_bytes, "text/plain")}
        )
        assert response.status_code == 400
        data = response.json()
        assert "image" in data["detail"].lower()

    def test_classify_corrupted_image_bytes(self):
        corrupted_bytes = b"\xff\xd8\xff\xe0" + b"\x00" * 20 # Broken JPEG header
        response = client.post(
            "/classify",
            files={"image": ("broken.jpg", corrupted_bytes, "image/jpeg")}
        )
        assert response.status_code == 400
        data = response.json()
        assert "validation failed" in data["detail"].lower()

    def test_classify_empty_payload(self):
        response = client.post(
            "/classify",
            files={"image": ("empty.jpg", b"", "image/jpeg")}
        )
        assert response.status_code == 400

    def test_model_loading_and_architecture(self):
        classifier = WasteClassifier()
        assert classifier.classes == WASTE_CLASSES
        assert len(classifier.classes) == 9
        if classifier.is_trained and classifier.torch_available:
            assert classifier.model is not None
            # Check linear layer output size
            assert classifier.model.classifier[3].out_features == 9

    def test_missing_model_fallback(self):
        """Tests that classifier handles non-existent model path gracefully without crashing."""
        non_existent_path = "non_existent_model_weights.pt"
        classifier = WasteClassifier(model_path=non_existent_path)
        assert classifier.is_trained is False
        img_bytes = create_test_image()
        result = classifier.classify_image(img_bytes)
        assert result["predictedCategory"] in WASTE_CLASSES
        assert result["modelStatus"] == "Model not trained / Demo mode"
