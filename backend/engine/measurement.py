import cv2
import numpy as np

def estimate_measurements(mask, pixel_to_mm_ratio=None):
    """
    Estimates wound area and perimeter from mask.
    If no reference object is found (pixel_to_mm_ratio is None), returns generic units (pixels).
    For the hackathon, we assume a default ratio if none provided to show functionality.
    """
    if pixel_to_mm_ratio is None:
        pixel_to_mm_ratio = 0.1 # Mock value: 10 pixels = 1mm
        
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return 0, 0
        
    c = max(contours, key=cv2.contourArea)
    area_px = cv2.contourArea(c)
    perimeter_px = cv2.arcLength(c, True)
    
    # Area = px^2 * (mm/px)^2 = mm^2 -> cm^2
    area_cm2 = (area_px * (pixel_to_mm_ratio ** 2)) / 100
    perimeter_cm = (perimeter_px * pixel_to_mm_ratio) / 10
    
    return round(area_cm2, 1), round(perimeter_cm, 1)
