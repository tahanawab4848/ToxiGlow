import cv2
import numpy as np
from sklearn.cluster import KMeans

def classify_tissue(img_rgb, mask):
    """
    Classify tissue types within the wound mask using K-means clustering in LAB color space.
    Returns:
        percentages: Dict of tissue percentages
        tissue_map: 2D array matching image shape with cluster labels (-1 for background)
    """
    # Extract wound pixels
    wound_pixels_rgb = img_rgb[mask > 0]
    if len(wound_pixels_rgb) == 0:
        return {"Granulation": 0, "Slough": 0, "Necrosis": 0, "Epithelial": 0}, np.full(mask.shape, -1)
        
    # Convert to LAB for clustering
    # Reshape image to 2D array of pixels for the whole image to map back later
    img_lab = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2LAB)
    wound_pixels_lab = img_lab[mask > 0]
    
    # K-means clustering (k=4)
    # We enforce initialization centers roughly corresponding to tissue types to keep clusters consistent
    # L, a, b values (approximate heuristics for standard wounds)
    # Granulation (Red/Pink): L~50, a~60, b~20 -> mapped to 0-255 range for OpenCV LAB
    # Slough (Yellow/Cream): L~200, a~128, b~160
    # Necrosis (Black): L~20, a~128, b~128
    # Epithelial (Light Pink): L~180, a~140, b~135
    
    init_centers = np.array([
        [100, 160, 135], # Granulation
        [200, 130, 160], # Slough
        [30, 128, 128],  # Necrosis
        [180, 140, 135]  # Epithelial
    ], dtype=np.float64)
    
    kmeans = KMeans(n_clusters=4, init=init_centers, n_init=1, random_state=42)
    labels = kmeans.fit_predict(wound_pixels_lab)
    
    # Calculate percentages
    total_pixels = len(labels)
    percentages = {
        "Granulation": float(np.sum(labels == 0) / total_pixels * 100),
        "Slough": float(np.sum(labels == 1) / total_pixels * 100),
        "Necrosis": float(np.sum(labels == 2) / total_pixels * 100),
        "Epithelial": float(np.sum(labels == 3) / total_pixels * 100)
    }
    
    # Create spatial map
    tissue_map = np.full(mask.shape, -1, dtype=np.int32)
    tissue_map[mask > 0] = labels
    
    return percentages, tissue_map
