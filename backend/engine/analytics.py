"""
Analytics engine for extracting patient insights from wound assessment data.
Identifies common conditions, patterns, and health trends.
"""

from typing import Dict, List, Optional, Any
from collections import Counter, defaultdict
import statistics

class WoundAnalyticsEngine:
    """Extract insights from wound assessment data."""
    
    # Condition inference rules based on tissue composition and indicators
    CONDITION_PATTERNS = {
        'diabetic_foot_ulcer': {
            'indicators': ['necrosis', 'erythema', 'slough'],
            'tissue_pattern': {'Necrosis': 20, 'Slough': 30},
            'severity_range': (40, 100),
            'common_tissues': ['Necrosis', 'Slough', 'Granulation']
        },
        'pressure_ulcer': {
            'indicators': ['erythema', 'slough'],
            'tissue_pattern': {'Slough': 25, 'Granulation': 40},
            'severity_range': (30, 80),
            'common_tissues': ['Slough', 'Granulation']
        },
        'surgical_wound': {
            'indicators': [],
            'tissue_pattern': {'Granulation': 60, 'Epithelial': 20},
            'severity_range': (10, 40),
            'common_tissues': ['Granulation', 'Epithelial']
        },
        'traumatic_wound': {
            'indicators': ['erythema', 'exudate'],
            'tissue_pattern': {'Granulation': 50, 'Necrosis': 10},
            'severity_range': (20, 60),
            'common_tissues': ['Granulation', 'Epithelial']
        },
        'infected_wound': {
            'indicators': ['erythema', 'exudate', 'slough'],
            'tissue_pattern': {'Slough': 40, 'Necrosis': 15},
            'severity_range': (50, 100),
            'common_tissues': ['Slough', 'Necrosis', 'Granulation']
        },
        'venous_ulcer': {
            'indicators': ['erythema'],
            'tissue_pattern': {'Granulation': 50, 'Slough': 20},
            'severity_range': (30, 70),
            'common_tissues': ['Granulation', 'Slough']
        },
        'burn_wound': {
            'indicators': ['necrosis', 'erythema'],
            'tissue_pattern': {'Necrosis': 30, 'Granulation': 40},
            'severity_range': (40, 90),
            'common_tissues': ['Necrosis', 'Granulation']
        }
    }

    @staticmethod
    def infer_condition(assessment: Dict[str, Any]) -> Optional[str]:
        """
        Infer likely wound condition based on assessment data.
        Returns condition name with confidence score.
        """
        tissues = assessment.get('tissues', {})
        indicators = [ind.lower() for ind in assessment.get('indicators', [])]
        severity_score = assessment.get('severity_score', 0)
        
        best_match = None
        best_score = 0
        
        for condition, pattern in WoundAnalyticsEngine.CONDITION_PATTERNS.items():
            score = 0
            
            # Check severity range
            if pattern['severity_range'][0] <= severity_score <= pattern['severity_range'][1]:
                score += 20
            
            # Check indicators
            matching_indicators = sum(1 for ind in pattern['indicators'] 
                                     if any(ind.lower() in i for i in indicators))
            if pattern['indicators']:
                score += (matching_indicators / len(pattern['indicators'])) * 30
            
            # Check tissue composition
            for tissue, expected_pct in pattern['tissue_pattern'].items():
                actual_pct = tissues.get(tissue, 0)
                if actual_pct > 0:
                    match_pct = min(actual_pct, expected_pct) / max(actual_pct, expected_pct)
                    score += match_pct * 20
            
            if score > best_score:
                best_score = score
                best_match = condition
        
        return best_match if best_score > 30 else None

    @staticmethod
    def analyze_patient_cohort(assessments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze a cohort of patient assessments to extract trends and patterns.
        """
        if not assessments:
            return {
                'stats': {},
                'disease_breakdown': [],
                'severity_distribution': {},
                'top_tissues': [],
                'risk_indicators': []
            }
        
        # Basic statistics
        severity_scores = [a.get('severity_score', 0) for a in assessments]
        areas = [a.get('area', 0) for a in assessments]
        
        stats = {
            'total_assessments': len(assessments),
            'unique_patients': len(set(a.get('user_email', '') for a in assessments)),
            'avg_severity': sum(severity_scores) / len(severity_scores) if severity_scores else 0,
            'median_severity': statistics.median(severity_scores) if severity_scores else 0,
            'avg_area': sum(areas) / len(areas) if areas else 0,
            'active_clinicians': 0,  # Would be populated from user data
        }
        
        # Condition breakdown
        conditions = defaultdict(list)
        for assessment in assessments:
            condition = WoundAnalyticsEngine.infer_condition(assessment)
            if condition:
                conditions[condition].append(assessment)
        
        disease_breakdown = []
        for condition, condition_assessments in conditions.items():
            condition_severities = [a.get('severity_score', 0) for a in condition_assessments]
            condition_tissues = defaultdict(list)
            
            for a in condition_assessments:
                for tissue, pct in a.get('tissues', {}).items():
                    condition_tissues[tissue].append(pct)
            
            common_tissues = sorted(
                condition_tissues.keys(),
                key=lambda t: sum(condition_tissues[t]) / len(condition_tissues[t]),
                reverse=True
            )[:3]
            
            disease_breakdown.append({
                'condition': condition.replace('_', ' ').title(),
                'cases': len(condition_assessments),
                'avg_severity': sum(condition_severities) / len(condition_severities),
                'common_tissues': [t.replace('_', ' ') for t in common_tissues],
                'percentage': (len(condition_assessments) / len(assessments)) * 100
            })
        
        # Severity distribution
        severity_distribution = {
            'mild': sum(1 for s in severity_scores if s <= 30),
            'moderate': sum(1 for s in severity_scores if 31 <= s <= 60),
            'severe': sum(1 for s in severity_scores if 61 <= s <= 80),
            'critical': sum(1 for s in severity_scores if s > 80),
        }
        
        # Top tissue types
        tissue_counts = defaultdict(lambda: {'count': 0, 'percentages': []})
        for assessment in assessments:
            for tissue, pct in assessment.get('tissues', {}).items():
                tissue_counts[tissue]['count'] += 1
                tissue_counts[tissue]['percentages'].append(pct)
        
        top_tissues = []
        for tissue, data in tissue_counts.items():
            if data['count'] > 0:
                top_tissues.append({
                    'tissue_type': tissue,
                    'count': data['count'],
                    'avg_percentage': sum(data['percentages']) / len(data['percentages'])
                })
        
        top_tissues.sort(key=lambda x: x['count'], reverse=True)
        
        # Risk indicators
        high_risk = sum(1 for a in assessments if a.get('severity_score', 0) > 70)
        infection_indicators = sum(1 for a in assessments 
                                  if any(ind.lower() in ['erythema', 'exudate'] 
                                        for ind in [i.lower() for i in a.get('indicators', [])]))
        
        risk_indicators = [
            {'indicator': 'High Severity Cases', 'count': high_risk, 'percentage': (high_risk / len(assessments)) * 100},
            {'indicator': 'Potential Infections', 'count': infection_indicators, 'percentage': (infection_indicators / len(assessments)) * 100},
        ]
        
        return {
            'stats': stats,
            'disease_breakdown': sorted(disease_breakdown, key=lambda x: x['cases'], reverse=True),
            'severity_distribution': severity_distribution,
            'top_tissues': sorted(top_tissues, key=lambda x: x['count'], reverse=True)[:5],
            'risk_indicators': risk_indicators
        }
