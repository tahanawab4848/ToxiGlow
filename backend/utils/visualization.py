import cv2
import numpy as np

def draw_wound_contour(img, mask, color=(0, 255, 255), thickness=3):
    """Draw a cyan contour around the wound mask on the original image."""
    result = img.copy()
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        # Find largest contour
        c = max(contours, key=cv2.contourArea)
        cv2.drawContours(result, [c], -1, color, thickness)
    return result

def overlay_tissue_map(img, mask, tissue_labels):
    """
    Blend tissue classification map with original image.
    Colors: Red=Granulation, Yellow=Slough, Black=Necrosis, Green=Epithelial.
    """
    # Create an empty overlay
    overlay = np.zeros_like(img)
    
    # Map labels to colors
    # 0: Granulation (Red), 1: Slough (Yellow), 2: Necrosis (Black), 3: Epithelial (Green)
    colors = {
        0: [255, 0, 0],       # Red
        1: [255, 255, 0],     # Yellow
        2: [0, 0, 0],         # Black
        3: [0, 255, 0]        # Green
    }
    
    for label, color in colors.items():
        overlay[tissue_labels == label] = color
        
    # Apply the mask so background isn't colored
    overlay_masked = cv2.bitwise_and(overlay, overlay, mask=mask)
    
    # Blend with original image at 40% opacity
    result = img.copy()
    alpha = 0.4
    cv2.addWeighted(overlay_masked, alpha, result, 1 - alpha, 0, result)
    
    # Clear background pixels in result to just show original
    bg_mask = cv2.bitwise_not(mask)
    bg_original = cv2.bitwise_and(img, img, mask=bg_mask)
    fg_blended = cv2.bitwise_and(result, result, mask=mask)
    
    return cv2.add(bg_original, fg_blended)
