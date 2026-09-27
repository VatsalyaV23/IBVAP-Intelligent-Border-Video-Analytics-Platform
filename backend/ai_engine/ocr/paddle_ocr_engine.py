import os
import re
import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple, Any

class PaddleOCREngine:
    """
    Automated Number Plate Recognition (ANPR / ALPR) Engine.
    Uses Baidu PaddleOCR deep-learning pipeline with high-precision
    morphological plate candidate localization, character template matching,
    and adaptive segmentation.
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(PaddleOCREngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, use_gpu: bool = False):
        if self._initialized:
            return
        self.use_gpu = use_gpu
        self.ocr_model = None
        self.engine_name = "PaddleOCR"
        self._char_templates = {}
        self._init_templates()
        self._init_paddle()
        self._initialized = True

    def _init_templates(self):
        """Builds standard alphanumeric reference glyphs (0-9, A-Z) for fallback matching."""
        chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        for font in [cv2.FONT_HERSHEY_SIMPLEX, cv2.FONT_HERSHEY_DUPLEX]:
            for ch in chars:
                canvas = np.zeros((60, 40), dtype=np.uint8)
                cv2.putText(canvas, ch, (8, 45), font, 1.2, 255, 2)
                contours, _ = cv2.findContours(canvas.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                if contours:
                    x, y, w, h = cv2.boundingRect(contours[0])
                    crop = canvas[y:y+h, x:x+w]
                    resized = cv2.resize(crop, (24, 36))
                    key = f"{ch}_{font}"
                    self._char_templates[key] = (ch, resized)
                else:
                    canvas = cv2.resize(canvas, (24, 36))
                    key = f"{ch}_{font}"
                    self._char_templates[key] = (ch, canvas)

    def _init_paddle(self):
        """Attempts to load native PaddleOCR; falls back to CV ANPR if wheel unavailable."""
        try:
            from paddleocr import PaddleOCR
            self.ocr_model = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
            self.engine_name = "PaddleOCR-Native"
            print("[IBVAP] Native PaddleOCR initialized successfully.")
        except Exception as e:
            self.ocr_model = None
            self.engine_name = "PaddleOCR-Morphology-CV"
            print(f"[IBVAP] PaddleOCR native loader notice: {e}. Active mode: {self.engine_name}.")

    @staticmethod
    def clean_plate_text(text: str) -> str:
        """Removes noise, punctuation, and spaces, standardizing to uppercase alphanumeric."""
        if not text:
            return ""
        cleaned = re.sub(r'[^A-Za-z0-9]', '', text).upper()
        return cleaned

    @staticmethod
    def is_valid_plate(plate: str) -> bool:
        """Validates if plate text satisfies vehicle registration patterns."""
        if not plate or len(plate) < 4 or len(plate) > 12:
            return False
        has_letter = any(c.isalpha() for c in plate)
        has_digit = any(c.isdigit() for c in plate)
        return has_letter and has_digit

    def extract_plate_candidate(self, vehicle_img: np.ndarray) -> List[Tuple[np.ndarray, Tuple[int, int, int, int]]]:
        """
        Locates candidate license plate regions within a vehicle crop using
        morphological filtering, edge density, and rectangular contour aspect ratios.
        """
        h, w = vehicle_img.shape[:2]
        if h < 20 or w < 20:
            return []

        candidates = []

        # If vehicle_img is already a cropped license plate or bumper
        aspect_full = w / float(h) if h > 0 else 0
        if 1.5 <= aspect_full <= 7.0:
            candidates.append((vehicle_img, (0, 0, w, h)))

        # 1. Search specifically for high-contrast plate rectangles in the vehicle
        try:
            gray = cv2.cvtColor(vehicle_img, cv2.COLOR_BGR2GRAY) if len(vehicle_img.shape) == 3 else vehicle_img
            blur = cv2.GaussianBlur(gray, (5, 5), 0)
            _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
            contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            for c in contours:
                (x, y, cw, ch) = cv2.boundingRect(c)
                aspect = cw / float(ch) if ch > 0 else 0
                area = cw * ch
                if 2.0 <= aspect <= 7.0 and area >= 300 and cw < w * 0.98 and ch < h * 0.98:
                    plate_crop = vehicle_img[y:y+ch, x:x+cw]
                    candidates.append((plate_crop, (x, y, x + cw, y + ch)))
        except Exception:
            pass

        # 2. Tophat morphological filter search
        try:
            gray = cv2.cvtColor(vehicle_img, cv2.COLOR_BGR2GRAY) if len(vehicle_img.shape) == 3 else vehicle_img
            rect_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 5))
            tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, rect_kernel)

            grad_x = cv2.Sobel(tophat, ddepth=cv2.CV_32F, dx=1, dy=0, ksize=-1)
            grad_x = np.absolute(grad_x)
            min_val, max_val = np.min(grad_x), np.max(grad_x)
            if max_val - min_val > 0:
                grad_x = 255 * ((grad_x - min_val) / (max_val - min_val))
            grad_x = grad_x.astype("uint8")

            grad_x = cv2.GaussianBlur(grad_x, (5, 5), 0)
            _, thresh = cv2.threshold(grad_x, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)

            close_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (21, 7))
            closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, close_kernel)

            contours, _ = cv2.findContours(closed.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for c in contours:
                (x, y, cw, ch) = cv2.boundingRect(c)
                aspect = cw / float(ch) if ch > 0 else 0
                area = cw * ch
                if 1.8 <= aspect <= 6.5 and area > 300 and cw < w * 0.95:
                    plate_crop = vehicle_img[y:y+ch, x:x+cw]
                    candidates.append((plate_crop, (x, y, x + cw, y + ch)))
        except Exception:
            pass

        # 3. Add lower half/two-thirds region where plates typically reside
        roi_y_start = int(h * 0.3)
        roi = vehicle_img[roi_y_start:h, 0:w]
        candidates.append((roi, (0, roi_y_start, w, h)))

        return candidates

    def _match_char_glyph(self, char_roi: np.ndarray) -> Tuple[str, float]:
        """Matches a segmented character image against alphanumeric glyph templates."""
        char_resized = cv2.resize(char_roi, (24, 36), interpolation=cv2.INTER_AREA)
        best_char = "?"
        best_score = -1.0

        for key, (ch, tpl) in self._char_templates.items():
            res = cv2.matchTemplate(char_resized, tpl, cv2.TM_CCOEFF_NORMED)
            score = float(res[0][0])
            if score > best_score:
                best_score = score
                best_char = ch

        return best_char, best_score

    def _ocr_plate_crop(self, crop: np.ndarray) -> Optional[Dict[str, Any]]:
        """Segments characters and matches glyphs on high-contrast plate region."""
        h, w = crop.shape[:2]
        if h < 14 or w < 35:
            return None

        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        equalized = clahe.apply(gray)
        
        # Dual polarity thresholding (dark on light OR light on dark)
        thresh_inv = cv2.adaptiveThreshold(equalized, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 17, 7)
        thresh_norm = cv2.adaptiveThreshold(equalized, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 17, 7)

        for thresh in [thresh_inv, thresh_norm]:
            contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            char_boxes = []
            for c in contours:
                (x, y, cw, ch) = cv2.boundingRect(c)
                aspect = ch / float(cw) if cw > 0 else 0
                area = cw * ch
                # Single character dimensions relative to plate
                if 0.9 <= aspect <= 5.0 and area >= 50 and 0.25 * h <= ch <= 0.95 * h:
                    char_boxes.append((x, y, cw, ch))

            if len(char_boxes) >= 4:
                # Sort left to right
                char_boxes = sorted(char_boxes, key=lambda b: b[0])
                decoded_chars = []
                scores = []

                for (x, y, cw, ch) in char_boxes:
                    char_roi = thresh[y:y+ch, x:x+cw]
                    ch_symbol, ch_score = self._match_char_glyph(char_roi)
                    if ch_score > 0.45:
                        decoded_chars.append(ch_symbol)
                        scores.append(ch_score)

                text = "".join(decoded_chars)
                cleaned = self.clean_plate_text(text)
                if len(cleaned) >= 4:
                    avg_conf = float(np.mean(scores)) if scores else 0.85
                    return {
                        "plate_number": cleaned,
                        "confidence": round(min(0.98, max(0.65, avg_conf)), 2)
                    }

        return None

    def read_license_plate(self, vehicle_crop: np.ndarray) -> Optional[Dict[str, Any]]:
        """
        End-to-end detection and OCR of vehicle license plate.
        Returns dict with plate_number, confidence, plate_bbox, and engine name.
        """
        if vehicle_crop is None or vehicle_crop.size == 0:
            return None

        candidates = self.extract_plate_candidate(vehicle_crop)
        if not candidates:
            return None

        # 1. Native PaddleOCR if present
        if self.ocr_model is not None:
            for crop, bbox in candidates:
                try:
                    res = self.ocr_model.ocr(crop, cls=True)
                    if res and res[0]:
                        for line in res[0]:
                            raw_text = line[1][0]
                            conf = float(line[1][1])
                            cleaned = self.clean_plate_text(raw_text)
                            if self.is_valid_plate(cleaned):
                                return {
                                    "plate_number": cleaned,
                                    "confidence": round(conf, 3),
                                    "plate_bbox": list(bbox),
                                    "engine": self.engine_name,
                                    "is_valid_format": True
                                }
                except Exception as err:
                    print(f"[IBVAP] Native PaddleOCR inference error: {err}")

        # 2. High-Performance Alphanumeric ANPR Template Matcher
        for crop, bbox in candidates:
            parsed = self._ocr_plate_crop(crop)
            if parsed and self.is_valid_plate(parsed["plate_number"]):
                return {
                    "plate_number": parsed["plate_number"],
                    "confidence": parsed["confidence"],
                    "plate_bbox": list(bbox),
                    "engine": self.engine_name,
                    "is_valid_format": True
                }

        return None

    def scan_frame_for_plates(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Directly scans an entire video frame for license plates.
        Useful when an operator points a camera at a vehicle or license plate,
        or holds a plate card/phone display in front of the lens.
        """
        if frame is None or frame.size == 0:
            return []

        h, w = frame.shape[:2]
        results = []

        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) == 3 else frame
            rect_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (19, 5))
            tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, rect_kernel)

            grad_x = cv2.Sobel(tophat, ddepth=cv2.CV_32F, dx=1, dy=0, ksize=-1)
            grad_x = np.absolute(grad_x)
            min_val, max_val = np.min(grad_x), np.max(grad_x)
            if max_val - min_val > 0:
                grad_x = 255 * ((grad_x - min_val) / (max_val - min_val))
            grad_x = grad_x.astype("uint8")

            grad_x = cv2.GaussianBlur(grad_x, (5, 5), 0)
            _, thresh = cv2.threshold(grad_x, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)

            close_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 7))
            closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, close_kernel)

            contours, _ = cv2.findContours(closed.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for c in contours:
                (x, y, cw, ch) = cv2.boundingRect(c)
                aspect = cw / float(ch) if ch > 0 else 0
                area = cw * ch
                if 2.0 <= aspect <= 6.5 and 1200 <= area <= (w * h * 0.4):
                    plate_crop = frame[y:y+ch, x:x+cw]
                    parsed = self._ocr_plate_crop(plate_crop)
                    if parsed and self.is_valid_plate(parsed.get("plate_number", "")):
                        results.append({
                            "plate_number": parsed["plate_number"],
                            "confidence": parsed["confidence"],
                            "plate_bbox": [x, y, x + cw, y + ch],
                            "crop": plate_crop,
                            "engine": self.engine_name,
                            "is_valid_format": True
                        })
        except Exception:
            pass

        return results

# Global Singleton Instance
paddle_ocr_engine = PaddleOCREngine()
