import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.services.analysis.dataset_reader import infer_data_type


def generate_insights(df: pd.DataFrame, column_types: Dict[str, str], column_stats: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    insights = []
    total_rows = len(df)
    
    if total_rows == 0:
        return insights
    
    numeric_cols = [col for col, dtype in column_types.items() if dtype == 'number']
    categorical_cols = [col for col, dtype in column_types.items() if dtype == 'string']
    datetime_cols = [col for col, dtype in column_types.items() if dtype == 'date']
    
    for col in numeric_cols:
        vals = pd.to_numeric(df[col], errors='coerce').dropna()
        if len(vals) == 0:
            continue
        
        mean_val = vals.mean()
        max_val = vals.max()
        min_val = vals.min()
        median_val = vals.median()
        
        insights.append({
            'type': 'statistic',
            'title': f'Average {col}',
            'description': f'The average value of {col} is {mean_val:.2f}',
            'details': {'metric': f'Average {col}', 'value': f'{mean_val:.2f}'},
            'severity': 'info',
            'confidence': 95
        })
        insights.append({
            'type': 'statistic',
            'title': f'Maximum {col}',
            'description': f'The maximum value of {col} is {max_val:.2f}',
            'details': {'metric': f'Maximum {col}', 'value': f'{max_val:.2f}'},
            'severity': 'info',
            'confidence': 100
        })
        insights.append({
            'type': 'statistic',
            'title': f'Minimum {col}',
            'description': f'The minimum value of {col} is {min_val:.2f}',
            'details': {'metric': f'Minimum {col}', 'value': f'{min_val:.2f}'},
            'severity': 'info',
            'confidence': 100
        })
        insights.append({
            'type': 'statistic',
            'title': f'Median {col}',
            'description': f'The median value of {col} is {median_val:.2f}',
            'details': {'metric': f'Median {col}', 'value': f'{median_val:.2f}'},
            'severity': 'info',
            'confidence': 95
        })
    
    for col in categorical_cols:
        vals = df[col].dropna().astype(str)
        if len(vals) == 0:
            continue
        
        freq = vals.value_counts()
        top = freq.head(5)
        unique_count = vals.nunique()
        
        insights.append({
            'type': 'distribution',
            'title': f'{col} Distribution',
            'description': f'Top categories in {col}: {", ".join([f"{k} ({v})" for k, v in top.items()])}',
            'details': {'metric': 'Unique Values', 'value': str(unique_count)},
            'severity': 'info',
            'confidence': 90
        })
        if len(top) > 0:
            insights.append({
                'type': 'distribution',
                'title': f'Top Value in {col}',
                'description': f'The most frequent value is "{top.index[0]}" appearing {top.iloc[0]} times',
                'details': {'metric': 'Top Value', 'value': f'{top.index[0]} ({top.iloc[0]})'},
                'severity': 'info',
                'confidence': 95
            })
    
    missing_info = {}
    total_missing = 0
    for col in df.columns:
        miss = df[col].isna().sum()
        if miss > 0:
            missing_info[col] = miss
            total_missing += miss
    
    if missing_info:
        worst_col = max(missing_info.items(), key=lambda x: x[1])
        pct = (worst_col[1] / total_rows * 100) if total_rows > 0 else 0
        insights.append({
            'type': 'quality',
            'title': 'Missing Value Distribution',
            'description': f'{len(missing_info)} columns have missing values. "{worst_col[0]}" has the most ({worst_col[1]} / {pct:.2f}%)',
            'details': {'metric': 'Total Missing', 'value': str(total_missing)},
            'severity': 'warning',
            'confidence': 100
        })
    
    duplicate_rows = total_rows - df.drop_duplicates().shape[0]
    if duplicate_rows > 0:
        dup_pct = (duplicate_rows / total_rows * 100) if total_rows > 0 else 0
        insights.append({
            'type': 'quality',
            'title': 'Duplicate Rows',
            'description': f'{duplicate_rows} duplicate rows found ({dup_pct:.2f}% of total)',
            'details': {'metric': 'Duplicate Rows', 'value': str(duplicate_rows)},
            'severity': 'warning',
            'confidence': 100
        })
    
    unique_counts = {}
    for col in df.columns:
        unique_counts[col] = df[col].nunique()
    
    avg_unique = np.mean(list(unique_counts.values())) if unique_counts else 0
    insights.append({
        'type': 'summary',
        'title': 'Unique Value Count',
        'description': f'Average unique values per column: {avg_unique:.0f}',
        'details': {'metric': 'Avg Unique/Column', 'value': f'{avg_unique:.0f}'},
        'severity': 'info',
        'confidence': 90
    })
    
    insights.append({
        'type': 'preview',
        'title': 'Sample Records',
        'description': f'First {min(10, total_rows)} records of the dataset',
        'details': {'metric': 'Sample Records', 'value': f'{min(10, total_rows)} rows'},
        'severity': 'info',
        'confidence': 100
    })
    
    if len(datetime_cols) > 0 and len(numeric_cols) > 0:
        insights.append({
            'type': 'trend',
            'title': 'Potential Time Series',
            'description': f'Dataset contains time-series data ({datetime_cols[0]}) with numeric metrics ({numeric_cols[0]})',
            'details': {'metric': 'Time Columns', 'value': ', '.join(datetime_cols)},
            'severity': 'info',
            'confidence': 85
        })
    
    if len(numeric_cols) >= 2:
        numeric_df = df[numeric_cols].apply(pd.to_numeric, errors='coerce')
        corr_matrix = numeric_df.corr()
        
        pairs = []
        for i in range(len(numeric_cols)):
            for j in range(i + 1, min(len(numeric_cols), i + 3)):
                val = corr_matrix.iloc[i, j]
                if not pd.isna(val):
                    pairs.append({
                        'col1': numeric_cols[i],
                        'col2': numeric_cols[j],
                        'corr': val
                    })
        
        for p in pairs[:3]:
            strength = 'strong' if abs(p['corr']) > 0.7 else 'moderate' if abs(p['corr']) > 0.4 else 'weak'
            direction = 'positive' if p['corr'] >= 0 else 'negative'
            insights.append({
                'type': 'correlation',
                'title': f'Correlation: {p["col1"]} & {p["col2"]}',
                'description': f'{strength} {direction} correlation ({p["corr"]:.4f}) between {p["col1"]} and {p["col2"]}',
                'details': {'metric': 'Pearson Correlation', 'value': f'{p["corr"]:.4f}'},
                'severity': 'info',
                'confidence': 85
            })
    
    return insights