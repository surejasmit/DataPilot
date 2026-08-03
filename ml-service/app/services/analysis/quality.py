import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.services.analysis.dataset_reader import infer_data_type


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
    
    for i in range(total_cols):
        col_name = df.columns[i]
        col_values = df[col_name]
        non_null_values = col_values.dropna()
        missing_count = col_values.isna().sum()
        total_missing += missing_count
        total_missing_cells += missing_count
        
        if missing_count == len(col_values):
            empty_cols.append(col_name)
            issues.append({'type': 'empty_column', 'column': col_name, 'severity': 'critical', 'message': f'Column "{col_name}" is completely empty'})
            continue
        
        unique_values = non_null_values.nunique()
        if unique_values <= 1:
            constant_cols.append(col_name)
            issues.append({'type': 'constant_column', 'column': col_name, 'severity': 'warning', 'message': f'Column "{col_name}" has constant value'})
        
        if unique_values > 100:
            high_cardinality_cols.append(col_name)
            if total_rows > 100:
                issues.append({'type': 'high_cardinality', 'column': col_name, 'severity': 'info', 'message': f'Column "{col_name}" has high cardinality ({unique_values} unique values)'})
        
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
            issues.append({'type': 'mixed_types', 'column': col_name, 'severity': 'warning', 'message': f'Column "{col_name}" has mixed data types'})
        
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
                    issues.append({'type': 'outliers', 'column': col_name, 'severity': 'warning', 'message': f'Column "{col_name}" has {len(outliers)} outliers detected (IQR method)'})
        elif is_date:
            date_cols.append(col_name)
        else:
            cat_cols.append(col_name)
        
        if missing_count > 0:
            pct = (missing_count / len(col_values) * 100)
            severity = 'critical' if pct > 20 else 'warning'
            issues.append({'type': 'missing_values', 'column': col_name, 'severity': severity, 'message': f'Missing values in {col_name} ({int(missing_count)} / {pct:.2f}%)'})
    
    duplicate_rows = total_rows - df.drop_duplicates().shape[0]
    if duplicate_rows > 0:
        dup_pct = ((duplicate_rows / total_rows) * 100) if total_rows > 0 else 0
        issues.append({'type': 'duplicate_rows', 'column': None, 'severity': 'critical' if dup_pct > 10 else 'warning', 'message': f'Duplicate rows: {duplicate_rows} ({dup_pct:.2f}%)'})
    
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
        'issues': issues
    }