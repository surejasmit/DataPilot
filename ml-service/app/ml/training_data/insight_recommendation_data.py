import random
from typing import List, Tuple, Dict

INSIGHT_CLASSES = [
    'attrition_analysis', 'salary_analysis', 'department_comparison', 
    'promotion_analysis', 'overtime_analysis', 'job_satisfaction_analysis', 
    'revenue_trend', 'top_products', 'sales_growth', 'customer_segmentation', 
    'regional_sales', 'profit_analysis', 'stock_level_analysis', 
    'supplier_performance', 'inventory_turnover', 'campaign_roi', 
    'conversion_funnel', 'retention_rate_analysis'
]

# Mapping from domain to likely insights
DOMAIN_INSIGHTS = {
    'hr': [
        'attrition_analysis', 'salary_analysis', 'department_comparison', 
        'promotion_analysis', 'overtime_analysis', 'job_satisfaction_analysis'
    ],
    'sales': [
        'revenue_trend', 'top_products', 'sales_growth', 'regional_sales', 
        'profit_analysis'
    ],
    'customer': [
        'customer_segmentation', 'retention_rate_analysis'
    ],
    'finance': [
        'revenue_trend', 'profit_analysis'
    ],
    'inventory': [
        'stock_level_analysis', 'supplier_performance', 'inventory_turnover'
    ],
    'marketing': [
        'campaign_roi', 'conversion_funnel'
    ],
    'insurance': [
        'profit_analysis'
    ],
    'retail': [
        'revenue_trend', 'top_products'
    ],
    'supply_chain': [],
    'crm': [
        'conversion_funnel'
    ],
    'ecommerce': [
        'revenue_trend', 'top_products', 'conversion_funnel'
    ],
    'manufacturing': [],
    'generic': []
}

# Mapping from columns to specific insights
COLUMN_SPECIFIC_INSIGHTS = {
    'attrition': 'attrition_analysis',
    'left': 'attrition_analysis',
    'terminated': 'attrition_analysis',
    'salary': 'salary_analysis',
    'income': 'salary_analysis',
    'pay': 'salary_analysis',
    'revenue': 'revenue_trend',
    'sales': 'revenue_trend',
    'profit': 'profit_analysis',
    'margin': 'profit_analysis',
    'stock': 'stock_level_analysis',
    'inventory': 'stock_level_analysis',
    'campaign': 'campaign_roi',
    'roi': 'campaign_roi',
    'segment': 'customer_segmentation',
    'tier': 'customer_segmentation',
    'supplier': 'supplier_performance',
    'vendor': 'supplier_performance',
    'region': 'regional_sales',
    'state': 'regional_sales',
    'country': 'regional_sales',
    'department': 'department_comparison',
    'dept': 'department_comparison',
    'overtime': 'overtime_analysis',
    'satisfaction': 'job_satisfaction_analysis',
    'promotion': 'promotion_analysis'
}

def generate_insight_samples(num_samples: int = 400) -> Tuple[List[str], List[List[int]]]:
    texts = []
    labels = []
    
    # We iterate over domains
    for domain, candidate_insights in DOMAIN_INSIGHTS.items():
        # Get standard columns for this domain
        from app.ml.training_data.dataset_classification_data import DOMAIN_COLUMNS
        cols = DOMAIN_COLUMNS[domain]
        
        for _ in range(num_samples):
            # Pick a subset of columns
            num_cols = random.randint(3, min(15, len(cols)))
            chosen_cols = random.sample(cols, num_cols)
            
            # Formulate text feature
            cols_str = " ".join(chosen_cols)
            feature_text = f"domain: {domain} | columns: {cols_str}"
            
            # Determine labels active
            active_insights = set(candidate_insights)
            
            # Add insight if specific column is present
            for col in chosen_cols:
                col_lower = col.lower()
                for key, insight in COLUMN_SPECIFIC_INSIGHTS.items():
                    if key in col_lower:
                        active_insights.add(insight)
            
            # Filter insights not related to columns (e.g. if we don't have salary columns, we can't do salary_analysis)
            # Let's enforce strict validation:
            if 'salary_analysis' in active_insights and not any(k in cols_str for k in ['salary', 'income', 'pay', 'wage']):
                active_insights.remove('salary_analysis')
            if 'attrition_analysis' in active_insights and not any(k in cols_str for k in ['attrition', 'left', 'terminated', 'resigned']):
                active_insights.remove('attrition_analysis')
            if 'revenue_trend' in active_insights and not any(k in cols_str for k in ['revenue', 'sales', 'amount']):
                active_insights.remove('revenue_trend')
            if 'profit_analysis' in active_insights and not any(k in cols_str for k in ['profit', 'margin', 'net']):
                active_insights.remove('profit_analysis')
            if 'stock_level_analysis' in active_insights and not any(k in cols_str for k in ['stock', 'inventory', 'quantity']):
                active_insights.remove('stock_level_analysis')
            if 'campaign_roi' in active_insights and not any(k in cols_str for k in ['campaign', 'roi', 'spend']):
                active_insights.remove('campaign_roi')
            
            # Multi-label binary vector
            binary_labels = [1 if ins in active_insights else 0 for ins in INSIGHT_CLASSES]
            
            texts.append(feature_text)
            labels.append(binary_labels)
            
    return texts, labels
