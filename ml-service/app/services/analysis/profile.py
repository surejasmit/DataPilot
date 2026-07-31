import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.services.analysis.dataset_reader import infer_data_type


def generate_profile(df: pd.DataFrame, file_size: int, processing_time_ms: int) -> Dict[str, Any]:
    numeric_columns = 0
    categorical_columns = 0
    datetime_columns = 0
    boolean_columns = 0
    empty_columns = 0
    total_missing = 0
    
    column_stats = []
    
    for i, col in enumerate(df.columns):
        col_data = df[col]
        non_null = col_data.dropna()
        missing_count = col_data.isna().sum()
        missing_pct = (missing_count / len(col_data) * 100) if len(col_data) > 0 else 0
        unique_count = non_null.nunique()
        
        data_type = infer_data_type(col_data)
        
        if data_type == 'number':
            numeric_columns += 1
        elif data_type == 'date':
            datetime_columns += 1
        elif data_type == 'boolean':
            boolean_columns += 1
        else:
            categorical_columns += 1
        
        total_missing += missing_count
        if missing_count == len(col_data):
            empty_columns += 1
        
        col_stats = compute_column_stats(col_data, data_type)
        col_stats.update({
            'column_name': col,
            'data_type': data_type,
            'position': i,
            'missing_count': int(missing_count),
            'missing_percentage': round(float(missing_pct), 2),
            'unique_count': int(unique_count),
            'is_numeric': data_type == 'number',
            'is_categorical': data_type == 'string',
            'is_datetime': data_type == 'date',
            'is_boolean': data_type == 'boolean'
        })
        column_stats.append(col_stats)
    
    duplicate_rows = len(df) - df.drop_duplicates().shape[0]
    duplicate_pct = (duplicate_rows / len(df) * 100) if len(df) > 0 else 0
    
    profile = {
        'total_rows': int(len(df)),
        'total_columns': int(len(df.columns)),
        'missing_values_total': int(total_missing),
        'missing_percentage': round(total_missing / (len(df) * len(df.columns)) * 100, 2) if len(df) > 0 and len(df.columns) > 0 else 0,
        'duplicate_rows': int(duplicate_rows),
        'duplicate_percentage': round(duplicate_pct, 2),
        'empty_columns': int(empty_columns),
        'numeric_columns': int(numeric_columns),
        'categorical_columns': int(categorical_columns),
        'datetime_columns': int(datetime_columns),
        'boolean_columns': int(boolean_columns),
        'memory_usage_bytes': int(df.memory_usage(deep=True).sum()),
        'dataset_size_bytes': file_size,
        'dataset_shape': f"({len(df)}, {len(df.columns)})",
        'file_encoding': 'UTF-8',
        'processing_time_ms': processing_time_ms,
        'status': 'completed'
    }
    
    return {
        'profile': profile,
        'column_stats': column_stats
    }


def compute_column_stats(series: pd.Series, data_type: str) -> Dict[str, Any]:
    non_null = series.dropna()
    missing_count = series.isna().sum()
    
    stats = {
        'min_value': None,
        'max_value': None,
        'mean_value': None,
        'median_value': None,
        'mode_value': None,
        'std_dev': None,
        'q1': None,
        'q3': None,
    }
    
    if len(non_null) == 0:
        return stats
    
    if data_type == 'number':
        numeric_vals = pd.to_numeric(non_null, errors='coerce').dropna()
        if len(numeric_vals) > 0:
            numeric_vals_sorted = numeric_vals.sort_values()
            stats['min_value'] = float(numeric_vals_sorted.iloc[0])
            stats['max_value'] = float(numeric_vals_sorted.iloc[-1])
            stats['mean_value'] = round(float(numeric_vals.mean()), 4)
            stats['median_value'] = round(float(numeric_vals.median()), 4)
            
            mode_val = numeric_vals.mode()
            stats['mode_value'] = float(mode_val.iloc[0]) if len(mode_val) > 0 else None
            
            stats['std_dev'] = round(float(numeric_vals.std()), 4)
            q1 = numeric_vals.quantile(0.25)
            q3 = numeric_vals.quantile(0.75)
            stats['q1'] = round(float(q1), 4)
            stats['q3'] = round(float(q3), 4)
    else:
        stats['min_value'] = str(non_null.iloc[0]) if len(non_null) > 0 else None
        stats['max_value'] = str(non_null.iloc[-1]) if len(non_null) > 0 else None
        mode_val = non_null.mode()
        stats['mode_value'] = str(mode_val.iloc[0]) if len(mode_val) > 0 else None
    
    return stats


def get_column_data_types(df: pd.DataFrame) -> Dict[str, str]:
    return {col: infer_data_type(df[col]) for col in df.columns}