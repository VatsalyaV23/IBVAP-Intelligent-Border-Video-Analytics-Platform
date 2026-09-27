import cv2
import numpy as np
from typing import List
from ai_engine.core.base_adapters import BaseDetectionModel, DetectionResult, BoundingBox, ModelProvenance
from ai_engine.core.model_registry import model_registry

class YOLOAdapter(BaseDetectionModel):
    def __init__(self, model_name: str = "IBVAP-PERSON-v1", version: str = "v3.2"):
        self.model_name = model_name
        self.version = version
        self.provenance = model_registry.register_model(
            name=model_name,
            version=version,
            framework="Ultralytics YOLO / OpenCV Hybrid"
        )
        self.yolo_model = None
        self._init_detector()

    def _find_yolo_weights(self) -> str:
        from pathlib import Path
        base = Path(__file__).resolve().parent.parent.parent.parent
        candidates = [
            base / "yolov8n.pt",
            base / "backend" / "yolov8n.pt",
            Path.cwd() / "yolov8n.pt",
            Path.cwd() / "backend" / "yolov8n.pt",
        ]
        for c in candidates:
            if c.exists():
                return str(c)
        return "yolov8n.pt"

    def _init_detector(self):
        try:
            from ultralytics import YOLO
            weights_path = self._find_yolo_weights()
            self.yolo_model = YOLO(weights_path)
            print(f"[IBVAP-YOLO-ADAPTER] Loaded YOLO from {weights_path}")
        except Exception as e:
            print(f"[IBVAP-YOLO-ADAPTER] Could not load YOLO ({e}), fallback to HOG")
            self.hog = cv2.HOGDescriptor()
            self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

    def detect(self, image: np.ndarray) -> List[DetectionResult]:
        results: List[DetectionResult] = []
        if image is None or image.size == 0:
            return results

        h, w = image.shape[:2]

        if self.yolo_model:
            try:
                preds = self.yolo_model(image, verbose=False)[0]
                for box in preds.boxes:
                    cls_id = int(box.cls[0].item())
                    cls_name = self.yolo_model.names.get(cls_id, "unknown")
                    conf = float(box.conf[0].item())
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    results.append(DetectionResult(
                        class_name=cls_name,
                        confidence=conf,
                        bbox=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2),
                        provenance=self.provenance
                    ))
                return results
            except Exception:
                pass

        # OpenCV HOG Fallback
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        boxes, weights = self.hog.detectMultiScale(gray, winStride=(8, 8), padding=(4, 4), scale=1.05)
        for (x, y, bw, bh), conf in zip(boxes, weights):
            results.append(DetectionResult(
                class_name="person",
                confidence=float(min(1.0, max(0.4, float(conf)))),
                bbox=BoundingBox(x1=float(x), y1=float(y), x2=float(x + bw), y2=float(y + bh)),
                provenance=self.provenance
            ))

        return results

    def get_provenance(self) -> ModelProvenance:
        return self.provenance
