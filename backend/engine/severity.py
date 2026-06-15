def calculate_severity(tissue_percentages, infection_score, area_cm2):
    """
    Calculates a composite severity score 0-100.
    """
    necrosis_score = tissue_percentages.get("Necrosis", 0) * 0.4
    infection_weighted = min(infection_score, 100) * 0.3
    slough_score = tissue_percentages.get("Slough", 0) * 0.15
    
    # Size score (arbitrary scaling for demo: 50cm2 is max score)
    size_score = min(area_cm2 / 50.0 * 100, 100) * 0.15
    
    total = necrosis_score + infection_weighted + slough_score + size_score
    score = min(100, max(0, round(total)))
    
    if score <= 30:
        category = "Mild"
    elif score <= 60:
        category = "Moderate"
    elif score <= 80:
        category = "Severe"
    else:
        category = "Critical"
        
    return score, category
