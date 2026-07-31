import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.services.analysis.dataset_reader import read_dataset, infer_data_type, get_preview_rows


def answer_dataset_question(file_path: str, file_name: str, question: str) -> Dict[str, Any]:
    df = read_dataset(file_path, file_name)
    column_types = {col: infer_data_type(df[col]) for col in df.columns}
    
    return answer_question(df, column_types, question)


def answer_question(df: pd.DataFrame, column_types: Dict[str, str], question: str) -> Dict[str, Any]:
    question_lower = question.lower()
    
    if any(kw in question_lower for kw in ['how many rows', 'number of rows', 'row count', 'total rows']):
        return {
            'answer': f'The dataset has {len(df)} rows.',
            'confidence': 100,
            'details': {'metric': 'Total Rows', 'value': len(df)},
            'sources': ['dataset_profile']
        }
    
    if any(kw in question_lower for kw in ['how many columns', 'number of columns', 'column count', 'total columns']):
        return {
            'answer': f'The dataset has {len(df.columns)} columns: {", ".join(df.columns.tolist())}.',
            'confidence': 100,
            'details': {'metric': 'Total Columns', 'value': len(df.columns)},
            'sources': ['dataset_profile']
        }
    
    if 'missing' in question_lower or 'null' in question_lower:
        total_missing = df.isna().sum().sum()
        cols_with_missing = df.columns[df.isna().any()].tolist()
        return {
            'answer': f'There are {total_missing} missing values across {len(cols_with_missing)} columns: {", ".join(cols_with_missing)}.',
            'confidence': 100,
            'details': {'total_missing': int(total_missing), 'columns_with_missing': cols_with_missing},
            'sources': ['quality_report']
        }
    
    if 'duplicate' in question_lower:
        dup_count = len(df) - df.drop_duplicates().shape[0]
        return {
            'answer': f'There are {dup_count} duplicate rows in the dataset.',
            'confidence': 100,
            'details': {'metric': 'Duplicate Rows', 'value': dup_count},
            'sources': ['quality_report']
        }
    
    for col in df.columns:
        if col.lower() in question_lower:
            dtype = column_types.get(col, infer_data_type(df[col]))
            non_null = df[col].dropna()
            
            if dtype == 'number':
                numeric_vals = pd.to_numeric(non_null, errors='coerce').dropna()
                if len(numeric_vals) == 0:
                    return {'answer': f'Column "{col}" has no valid numeric values.', 'confidence': 50, 'details': {}, 'sources': []}
                
                if 'average' in question_lower or 'mean' in question_lower:
                    return {'answer': f'The average of {col} is {numeric_vals.mean():.2f}.', 'confidence': 95,
                           'details': {'metric': f'Mean {col}', 'value': f'{numeric_vals.mean():.2f}'}, 'sources': ['statistics']}
                if 'median' in question_lower:
                    return {'answer': f'The median of {col} is {numeric_vals.median():.2f}.', 'confidence': 95,
                           'details': {'metric': f'Median {col}', 'value': f'{numeric_vals.median():.2f}'}, 'sources': ['statistics']}
                if 'max' in question_lower or 'maximum' in question_lower:
                    return {'answer': f'The maximum value of {col} is {numeric_vals.max():.2f}.', 'confidence': 100,
                           'details': {'metric': f'Max {col}', 'value': f'{numeric_vals.max():.2f}'}, 'sources': ['statistics']}
                if 'min' in question_lower or 'minimum' in question_lower:
                    return {'answer': f'The minimum value of {col} is {numeric_vals.min():.2f}.', 'confidence': 100,
                           'details': {'metric': f'Min {col}', 'value': f'{numeric_vals.min():.2f}'}, 'sources': ['statistics']}
                if 'std' in question_lower or 'standard deviation' in question_lower:
                    return {'answer': f'The standard deviation of {col} is {numeric_vals.std():.2f}.', 'confidence': 95,
                           'details': {'metric': f'Std Dev {col}', 'value': f'{numeric_vals.std():.2f}'}, 'sources': ['statistics']}
                if 'unique' in question_lower:
                    return {'answer': f'Column {col} has {numeric_vals.nunique()} unique values.', 'confidence': 100,
                           'details': {'metric': f'Unique {col}', 'value': str(numeric_vals.nunique())}, 'sources': ['statistics']}
            
            elif dtype == 'string':
                if 'unique' in question_lower:
                    return {'answer': f'Column {col} has {non_null.nunique()} unique values.', 'confidence': 100,
                           'details': {'metric': f'Unique {col}', 'value': str(non_null.nunique())}, 'sources': ['statistics']}
                if 'most common' in question_lower or 'top' in question_lower or 'frequent' in question_lower:
                    freq = non_null.astype(str).value_counts()
                    if len(freq) > 0:
                        return {'answer': f'The most common value in {col} is "{freq.index[0]}" appearing {freq.iloc[0]} times.', 'confidence': 95,
                               'details': {'metric': f'Top {col}', 'value': f'{freq.index[0]} ({freq.iloc[0]})'}, 'sources': ['insights']}
                if 'categories' in question_lower or 'values' in question_lower:
                    freq = non_null.astype(str).value_counts().head(10)
                    return {'answer': f'Top categories in {col}: {", ".join([f"{k} ({v})" for k, v in freq.items()])}.', 'confidence': 90,
                           'details': {'metric': f'Top Categories {col}', 'value': ', '.join([f'{k} ({v})' for k, v in freq.items()])}, 'sources': ['insights']}
    
    if 'correlation' in question_lower:
        numeric_cols = [c for c, t in column_types.items() if t == 'number']
        if len(numeric_cols) >= 2:
            numeric_df = df[numeric_cols].apply(pd.to_numeric, errors='coerce')
            corr_matrix = numeric_df.corr()
            pairs = []
            for i in range(len(numeric_cols)):
                for j in range(i + 1, len(numeric_cols)):
                    val = corr_matrix.iloc[i, j]
                    if not pd.isna(val):
                        pairs.append((numeric_cols[i], numeric_cols[j], val))
            pairs.sort(key=lambda x: abs(x[2]), reverse=True)
            top_pairs = pairs[:3]
            desc = "; ".join([f'{c1} & {c2}: {v:.4f}' for c1, c2, v in top_pairs])
            return {'answer': f'Top correlations: {desc}', 'confidence': 85,
                   'details': {'correlations': [{'col1': c1, 'col2': c2, 'value': v} for c1, c2, v in top_pairs]}, 'sources': ['correlations']}
    
    if 'summary' in question_lower or 'overview' in question_lower:
        numeric_cols = [c for c, t in column_types.items() if t == 'number']
        cat_cols = [c for c, t in column_types.items() if t == 'string']
        return {'answer': f'Dataset has {len(df)} rows, {len(df.columns)} columns. Numeric: {len(numeric_cols)}, Categorical: {len(cat_cols)}. Missing: {df.isna().sum().sum()}.', 'confidence': 95,
               'details': {'rows': len(df), 'columns': len(df.columns), 'numeric': len(numeric_cols), 'categorical': len(cat_cols)}, 'sources': ['profile']}
    
    return {
        'answer': 'I cannot answer that question. Try asking about rows, columns, missing values, duplicates, specific column statistics, or correlations.',
        'confidence': 30,
        'details': {},
        'sources': []
    }


def generate_suggested_questions(df: pd.DataFrame, column_types: Dict[str, str]) -> List[str]:
    questions = [
        "How many rows are in the dataset?",
        "How many columns are in the dataset?",
        "Are there any missing values?",
        "Are there any duplicate rows?",
        "What is the summary of the dataset?"
    ]
    
    numeric_cols = [c for c, t in column_types.items() if t == 'number']
    for col in numeric_cols[:3]:
        questions.extend([
            f"What is the average of {col}?",
            f"What is the maximum value of {col}?",
            f"What is the minimum value of {col}?",
            f"How many unique values in {col}?"
        ])
    
    cat_cols = [c for c, t in column_types.items() if t == 'string']
    for col in cat_cols[:3]:
        questions.extend([
            f"What are the top categories in {col}?",
            f"How many unique values in {col}?",
            f"What is the most common value in {col}?"
        ])
    
    if len(numeric_cols) >= 2:
        questions.append("What are the strongest correlations?")
    
    return questions[:15]


def clean_dataset(file_path: str, file_name: str, operation: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
    if params is None:
        params = {}
    
    df = read_dataset(file_path, file_name)
    
    if operation == 'remove_missing':
        original_len = len(df)
        df = df.dropna()
        return {
            'cleaned_rows': df.to_dict(orient='records'),
            'columns': df.columns.tolist(),
            'removed': original_len - len(df),
            'fill_value': None
        }
    
    elif operation == 'fill_missing':
        method = params.get('method', 'mode')
        fill_values = {}
        for col in df.columns:
            non_null = df[col].dropna()
            if len(non_null) == 0:
                continue
            
            if method == 'mean':
                numeric = pd.to_numeric(non_null, errors='coerce').dropna()
                if len(numeric) > 0:
                    fill_val = numeric.mean()
            elif method == 'median':
                numeric = pd.to_numeric(non_null, errors='coerce').dropna()
                if len(numeric) > 0:
                    fill_val = numeric.median()
            else:
                mode = non_null.mode()
                fill_val = mode.iloc[0] if len(mode) > 0 else ''
            
            df[col] = df[col].fillna(fill_val)
            fill_values[col] = fill_val
        
        return {
            'cleaned_rows': df.to_dict(orient='records'),
            'columns': df.columns.tolist(),
            'removed': 0,
            'fill_value': fill_values
        }
    
    elif operation == 'remove_duplicates':
        original_len = len(df)
        df = df.drop_duplicates()
        return {
            'cleaned_rows': df.to_dict(orient='records'),
            'columns': df.columns.tolist(),
            'removed': original_len - len(df),
            'fill_value': None
        }
    
    elif operation == 'trim_spaces':
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].astype(str).str.strip()
        return {
            'cleaned_rows': df.to_dict(orient='records'),
            'columns': df.columns.tolist(),
            'removed': 0,
            'fill_value': None
        }
    
    elif operation == 'convert_types':
        column_types = params.get('column_types', {})
        for col, target_type in column_types.items():
            if col in df.columns:
                if target_type == 'number':
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                elif target_type == 'string':
                    df[col] = df[col].astype(str)
                elif target_type == 'date':
                    df[col] = pd.to_datetime(df[col], errors='coerce')
                elif target_type == 'boolean':
                    df[col] = df[col].astype(bool)
        return {
            'cleaned_rows': df.to_dict(orient='records'),
            'columns': df.columns.tolist(),
            'removed': 0,
            'fill_value': None
        }
    
    else:
        raise ValueError(f"Unknown cleaning operation: {operation}")


def get_chart_data(file_path: str, file_name: str, chart_type: str, columns: List[str]) -> Dict[str, Any]:
    df = read_dataset(file_path, file_name)
    
    data = {}
    for col in columns:
        if col in df.columns:
            vals = df[col].dropna()
            if pd.api.types.is_numeric_dtype(vals):
                data[col] = vals.tolist()
            else:
                data[col] = vals.astype(str).tolist()
    
    return {
        'chart_type': chart_type,
        'columns': columns,
        'data': data
    }