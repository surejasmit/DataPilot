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
    elif ext == '.parquet':
        return FileType.PARQUET
    else:
        raise ValueError(f"Unsupported file type: {ext}. Supported: .csv, .xlsx, .xls, .json, .parquet")


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


def read_parquet(file_path: str, max_rows: int = None) -> pd.DataFrame:
    try:
        if max_rows:
            return pd.read_parquet(file_path, engine='pyarrow').head(max_rows)
        return pd.read_parquet(file_path, engine='pyarrow')
    except Exception:
        try:
            if max_rows:
                return pd.read_parquet(file_path, engine='fastparquet').head(max_rows)
            return pd.read_parquet(file_path, engine='fastparquet')
        except Exception as e:
            raise ValueError(f"Failed to read Parquet: {str(e)}")


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
    elif file_type == FileType.PARQUET:
        return read_parquet(file_path, max_rows)
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
        stats['min_value'] = None
        stats['max_value'] = None
        mode_val = non_null.mode()
        stats['mode_value'] = str(mode_val.iloc[0]) if len(mode_val) > 0 else None

    return stats
