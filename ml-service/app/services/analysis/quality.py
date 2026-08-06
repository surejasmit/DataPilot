import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.services.analysis.dataset_reader import infer_data_type


PII_PATTERNS = {
    'email': ['email', 'e-mail', 'mail'],
    'phone': ['phone', 'telephone', 'mobile', 'cell', 'contact_number'],
    'name': ['first_name', 'last_name', 'full_name', 'name', 'fname', 'lname'],
    'ssn': ['ssn', 'social_security', 'sin'],
    'address': ['address', 'street', 'city', 'zip', 'postal'],
}

REVENUE_KEYWORDS = ['revenue', 'sales', 'income', 'amount', 'total', 'gross', 'net']
SALARY_KEYWORDS = ['salary', 'pay', 'wage', 'compensation', 'income', 'earnings']
PRICE_KEYWORDS = ['price', 'cost', 'rate', 'fee', 'charge']

CATEGORICAL_KEYWORDS = ['department', 'region', 'category', 'segment', 'territory',
                         'group', 'type', 'status', 'brand', 'supplier', 'vendor']


def detect_quality_issues(df: pd.DataFrame) -> Dict[str, Any]:
    issues = []
    total_rows = len(df)
    total_cols = len(df.columns)

    empty_cols = []
    constant_cols = []
    mixed_type_cols = []
    outlier_cols = []
    high_cardinality_cols = []
    date_cols = []
    cat_cols = []
    num_cols = []
    total_missing = 0
    total_missing_cells = 0
    pii_warnings = []

    for i in range(total_cols):
        col_name = df.columns[i]
        col_values = df[col_name]
        non_null_values = col_values.dropna()
        missing_count = col_values.isna().sum()
        total_missing += missing_count
        total_missing_cells += missing_count

        if missing_count == len(col_values):
            empty_cols.append(col_name)
            issues.append({'type': 'empty_column', 'column': col_name, 'severity': 'critical', 'message': 'Column "{}" is completely empty'.format(col_name)})
            continue

        unique_values = non_null_values.nunique()
        if unique_values <= 1:
            constant_cols.append(col_name)
            issues.append({'type': 'constant_column', 'column': col_name, 'severity': 'warning', 'message': 'Column "{}" has constant value'.format(col_name)})

        if unique_values > 100:
            high_cardinality_cols.append(col_name)
            if total_rows > 100:
                issues.append({'type': 'high_cardinality', 'column': col_name, 'severity': 'info', 'message': 'Column "{}" has high cardinality ({} unique values)'.format(col_name, unique_values)})

        types = set()
        for val in non_null_values.head(100):
            if isinstance(val, (int, float, np.integer, np.floating)):
                types.add('number')
            elif isinstance(val, str):
                try:
                    float(val)
                    types.add('number')
                except ValueError:
                    try:
                        pd.to_datetime(val)
                        types.add('date')
                    except (ValueError, TypeError):
                        if val.lower() in ('true', 'false', '1', '0', 'yes', 'no'):
                            types.add('boolean')
                        else:
                            types.add('string')
            elif isinstance(val, (pd.Timestamp, np.datetime64)):
                types.add('date')
            elif isinstance(val, (bool, np.bool_)):
                types.add('boolean')

        if len(types) > 1:
            mixed_type_cols.append(col_name)
            issues.append({'type': 'mixed_types', 'column': col_name, 'severity': 'warning', 'message': 'Column "{}" has mixed data types'.format(col_name)})

        is_numeric = all(isinstance(v, (int, float, np.integer, np.floating)) or
                        (isinstance(v, str) and v.replace('.', '', 1).replace('-', '', 1).isdigit())
                        for v in non_null_values.head(100))
        is_date = not is_numeric and all(isinstance(v, (pd.Timestamp, np.datetime64)) or
                                         (isinstance(v, str) and pd.to_datetime(v, errors='coerce') is not pd.NaT)
                                         for v in non_null_values.head(100))

        if is_numeric:
            num_cols.append(col_name)
            numeric_vals = pd.to_numeric(non_null_values, errors='coerce').dropna()
            if len(numeric_vals) >= 5:
                numeric_vals = numeric_vals.sort_values()
                q1 = numeric_vals.quantile(0.25)
                q3 = numeric_vals.quantile(0.75)
                iqr = q3 - q1
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr
                outliers = numeric_vals[(numeric_vals < lower_bound) | (numeric_vals > upper_bound)]
                if len(outliers) > 0:
                    outlier_cols.append(col_name)
                    issues.append({'type': 'outliers', 'column': col_name, 'severity': 'warning', 'message': 'Column "{}" has {} outliers detected (IQR method)'.format(col_name, len(outliers))})
        elif is_date:
            date_cols.append(col_name)
        else:
            cat_cols.append(col_name)

        if missing_count > 0:
            pct = (missing_count / len(col_values) * 100)
            severity = 'critical' if pct > 20 else 'warning'
            issues.append({'type': 'missing_values', 'column': col_name, 'severity': severity, 'message': 'Missing values in {} ({int_count} / {pct:.2f}%)'.format(col_name, int_count=int(missing_count), pct=pct)})

    col_lower_map = {str(c).lower().strip(): c for c in df.columns}

    for pattern_key, pattern_names in PII_PATTERNS.items():
        for col_lower, col_orig in col_lower_map.items():
            if any(p in col_lower for p in pattern_names):
                pii_warnings.append({'column': col_orig, 'type': pattern_key})
                issues.append({
                    'type': 'pii_detected',
                    'column': col_orig,
                    'severity': 'warning',
                    'message': 'Potential PII detected in column "{}" (type: {}). Ensure compliance with data privacy regulations (GDPR, CCPA) before sharing.'.format(col_orig, pattern_key)
                })

    critical_business_cols = []
    for kw in REVENUE_KEYWORDS + SALARY_KEYWORDS + PRICE_KEYWORDS:
        for col_lower, col_orig in col_lower_map.items():
            if kw in col_lower:
                missing_in_col = df[col_orig].isna().sum()
                if missing_in_col > 0:
                    pct = (missing_in_col / total_rows * 100)
                    critical_business_cols.append(col_orig)
                    issues.append({
                        'type': 'missing_business_column',
                        'column': col_orig,
                        'severity': 'critical',
                        'message': 'Business-critical column "{}" has {} missing values ({:.2f}%). This may affect business analytics accuracy.'.format(col_orig, int(missing_in_col), pct)
                    })

    inconsistent_cols = []
    for kw in CATEGORICAL_KEYWORDS:
        for col_lower, col_orig in col_lower_map.items():
            if kw in col_lower and df[col_orig].dtype == 'object':
                vals = df[col_orig].dropna().astype(str)
                if len(vals) > 0:
                    stripped = vals.str.strip()
                    lower = stripped.str.lower()
                    if not (stripped == lower.str.title()).all() and not (stripped == lower).all():
                        inconsistent_cols.append(col_orig)
                        issues.append({
                            'type': 'inconsistent_naming',
                            'column': col_orig,
                            'severity': 'warning',
                            'message': 'Column "{}" may have inconsistent naming (e.g., mixed case or spacing). Consider standardizing.'.format(col_orig)
                        })

    business_quality_score = 100.0
    if pii_warnings:
        business_quality_score -= len(pii_warnings) * 5
    if critical_business_cols:
        business_quality_score -= len(critical_business_cols) * 10
    if inconsistent_cols:
        business_quality_score -= len(inconsistent_cols) * 3
    business_quality_score = max(0, business_quality_score)

    duplicate_rows = total_rows - df.drop_duplicates().shape[0]
    if duplicate_rows > 0:
        dup_pct = ((duplicate_rows / total_rows) * 100) if total_rows > 0 else 0
        issues.append({'type': 'duplicate_rows', 'column': None, 'severity': 'critical' if dup_pct > 10 else 'warning', 'message': 'Duplicate rows: {} ({:.2f}%)'.format(duplicate_rows, dup_pct)})

    missing_pct = (total_missing / (total_rows * total_cols) * 100) if total_rows > 0 and total_cols > 0 else 0

    return {
        'total_rows': total_rows,
        'missing_values': int(total_missing),
        'missing_percentage': round(missing_pct, 2),
        'duplicate_rows': int(duplicate_rows),
        'duplicate_percentage': round(duplicate_rows / total_rows * 100, 2) if total_rows > 0 else 0,
        'empty_columns': empty_cols,
        'constant_columns': constant_cols,
        'mixed_type_columns': mixed_type_cols,
        'outlier_columns': outlier_cols,
        'high_cardinality_columns': high_cardinality_cols,
        'date_columns': date_cols,
        'categorical_columns': cat_cols,
        'numeric_columns': num_cols,
        'issues': issues,
        'business_quality_score': round(business_quality_score, 1),
        'pii_columns': [w['column'] for w in pii_warnings],
        'inconsistent_columns': inconsistent_cols,
    }
