import cv2
import numpy as np

class LowLightDetector:
    @staticmethod
    def analyze_illumination(frame: np.ndarray) -> tuple[bool, float]:
        """
        Analyzes frame luminance. Returns (is_low_light, mean_brightness).
        Mean brightness < 45.0 indicates night / low light condition.
        """
        if frame is None or frame.size == 0:
            return False, 100.0
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) == 3 else frame
        mean_brightness = float(np.mean(gray))
        is_low_light = mean_brightness < 45.0
        return is_low_light, mean_brightness
