def compare_wounds(prior_data, current_data):
    """
    Calculates the delta between two wound assessments.
    """
    if not prior_data or not current_data:
        return None
        
    area_delta = current_data["area"] - prior_data["area"]
    area_pct = (area_delta / prior_data["area"]) * 100 if prior_data["area"] > 0 else 0
    
    if area_pct <= -15:
        trajectory = "ON TRACK"
    elif area_pct <= -5:
        trajectory = "SLOW"
    elif area_pct <= 5:
        trajectory = "STALLED"
    else:
        trajectory = "DETERIORATING"
        
    return {
        "area_change_cm2": round(area_delta, 1),
        "area_change_pct": round(area_pct, 1),
        "trajectory": trajectory,
        "_prior_score": prior_data.get("severity_score", None)
    }
