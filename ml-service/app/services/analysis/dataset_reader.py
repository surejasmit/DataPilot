import os
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple
from app.models.schemas import FileType


def detect_file_type(filename: str) -> FileType:
    ext = os.path.splitext(filename.lower())[1]
    if ext == '.csv':
        return FileType.CSV
    elif ext in ['.xlsx', '.xls']:
        return FileType.EXCEL
    elif ext == '.json':
        return FileType.JSON
    else:
        raise ValueError(f"Unsupported file type: {ext}. Supported: .csv, .xlsx, .xls, .json")


def read_csv(file_path: str, max_rows: int = None) -> pd.DataFrame:
    try:
        if max_rows:
            return pd.read_csv(file_path, nrows=max_rows, low_memory=False)
        return pd.read_csv(file_path, low_memory=False)
    except Exception as e:
        raise ValueError(f"Failed to read CSV: {str(e)}")


def read_excel(file_path: str, max_rows: int = None) -> pd.DataFrame:
    try:
        if max_rows:
            return pd.read_excel(file_path, nrows=max_rows)
        return pd.read_excel(file_path)
    except Exception as e:
        raise ValueError(f"Failed to read Excel: {str(e)}")


def read_json(file_path: str, max_rows: int = None) -> pd.DataFrame:
    try:
        if max_rows:
            df = pd.read_json(file_path, lines=True)
            return df.head(max_rows)
        return pd.read_json(file_path)
    except Exception as e:
        raise ValueError(f"Failed to read JSON: {str(e)}")


def resolve_file_path(file_path: str) -> str:
    if file_path and os.path.exists(file_path):
        return file_path
    
    if not file_path:
        return file_path
        
    basename = os.path.basename(file_path.replace('\\', '/'))
    
    candidates = [
        os.path.join("/app/uploads", basename),
        os.path.join("uploads", basename),
        os.path.join(os.getcwd(), "uploads", basename),
        os.path.join(os.getcwd(), "..", "Backend", "uploads", basename),
        os.path.join("D:", "sem5-project", "Backend", "uploads", basename),
        os.path.join("d:", "sem5-project", "Backend", "uploads", basename),
    ]
    for candidate in candidates:
        if os.path.exists(candidate):
            return candidate
            
    return file_path


def read_dataset(file_path: str, file_name: str, max_rows: int = None) -> pd.DataFrame:
    file_path = resolve_file_path(file_path)
    file_type = detect_file_type(file_name)
    
    if file_type == FileType.CSV:
        return read_csv(file_path, max_rows)
    elif file_type == FileType.EXCEL:
        return read_excel(file_path, max_rows)
    elif file_type == FileType.JSON:
        return read_json(file_path, max_rows)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def get_preview_rows(df: pd.DataFrame, limit: int = 100) -> List[Dict[str, Any]]:
    return df.head(limit).to_dict(orient='records')


def get_columns_info(df: pd.DataFrame) -> List[Dict[str, Any]]:
    columns = []
    for idx, col in enumerate(df.columns):
        col_data = df[col]
        non_null = col_data.dropna()
        missing_count = col_data.isna().sum()
        missing_pct = (missing_count / len(col_data) * 100) if len(col_data) > 0 else 0
        unique_count = non_null.nunique()
        
        columns.append({
            'column_name': str(col),
            'position': idx,
            'missing_count': int(missing_count),
            'missing_percentage': round(float(missing_pct), 2),
            'unique_count': int(unique_count),
            'sample_values': non_null.head(5).tolist() if len(non_null) > 0 else []
        })
    return columns


def infer_data_type(series: pd.Series) -> str:
    non_null = series.dropna()
    if len(non_null) == 0:
        return 'string'
    
    sample = non_null.head(min(100, len(non_null)))
    
    numeric_count = 0
    date_count = 0
    bool_count = 0
    
    for val in sample:
        if isinstance(val, (int, float, np.integer, np.floating)):
            numeric_count += 1
        elif isinstance(val, str):
            try:
                float(val)
                numeric_count += 1
            except ValueError:
                try:
                    pd.to_datetime(val)
                    date_count += 1
                except (ValueError, TypeError):
                    if val.lower() in ('true', 'false', '1', '0', 'yes', 'no'):
                        bool_count += 1
        elif isinstance(val, (pd.Timestamp, np.datetime64)):
            date_count += 1
        elif isinstance(val, (bool, np.bool_)):
            bool_count += 1
    
    total = len(sample)
    if numeric_count / total > 0.8:
        return 'number'
    if date_count / total > 0.8:
        return 'date'
    if bool_count / total > 0.8:
        return 'boolean'
    return 'string'


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
    }
    
    if len(non_null) == 0:
        return stats
    
    if data_type == 'number':
        numeric_vals = pd.to_numeric(non_null, errors='coerce').dropna()
        if len(numeric_vals) > 0:
            numeric_vals = numeric_vals.sort_values()
            stats['min_value'] = float(numeric_vals.iloc[0])
            stats['max_value'] = float(numeric_vals.iloc[-1])
            stats['range_value'] = float(numeric_vals.iloc[-1] - numeric_vals.iloc[0])
            stats['mean_value'] = round(float(numeric_vals.mean()), 4)
            stats['median_value'] = round(float(numeric_vals.median()), 4)
            
            mode_val = numeric_vals.mode()
            stats['mode_value'] = float(mode_val.iloc[0]) if len(mode_val) > 0 else None
            
            stats['std_dev'] = round(float(numeric_vals.std()), 4)
            stats['variance'] = round(float(numeric_vals.var()), 4)
            
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
    
    for col in df.columns:
        col_data = df[col]
        non_null = col_data.dropna()
        missing_count = col_data.isna().sum()
        total_missing += missing_count
        total_missing_cells += missing_count
        
        if missing_count == len(col_data):
            empty_cols.append(col)
            issues.append({
                'type': 'empty_column',
                'column': col,
                'severity': 'critical',
                'message': f'Column "{col}" is completely empty'
            })
            continue
        
        unique_vals = non_null.nunique()
        if unique_vals <= 1:
            constant_cols.append(col)
            issues.append({
                'type': 'constant_column',
                'column': col,
                'severity': 'warning',
                'message': f'Column "{col}" has constant value'
            })
        
        if unique_vals > 100:
            high_cardinality_cols.append(col)
            if total_rows > 100:
                issues.append({
                    'type': 'high_cardinality',
                    'column': col,
                    'severity': 'info',
                    'message': f'Column "{col}" has high cardinality ({unique_vals} unique values)'
                })
        
        types = set()
        for val in non_null.head(100):
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
            mixed_type_cols.append(col)
            issues.append({
                'type': 'mixed_types',
                'column': col,
                'severity': 'warning',
                'message': f'Column "{col}" has mixed data types'
            })
        
        is_numeric = all(isinstance(v, (int, float, np.integer, np.floating)) or 
                        (isinstance(v, str) and v.replace('.', '', 1).replace('-', '', 1).isdigit()) 
                        for v in non_null.head(100))
        is_date = not is_numeric and all(isinstance(v, (pd.Timestamp, np.datetime64)) or 
                                         (isinstance(v, str) and pd.to_datetime(v, errors='coerce') is not pd.NaT) 
                                         for v in non_null.head(100))
        
        if is_numeric:
            num_cols.append(col)
            numeric_vals = pd.to_numeric(non_null, errors='coerce').dropna()
            if len(numeric_vals) >= 5:
                numeric_vals = numeric_vals.sort_values()
                q1 = numeric_vals.quantile(0.25)
                q3 = numeric_vals.quantile(0.75)
                iqr = q3 - q1
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr
                outliers = numeric_vals[(numeric_vals < lower) | (numeric_vals > upper)]
                if len(outliers) > 0:
                    outlier_cols.append(col)
                    issues.append({
                        'type': 'outliers',
                        'column': col,
                        'severity': 'warning',
                        'message': f'Column "{col}" has {len(outliers)} outliers (IQR method)'
                    })
        elif is_date:
            date_cols.append(col)
        else:
            cat_cols.append(col)
        
        if missing_count > 0:
            pct = (missing_count / len(col_data) * 100)
            severity = 'critical' if pct > 20 else 'warning'
            issues.append({
                'type': 'missing_values',
                'column': col,
                'severity': severity,
                'message': f'Missing values in {col} ({int(missing_count)} / {pct:.2f}%)'
            })
    
    duplicate_rows = total_rows - df.drop_duplicates().shape[0]
    if duplicate_rows > 0:
        dup_pct = (duplicate_rows / total_rows * 100)
        severity = 'critical' if dup_pct > 10 else 'warning'
        issues.append({
            'type': 'duplicate_rows',
            'column': None,
            'severity': severity,
            'message': f'Duplicate rows: {duplicate_rows} ({dup_pct:.2f}%)'
        })
    
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


def compute_correlations(df: pd.DataFrame, numeric_columns: List[str]) -> List[Dict[str, Any]]:
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


def generate_dataset_profile(df: pd.DataFrame, file_size: int, processing_time_ms: int) -> Dict[str, Any]:
    numeric_cols = []
    cat_cols = []
    date_cols = []
    bool_cols = []
    total_missing = 0
    
    for col in df.columns:
        dtype = infer_data_type(df[col])
        missing = df[col].isna().sum()
        total_missing += missing
        
        if dtype == 'number':
            numeric_cols.append(col)
        elif dtype == 'date':
            date_cols.append(col)
        elif dtype == 'boolean':
            bool_cols.append(col)
        else:
            cat_cols.append(col)
    
    duplicate_rows = len(df) - df.drop_duplicates().shape[0]
    empty_cols = [col for col in df.columns if df[col].isna().all()]
    
    return {
        'total_rows': int(len(df)),
        'total_columns': int(len(df.columns)),
        'missing_values_total': int(total_missing),
        'missing_percentage': round(total_missing / (len(df) * len(df.columns)) * 100, 2) if len(df) > 0 and len(df.columns) > 0 else 0,
        'duplicate_rows': int(duplicate_rows),
        'duplicate_percentage': round(duplicate_rows / len(df) * 100, 2) if len(df) > 0 else 0,
        'empty_columns': len(empty_cols),
        'numeric_columns': len(numeric_cols),
        'categorical_columns': len(cat_cols),
        'datetime_columns': len(date_cols),
        'boolean_columns': len(bool_cols),
        'memory_usage_bytes': int(df.memory_usage(deep=True).sum()),
        'dataset_size_bytes': file_size,
        'dataset_shape': f"({len(df)}, {len(df.columns)})",
        'file_encoding': 'UTF-8',
        'processing_time_ms': processing_time_ms,
        'status': 'completed'
    }