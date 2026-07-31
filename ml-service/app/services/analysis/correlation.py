import pandas as pd
import numpy as np
from scipy import stats
from typing import Dict, Any, List


def compute_pearson_correlation(df: pd.DataFrame, numeric_columns: List[str]) -> List[Dict[str, Any]]:
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
                    'direction': direction,
                    'method': 'pearson'
                })
    
    return sorted(correlations, key=lambda x: abs(x['correlation']), reverse=True)


def compute_spearman_correlation(df: pd.DataFrame, numeric_columns: List[str]) -> List[Dict[str, Any]]:
    if len(numeric_columns) < 2:
        return []
    
    numeric_df = df[numeric_columns].apply(pd.to_numeric, errors='coerce')
    corr_matrix = numeric_df.corr(method='spearman')
    
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
                    'direction': direction,
                    'method': 'spearman'
                })
    
    return sorted(correlations, key=lambda x: abs(x['correlation']), reverse=True)


def compute_correlation_pvalues(df: pd.DataFrame, numeric_columns: List[str]) -> List[Dict[str, Any]]:
    if len(numeric_columns) < 2:
        return []
    
    numeric_df = df[numeric_columns].apply(pd.to_numeric, errors='coerce').dropna()
    if len(numeric_df) < 3:
        return []
    
    results = []
    cols = numeric_df.columns.tolist()
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            col1_vals = numeric_df[cols[i]].dropna()
            col2_vals = numeric_df[cols[j]].dropna()
            
            min_len = min(len(col1_vals), len(col2_vals))
            if min_len < 3:
                continue
            
            col1 = col1_vals.iloc[:min_len]
            col2 = col2_vals.iloc[:min_len]
            
            try:
                corr, p_value = stats.pearsonr(col1, col2)
                if not np.isnan(corr):
                    significance = 'significant' if p_value < 0.05 else 'not_significant'
                    results.append({
                        'column1': cols[i],
                        'column2': cols[j],
                        'correlation': round(float(corr), 4),
                        'p_value': round(float(p_value), 6),
                        'significance': significance
                    })
            except Exception:
                pass
    
    return sorted(results, key=lambda x: abs(x['correlation']), reverse=True)


def detect_multicollinearity(df: pd.DataFrame, numeric_columns: List[str], threshold: float = 0.8) -> List[Dict[str, Any]]:
    correlations = compute_pearson_correlation(df, numeric_columns)
    
    multicollinear = []
    for corr in correlations:
        if abs(corr['correlation']) >= threshold:
            multicollinear.append({
                'column1': corr['column1'],
                'column2': corr['column2'],
                'correlation': corr['correlation'],
                'warning': f"High correlation ({corr['correlation']:.4f}) between {corr['column1']} and {corr['column2']} may indicate multicollinearity"
            })
    
    return multicollinear


def compute_correlation_matrix(df: pd.DataFrame, numeric_columns: List[str]) -> Dict[str, Any]:
    numeric_df = df[numeric_columns].apply(pd.to_numeric, errors='coerce')
    corr_matrix = numeric_df.corr(method='pearson')
    
    return {
        'columns': numeric_columns,
        'matrix': corr_matrix.round(4).to_dict(),
        'method': 'pearson'
    }