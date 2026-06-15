import cv2
import numpy as np
from utils.image_processing import get_periwound_mask

def detect_infection_markers(img_rgb, wound_mask):
    """
    Detects erythema and exudate based on color thresholds.
    """
    img_lab = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2LAB)
    a_channel = img_lab[:, :, 1]
    
    indicators = []
    score = 0
    
    # 1. Erythema Detection
    periwound_mask = get_periwound_mask(wound_mask)
    background_mask = cv2.bitwise_not(cv2.bitwise_or(wound_mask, periwound_mask))
    
    periwound_a = a_channel[periwound_mask > 0]
    background_a = a_channel[background_mask > 0]
    
    if len(periwound_a) > 0 and len(background_a) > 0:
        mean_peri_a = np.mean(periwound_a)
        mean_back_a = np.mean(background_a)
        
        # In OpenCV LAB, 128 is neutral a*. Values > 128 are red.
        # Shift to 0-centered for ratio
        peri_redness = max(1, mean_peri_a - 128)
        back_redness = max(1, mean_back_a - 128)
        
        if peri_redness > 1.5 * back_redness and peri_redness > 10:
            indicators.append("Erythema (spreading redness) detected")
            score += 40
            
    # 2. Exudate Detection (Yellow/Green high brightness)
    # Exudate typically has high L, low a*, high b*
    wound_l = img_lab[:, :, 0][wound_mask > 0]
    wound_a = a_channel[wound_mask > 0]
    wound_b = img_lab[:, :, 2][wound_mask > 0]
    
    if len(wound_l) > 0:
        # Simple heuristic for purulent exudate
        exudate_pixels = np.sum((wound_l > 180) & (wound_a < 140) & (wound_b > 150))
        exudate_ratio = exudate_pixels / len(wound_l)
        if exudate_ratio > 0.05:
            indicators.append("Purulent exudate suspected")
            score += 30
            
    # Risk Level mapping
    if score >= 60:
        risk_level = "High"
    elif score >= 30:
        risk_level = "Moderate"
    else:
        risk_level = "Low"
        indicators.append("No significant infection markers detected")
        
    return indicators, score, risk_level
