import pandas as pd
import numpy as np
from typing import Dict, Any, List
from scipy import stats


def compute_column_statistics(series: pd.Series, data_type: str) -> Dict[str, Any]:
    non_null = series.dropna()
    missing_count = series.isna().sum()
    missing_pct = (missing_count / len(series) * 100) if len(series) > 0 else 0
    unique_count = non_null.nunique()
    
    stats = {
        'missing_count': int(missing_count),
        'missing_percentage': round(float(missing_pct), 2),
        'unique_count': int(unique_count),
        'min_value': None,
        'max_value': None,
        'mean_value': None,
        'median_value': None,
        'mode_value': None,
        'std_dev': None,
        'variance': None,
        'q1': None,
        'q3': None,
        'iqr': None,
        'range_value': None,
        'skewness': None,
        'kurtosis': None,
    }
    
    if len(non_null) == 0:
        return stats
    
    if data_type == 'number':
        numeric_vals = pd.to_numeric(non_null, errors='coerce').dropna()
        if len(numeric_vals) > 0:
            numeric_vals_sorted = numeric_vals.sort_values()
            stats['min_value'] = float(numeric_vals_sorted.iloc[0])
            stats['max_value'] = float(numeric_vals_sorted.iloc[-1])
            stats['range_value'] = float(numeric_vals_sorted.iloc[-1] - numeric_vals_sorted.iloc[0])
            stats['mean_value'] = round(float(numeric_vals.mean()), 4)
            stats['median_value'] = round(float(numeric_vals.median()), 4)
            
            mode_val = numeric_vals.mode()
            stats['mode_value'] = float(mode_val.iloc[0]) if len(mode_val) > 0 else None
            
            stats['std_dev'] = round(float(numeric_vals.std()), 4)
            stats['variance'] = round(float(numeric_vals.var()), 4)
            stats['skewness'] = round(float(numeric_vals.skew()), 4) if len(numeric_vals) >= 3 else None
            stats['kurtosis'] = round(float(numeric_vals.kurtosis()), 4) if len(numeric_vals) >= 4 else None
            
            q1 = numeric_vals.quantile(0.25)
            q3 = numeric_vals.quantile(0.75)
            stats['q1'] = round(float(q1), 4)
            stats['q3'] = round(float(q3), 4)
            stats['iqr'] = round(float(q3 - q1), 4)
    else:
        stats['min_value'] = str(non_null.iloc[0]) if len(non_null) > 0 else None
        stats['max_value'] = str(non_null.iloc[-1]) if len(non_null) > 0 else None
        mode_val = non_null.mode()
        stats['mode_value'] = str(mode_val.iloc[0]) if len(mode_val) > 0 else None
    
    return stats


def generate_statistics_summary(df: pd.DataFrame, column_types: Dict[str, str]) -> List[Dict[str, Any]]:
    numeric_columns = [col for col, dtype in column_types.items() if dtype == 'number']
    
    results = []
    for col in numeric_columns:
        col_stats = compute_column_statistics(df[col], 'number')
        col_stats['column_name'] = col
        results.append(col_stats)
    
    return results


def compute_distribution_analysis(df: pd.DataFrame, column_types: Dict[str, str]) -> Dict[str, Any]:
    unique_values = {}
    top_categories = {}
    
    for col, dtype in column_types.items():
        non_null = df[col].dropna()
        unique_count = non_null.nunique()
        unique_values[col] = {'column': col, 'count': int(unique_count)}
        
        if dtype != 'number' and unique_count > 0:
            mode_val = non_null.mode()
            top_categories[col] = {
                'column': col,
                'top_value': str(mode_val.iloc[0]) if len(mode_val) > 0 else None,
                'top_count': int(non_null.value_counts().iloc[0]) if len(non_null) > 0 else 0
            }
    
    return {
        'unique_values': list(unique_values.values()),
        'top_categories': list(top_categories.values())
    }


def compute_correlation_matrix(df: pd.DataFrame, numeric_columns: List[str]) -> List[Dict[str, Any]]:
    if len(numeric_columns) < 2:
        return []
    
    numeric_df = df[numeric_columns].apply(pd.to_numeric, errors='coerce')
    corr_matrix = numeric_df.corr(method='pearson')
    
    correlations = []
    cols = corr_matrix.columns.tolist()
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            val = corr_matrix.iloc[i, j]
            if not pd.isna(val):
                strength = 'strong' if abs(val) > 0.7 else 'moderate' if abs(val) > 0.4 else 'weak'
                direction = 'positive' if val > 0 else 'negative'
                correlations.append({
                    'column1': cols[i],
                    'column2': cols[j],
                    'correlation': round(float(val), 4),
                    'strength': strength,
                    'direction': direction
                })
    
    return sorted(correlations, key=lambda x: abs(x['correlation']), reverse=True)