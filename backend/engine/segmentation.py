import cv2
import numpy as np

def segment_wound(img_rgb):
    """
    Multi-step wound segmentation using HSV saturation and brightness heuristics.
    Falls back to value-based segmentation when saturation alone is insufficient.
    """
    hsv = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2HSV)
    s_channel = hsv[:, :, 1]
    v_channel = hsv[:, :, 2]

    s_blur = cv2.GaussianBlur(s_channel, (13, 13), 0)
    _, s_thresh = cv2.threshold(s_blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    v_blur = cv2.GaussianBlur(v_channel, (13, 13), 0)
    _, v_inv_thresh = cv2.threshold(v_blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    mask = cv2.bitwise_or(s_thresh, v_inv_thresh)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    if np.sum(mask > 0) < 3000:
        brightness_threshold = int(np.clip(np.mean(v_channel) * 0.92, 50, 220))
        _, dark_thresh = cv2.threshold(v_blur, brightness_threshold, 255, cv2.THRESH_BINARY_INV)
        fallback = cv2.bitwise_or(mask, dark_thresh)
        fallback = cv2.morphologyEx(fallback, cv2.MORPH_CLOSE, kernel, iterations=2)
        fallback = cv2.morphologyEx(fallback, cv2.MORPH_OPEN, kernel, iterations=1)
        if np.sum(fallback > 0) > np.sum(mask > 0):
            mask = fallback

    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
    if num_labels > 1:
        largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        final_mask = np.zeros_like(mask, dtype=np.uint8)
        final_mask[labels == largest_label] = 255
        mask = final_mask
    else:
        mask = (mask > 0).astype(np.uint8) * 255

    return mask
