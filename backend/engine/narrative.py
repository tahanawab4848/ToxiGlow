def generate_narrative(area, tissues, indicators, severity_score):
    """
    Template-based narrative generator (fallback for LLM).
    """
    intro = f"The wound measures approximately {area} cm². "
    
    tissue_desc = "Tissue composition shows "
    parts = []
    for t, p in tissues.items():
        if p > 5:
            parts.append(f"{p:.0f}% {t.lower()}")
    tissue_desc += ", ".join(parts) + ". "
    
    if len(indicators) > 0 and "No significant" not in indicators[0]:
        inf_desc = "Clinical indicators of concern include: " + ", ".join(indicators).lower() + ". "
    else:
        inf_desc = "There are no immediate visual markers of spreading infection. "
        
    if severity_score > 60:
        sev_desc = "The overall severity is assessed as high due to necrotic burden or infection markers."
    else:
        sev_desc = "The wound appears to be following a typical healing trajectory."
        
    return intro + tissue_desc + inf_desc + sev_desc
