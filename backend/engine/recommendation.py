def get_recommendation(severity_score, risk_level, necrosis_pct):
    """
    Rule-based tiered recommendation engine.
    Returns: dict with text and color.
    """
    if necrosis_pct > 30 or severity_score > 80:
        return {
            "text": "URGENT: Signs of advancing tissue death. Seek emergency medical attention immediately. Do not wait.",
            "color": "#D50000",
            "tier": "Emergency"
        }
    elif risk_level == "High" or severity_score > 60:
        return {
            "text": "Infection suspected with significant tissue involvement. Seek clinical assessment within 12–24 hours. Go to urgent care if you develop fever.",
            "color": "#FF9100",
            "tier": "Urgent"
        }
    elif risk_level == "Moderate" or severity_score > 30:
        return {
            "text": "Moderate concern. Schedule a wound care review within 48 hours. Monitor daily for increased pain, heat, or discharge.",
            "color": "#FFD600",
            "tier": "Review"
        }
    else:
        return {
            "text": "The wound is showing signs of normal healing. Continue current care plan. Re-image in 48–72 hours.",
            "color": "#00C853",
            "tier": "Monitor"
        }
