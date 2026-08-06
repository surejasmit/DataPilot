import pandas as pd
from typing import Dict, Any, List

BUSINESS_KEYWORDS = [
    'employee', 'customer', 'sales', 'revenue', 'profit', 'salary',
    'department', 'region', 'country', 'order', 'product', 'quantity',
    'price', 'discount', 'invoice', 'inventory', 'stock', 'warehouse',
    'supplier', 'marketing', 'campaign', 'branch', 'store', 'category',
    'market', 'segment', 'hr', 'attrition', 'hire', 'job', 'role',
    'manager', 'company', 'insurance', 'banking', 'crm', 'ecommerce',
    'e-commerce', 'supply', 'chain', 'manufacturing', 'logistics',
    'cost', 'budget', 'expense', 'revenue', 'margin', 'gross',
    'net', 'income', 'payment', 'transaction', 'billing', 'account',
    'vendor', 'purchase', 'procurement', 'shipment', 'delivery',
    'fleet', 'asset', 'depreciation', 'amortization', 'forecast',
    'quota', 'target', 'performance', 'compensation', 'bonus',
    'commission', 'tenure', 'turnover', 'headcount', 'workforce',
    'retention', 'training', 'benefit', 'enrollment', 'premium',
    'claim', 'coverage', 'deductible', 'copay', 'pharmacy',
    'patient', 'diagnosis', 'treatment', 'readmission',
    'churn', 'lifetime', 'ltv', 'acquisition', 'conversion',
    'funnel', 'engagement', 'retention', 'cohort', 'arpu',
    'aov', 'cac', 'roi', 'kpi', 'benchmark', 'growth',
    'quarter', 'fiscal', 'annual', 'monthly', 'weekly', 'daily',
    'store', 'outlet', 'location', 'territory', 'zone',
    'sku', 'upc', 'barcode', 'item', 'unit', 'batch',
    'lot', 'serial', 'imei', 'asset_id', 'ticket',
]

BUSINESS_DOMAINS = {
    'hr': [
        'employee', 'salary', 'attrition', 'department', 'hire', 'job',
        'role', 'manager', 'tenure', 'turnover', 'headcount', 'workforce',
        'retention', 'training', 'benefit', 'compensation', 'bonus',
        'commission', 'performance', 'rating', 'review', 'promotion',
    ],
    'sales': [
        'sales', 'revenue', 'order', 'product', 'quantity', 'price',
        'discount', 'invoice', 'customer', 'region', 'territory',
        'quota', 'target', 'commission', 'margin', 'gross', 'net',
        'transaction', 'deal', 'pipeline', 'forecast', 'forecast',
    ],
    'customer': [
        'customer', 'churn', 'lifetime', 'ltv', 'acquisition',
        'retention', 'segment', 'cohort', 'engagement', 'conversion',
        'funnel', 'satisfaction', 'nps', 'csat', 'ces', 'support',
        'ticket', 'complaint', 'feedback', 'loyalty',
    ],
    'finance': [
        'revenue', 'profit', 'cost', 'expense', 'budget', 'income',
        'margin', 'gross', 'net', 'payment', 'billing', 'invoice',
        'account', 'transaction', 'balance', 'cash', 'flow', 'asset',
        'liability', 'equity', 'depreciation', 'amortization', 'tax',
        'fiscal', 'quarter', 'annual', 'forecast',
    ],
    'inventory': [
        'inventory', 'stock', 'warehouse', 'supplier', 'sku', 'item',
        'quantity', 'reorder', 'lead', 'time', 'turnover', 'batch',
        'lot', 'shipment', 'delivery', 'procurement', 'vendor',
        'purchase', 'unit', 'barcode', 'location', 'bin', 'shelf',
    ],
    'marketing': [
        'campaign', 'marketing', 'channel', 'conversion', 'impression',
        'click', 'ctr', 'cpm', 'cpc', 'cpa', 'roi', 'reach',
        'frequency', 'audience', 'segment', 'lead', 'pipeline',
        'content', 'email', 'social', 'seo', 'sem', 'paid', 'organic',
    ],
}


def detect_business_domain(df: pd.DataFrame) -> Dict[str, Any]:
    columns = [str(c).lower().strip() for c in df.columns]
    original_columns = [str(c) for c in df.columns]
    total_rows = len(df)

    if total_rows == 0:
        return {
            'is_business': False,
            'domain': 'unknown',
            'confidence': 0.0,
            'detected_columns': [],
            'message': 'The dataset is empty. Please provide a dataset with at least one row to analyze.'
        }

    # Try using ML models first
    try:
        from app.ml.registry import registry
        model = registry.get_model("dataset_classifier")
        schema_model = registry.get_model("schema_understander")
    except Exception:
        model = None
        schema_model = None

    if model is not None:
        try:
            # Predict using Model 1
            pred = model.predict(original_columns, [], total_rows, len(original_columns))
            dataset_type = pred.get("dataset_type", "Generic Dataset")
            confidence = pred.get("confidence", 0.0)

            ml_domain_map = {
                'Employee Dataset': 'hr',
                'Sales Dataset': 'sales',
                'Customer Dataset': 'customer',
                'Finance Dataset': 'finance',
                'Inventory Dataset': 'inventory',
                'Marketing Dataset': 'marketing',
                'Insurance Dataset': 'insurance',
                'Retail Dataset': 'retail',
                'Supply Chain Dataset': 'supply_chain',
                'CRM Dataset': 'crm',
                'E-commerce Dataset': 'ecommerce',
                'Manufacturing Dataset': 'manufacturing',
                'Generic Dataset': 'generic'
            }
            best_domain = ml_domain_map.get(dataset_type, 'generic')
            is_business = best_domain != 'generic' and confidence >= 0.3

            # Use Schema Understander to find business-relevant columns
            detected_col_names = []
            if schema_model is not None:
                schema_preds = schema_model.predict_batch(original_columns)
                for res in schema_preds:
                    # If model identifies column with >50% confidence as one of our concepts
                    if res["confidence"] > 0.5:
                        detected_col_names.append(res["original"])
            
            # Fallback if no columns detected but domain is business
            if is_business and not detected_col_names:
                detected_col_names = [original_columns[i] for i, col in enumerate(columns) if any(kw in col for kw in BUSINESS_KEYWORDS)]

            domain_labels = {
                'hr': 'Human Resources',
                'sales': 'Sales',
                'customer': 'Customer Analytics',
                'finance': 'Finance',
                'inventory': 'Inventory Management',
                'marketing': 'Marketing',
                'insurance': 'Insurance',
                'retail': 'Retail',
                'supply_chain': 'Supply Chain',
                'crm': 'CRM',
                'ecommerce': 'E-commerce',
                'manufacturing': 'Manufacturing',
                'generic': 'Business',
            }
            domain_label = domain_labels.get(best_domain, 'Business')

            if is_business:
                message = (
                    f"This dataset appears to be business-related "
                    f"(domain: {domain_label}, confidence: {confidence:.0%}). "
                    f"Detected {len(detected_col_names)} business-relevant columns. "
                    f"Business insights and analytics will be generated automatically."
                )
            else:
                message = (
                    "This dataset does not appear to contain business-related data. "
                    "Business analytics features are optimized for datasets with columns "
                    "related to employees, sales, customers, finances, inventory, or marketing. "
                    "You can still use the general data profiling features."
                )

            return {
                'is_business': is_business,
                'domain': best_domain if is_business else 'unknown',
                'confidence': confidence,
                'detected_columns': detected_col_names,
                'message': message
            }
        except Exception as e:
            print(f"[ML Validation] Error running ML validation: {e}. Falling back to rule-based.")

    keyword_matches = set()
    for col in columns:
        for keyword in BUSINESS_KEYWORDS:
            if keyword in col:
                keyword_matches.add(keyword)

    domain_scores: Dict[str, float] = {}
    for domain, domain_keywords in BUSINESS_DOMAINS.items():
        score = 0
        matched_cols = []
        for col in columns:
            for kw in domain_keywords:
                if kw in col:
                    score += 1
                    matched_cols.append(col)
                    break
        domain_scores[domain] = (score, matched_cols)

    best_domain = 'generic'
    best_score = 0
    best_cols = []
    for domain, (score, cols) in domain_scores.items():
        if score > best_score:
            best_score = score
            best_domain = domain
            best_cols = cols

    total_columns = len(columns)
    keyword_ratio = len(keyword_matches) / max(total_columns, 1) if total_columns > 0 else 0

    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    numeric_business_indicators = 0
    for col in numeric_cols:
        col_lower = str(col).lower()
        business_numeric_hints = [
            'revenue', 'sales', 'profit', 'salary', 'wage', 'income',
            'cost', 'price', 'amount', 'total', 'sum', 'count',
            'quantity', 'discount', 'margin', 'expense', 'budget',
            'payment', 'transaction', 'invoice', 'order', 'stock',
            'inventory', 'units', 'volume', 'value', 'fee', 'rate',
            'tax', 'commission', 'bonus', 'premium', 'claim',
        ]
        for hint in business_numeric_hints:
            if hint in col_lower:
                numeric_business_indicators += 1
                break

    if len(numeric_cols) > 0:
        numeric_ratio = numeric_business_indicators / len(numeric_cols)
    else:
        numeric_ratio = 0

    confidence = 0.0
    if keyword_ratio > 0.5:
        confidence = min(0.95, 0.6 + keyword_ratio * 0.4)
    elif keyword_ratio > 0.3:
        confidence = min(0.85, 0.4 + keyword_ratio * 0.4)
    elif keyword_ratio > 0.1:
        confidence = min(0.7, 0.2 + keyword_ratio * 0.4)
    elif len(keyword_matches) > 0:
        confidence = 0.3
    else:
        confidence = 0.1

    if numeric_ratio > 0.3 and confidence < 0.8:
        confidence = min(confidence + 0.15, 0.85)

    if best_score >= 2:
        confidence = max(confidence, 0.6 + best_score * 0.05)
    elif best_score >= 1:
        confidence = max(confidence, 0.4)

    confidence = round(min(confidence, 0.99), 2)

    is_business = confidence >= 0.3 or len(keyword_matches) >= 2

    detected_col_names = []
    for i, col in enumerate(columns):
        for kw in BUSINESS_KEYWORDS:
            if kw in col:
                detected_col_names.append(original_columns[i])
                break

    if is_business:
        domain_labels = {
            'hr': 'Human Resources',
            'sales': 'Sales',
            'customer': 'Customer Analytics',
            'finance': 'Finance',
            'inventory': 'Inventory Management',
            'marketing': 'Marketing',
            'generic': 'Business',
        }
        domain_label = domain_labels.get(best_domain, 'Business')
        message = (
            f"This dataset appears to be business-related "
            f"(domain: {domain_label}, confidence: {confidence:.0%}). "
            f"Detected {len(detected_col_names)} business-relevant columns. "
            f"Business insights and analytics will be generated automatically."
        )
    else:
        message = (
            "This dataset does not appear to contain business-related data. "
            "Business analytics features are optimized for datasets with columns "
            "related to employees, sales, customers, finances, inventory, or marketing. "
            "You can still use the general data profiling features."
        )

    return {
        'is_business': is_business,
        'domain': best_domain if is_business else 'unknown',
        'confidence': confidence,
        'detected_columns': detected_col_names,
        'message': message
    }
