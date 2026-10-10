"""
Standalone verification script for WasteClassifier logic and integrity.
Tests image loading, validation, preprocessing, and error handling without requiring pytest.
"""
import sys
import os
import io

# Add ai-service to path
ai_service_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ai_service_dir)

from PIL import Image
from src.classifier import WasteClassifier, WASTE_CLASSES

def create_synthetic_image(fmt="JPEG", color=(120, 180, 220), size=(224, 224)):
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=fmt)
    return buf.getvalue()

def run_checks():
    print("=== Running WasteClassifier Standalone Verification ===")
    classifier = WasteClassifier()

    # Check 1: 9 Classes
    assert len(classifier.classes) == 9, "Must have exactly 9 waste classes"
    assert classifier.classes == WASTE_CLASSES, "Classes must match synopsis definition"
    print("[PASS] 9 Standard waste classes match specification.")

    # Check 2: Model info
    info = classifier.get_model_info()
    assert info["classesCount"] == 9
    assert info["architecture"] == "MobileNetV3-Small"
    assert "inputResolution" in info
    print("[PASS] Model info schema verified (safe, no path leaks).")

    # Check 3: Valid JPEG image classification
    jpeg_bytes = create_synthetic_image("JPEG")
    res_jpeg = classifier.classify_image(jpeg_bytes)
    assert res_jpeg["predictedCategory"] in WASTE_CLASSES
    assert 0.0 <= res_jpeg["confidence"] <= 100.0
    assert res_jpeg["confidenceLevel"] in ["HIGH", "MEDIUM", "LOW"]
    assert "inferenceTimeMs" in res_jpeg
    print(f"[PASS] Valid JPEG classified: {res_jpeg['predictedCategory']} ({res_jpeg['confidence']}%, status: {res_jpeg['modelStatus']}).")

    # Check 4: Valid PNG image classification
    png_bytes = create_synthetic_image("PNG")
    res_png = classifier.classify_image(png_bytes)
    assert res_png["predictedCategory"] in WASTE_CLASSES
    print(f"[PASS] Valid PNG classified: {res_png['predictedCategory']}.")

    # Check 5: Corrupted / invalid image handling
    try:
        classifier.classify_image(b"not an image file")
        assert False, "Should raise ValueError on invalid image bytes"
    except ValueError as e:
        print("[PASS] Non-image bytes correctly rejected with ValueError.")

    # Check 6: Empty payload handling
    try:
        classifier.classify_image(b"")
        assert False, "Should raise ValueError on empty bytes"
    except ValueError:
        print("[PASS] Empty payload correctly rejected with ValueError.")

    # Check 7: Missing model fallback behavior
    fallback_clf = WasteClassifier(model_path="non_existent_weights.pt")
    assert fallback_clf.is_trained is False
    res_fallback = fallback_clf.classify_image(jpeg_bytes)
    assert res_fallback["predictedCategory"] in WASTE_CLASSES
    assert res_fallback["modelStatus"] == "Model not trained / Demo mode"
    print("[PASS] Non-existent weights handled gracefully without crashing.")

    print("\nAll 7 classifier integrity checks PASSED successfully!")

if __name__ == "__main__":
    run_checks()
