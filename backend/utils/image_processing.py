import cv2
import numpy as np
from PIL import Image, ImageOps

def load_image(upload_file):
    """Load an image from a file upload into an OpenCV RGB array, correcting EXIF rotation."""
    img = Image.open(upload_file)
    img = ImageOps.exif_transpose(img)
    img = img.convert('RGB')
    return np.array(img)

def resize_for_processing(img, max_dim=800):
    """Resize image to speed up processing while maintaining aspect ratio."""
    h, w = img.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))
        return img, scale
    return img, 1.0

def convert_to_lab(img):
    """Convert RGB image to LAB color space for illumination-invariant analysis."""
    return cv2.cvtColor(img, cv2.COLOR_RGB2LAB)

def get_periwound_mask(wound_mask, dilation_percent=0.15):
    """Create a mask of the skin surrounding the wound."""
    h, w = wound_mask.shape
    # Dilation size based on wound size
    wound_area = np.sum(wound_mask > 0)
    radius = int(np.sqrt(wound_area / np.pi) * dilation_percent)
    radius = max(5, radius)
    
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (radius, radius))
    dilated = cv2.dilate(wound_mask, kernel, iterations=1)
    
    # Periwound is dilated area minus the wound itself
    periwound = cv2.bitwise_xor(dilated, wound_mask)
    return periwound
