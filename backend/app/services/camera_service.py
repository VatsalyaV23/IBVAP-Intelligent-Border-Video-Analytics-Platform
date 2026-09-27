import cv2
import numpy as np
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.camera import Camera, CameraHealth

class CameraService:
    @staticmethod
    def generate_synthetic_tactical_frame(
        camera_id: str,
        title: str,
        has_detection: bool = False,
        is_critical: bool = False,
        is_thermal: bool = False
    ) -> bytes:
        """
        Generates a synthetic C4ISR border surveillance frame with HUD overlays,
        timestamps, and bounding boxes for real-time video streaming.
        """
        width, height = 640, 360
        if is_thermal:
            # Monochrome thermal gradient with simulated heat signatures
            frame = np.full((height, width), 35, dtype=np.uint8)
            cv2.circle(frame, (320, 180), 60, 120, -1)
            cv2.circle(frame, (320, 180), 30, 200, -1)
            frame = cv2.cvtColor(frame, cv2.COLOR_GRAY2BGR)
            cv2.line(frame, (300, 180), (340, 180), (0, 255, 120), 1)
            cv2.line(frame, (320, 160), (320, 200), (0, 255, 120), 1)
        else:
            # Deep night tactical surveillance backdrop
            frame = np.full((height, width, 3), (25, 20, 15), dtype=np.uint8)
            # Simulated border perimeter fence lines
            for x in range(0, width, 40):
                cv2.line(frame, (x, 100), (x, height), (40, 45, 50), 1)
            for y in range(100, height, 40):
                cv2.line(frame, (0, y), (width, y), (40, 45, 50), 1)

        # Draw HUD text
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S:%f")[:11] + " UTC"
        cv2.putText(frame, f"{camera_id} [{title}]", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(frame, f"LIVE | {now_str}", (15, height - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 180), 1)

        if has_detection:
            box_color = (0, 0, 240) if is_critical else (0, 200, 255)
            cv2.rectangle(frame, (200, 120), (360, 290), box_color, 2)
            cv2.putText(frame, "PERSON [P-088] 97.4%", (200, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.45, box_color, 1)

        ret, jpeg = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        return jpeg.tobytes()

    @staticmethod
    async def get_camera_health(db: AsyncSession, camera_id: str) -> Optional[CameraHealth]:
        stmt = select(CameraHealth).where(CameraHealth.camera_id == camera_id)
        res = await db.execute(stmt)
        return res.scalar_one_or_none()
