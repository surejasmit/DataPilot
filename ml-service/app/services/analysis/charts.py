import pandas as pd
import numpy as np
from typing import Dict, Any, List


def recommend_charts(df: pd.DataFrame, column_types: Dict[str, str], column_stats: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    recommendations = []
    
    numeric_cols = [col for col, dtype in column_types.items() if dtype == 'number']
    categorical_cols = [col for col, dtype in column_types.items() if dtype == 'string']
    datetime_cols = [col for col, dtype in column_types.items() if dtype == 'date']
    boolean_cols = [col for col, dtype in column_types.items() if dtype == 'boolean']
    
    if len(numeric_cols) >= 1:
        for col in numeric_cols[:3]:
            recommendations.append({
                'type': 'histogram',
                'title': f'Distribution of {col}',
                'columns': [col],
                'reason': 'Show distribution of numeric values'
            })
        
        if len(numeric_cols) >= 2:
            recommendations.append({
                'type': 'boxplot',
                'title': 'Box Plot of Numeric Variables',
                'columns': numeric_cols[:5],
                'reason': 'Show quartiles and outliers'
            })
    
    if len(numeric_cols) >= 2:
        for i in range(min(3, len(numeric_cols))):
            for j in range(i + 1, min(3, len(numeric_cols))):
                recommendations.append({
                    'type': 'scatter',
                    'title': f'{numeric_cols[i]} vs {numeric_cols[j]}',
                    'columns': [numeric_cols[i], numeric_cols[j]],
                    'reason': 'Show relationship between two numeric variables'
                })
        
        corr_cols = numeric_cols[:min(8, len(numeric_cols))]
        recommendations.append({
            'type': 'heatmap',
            'title': 'Correlation Heatmap',
            'columns': corr_cols,
            'reason': 'Show correlations between numeric variables'
        })
    
    if len(categorical_cols) >= 1 and len(numeric_cols) >= 1:
        for cat_col in categorical_cols[:3]:
            if df[cat_col].nunique() <= 20:
                for num_col in numeric_cols[:2]:
                    recommendations.append({
                        'type': 'bar',
                        'title': f'{num_col} by {cat_col}',
                        'columns': [cat_col, num_col],
                        'reason': 'Compare numeric values across categories'
                    })
    
    if len(categorical_cols) >= 1:
        for col in categorical_cols[:3]:
            unique_count = df[col].nunique()
            if unique_count <= 15:
                recommendations.append({
                    'type': 'pie',
                    'title': f'Distribution of {col}',
                    'columns': [col],
                    'reason': 'Show proportion of categories'
                })
            else:
                recommendations.append({
                    'type': 'bar',
                    'title': f'Top Categories in {col}',
                    'columns': [col],
                    'reason': 'Show frequency of top categories'
                })
    
    if len(datetime_cols) >= 1 and len(numeric_cols) >= 1:
        for dt_col in datetime_cols[:2]:
            for num_col in numeric_cols[:2]:
                recommendations.append({
                    'type': 'line',
                    'title': f'{num_col} over {dt_col}',
                    'columns': [dt_col, num_col],
                    'reason': 'Show trend over time'
                })
    
    if len(numeric_cols) >= 3:
        for col in numeric_cols[:3]:
            recommendations.append({
                'type': 'violin',
                'title': f'Violin Plot of {col}',
                'columns': [col],
                'reason': 'Show distribution shape and density'
            })
    
    if len(categorical_cols) >= 2 and len(numeric_cols) >= 1:
        cat1, cat2 = categorical_cols[:2]
        num = numeric_cols[0]
        if df[cat1].nunique() <= 10 and df[cat2].nunique() <= 10:
            recommendations.append({
                'type': 'grouped_bar',
                'title': f'{num} by {cat1} and {cat2}',
                'columns': [cat1, cat2, num],
                'reason': 'Compare numeric values across two categorical dimensions'
            })
    
    return recommendations


def get_chart_data(df: pd.DataFrame, chart_type: str, columns: List[str], column_types: Dict[str, str]) -> Dict[str, Any]:
    if chart_type == 'histogram':
        col = columns[0]
        vals = pd.to_numeric(df[col], errors='coerce').dropna()
        hist, bins = np.histogram(vals, bins=20)
        return {
            'type': 'histogram',
            'data': {'bins': bins.tolist(), 'counts': hist.tolist()},
            'x_label': col,
            'y_label': 'Frequency'
        }
    
    elif chart_type == 'boxplot':
        data = {}
        for col in columns:
            vals = pd.to_numeric(df[col], errors='coerce').dropna()
            if len(vals) > 0:
                data[col] = {
                    'min': float(vals.min()),
                    'q1': float(vals.quantile(0.25)),
                    'median': float(vals.median()),
                    'q3': float(vals.quantile(0.75)),
                    'max': float(vals.max()),
                    'outliers': vals[(vals < vals.quantile(0.25) - 1.5 * (vals.quantile(0.75) - vals.quantile(0.25))) | 
                                     (vals > vals.quantile(0.75) + 1.5 * (vals.quantile(0.75) - vals.quantile(0.25)))].tolist()
                }
        return {'type': 'boxplot', 'data': data}
    
    elif chart_type == 'scatter':
        x_col, y_col = columns[0], columns[1]
        x_vals = pd.to_numeric(df[x_col], errors='coerce')
        y_vals = pd.to_numeric(df[y_col], errors='coerce')
        valid = (~x_vals.isna()) & (~y_vals.isna())
        return {
            'type': 'scatter',
            'data': {'x': x_vals[valid].tolist(), 'y': y_vals[valid].tolist()},
            'x_label': x_col,
            'y_label': y_col
        }
    
    elif chart_type == 'heatmap':
        numeric_df = df[columns].apply(pd.to_numeric, errors='coerce')
        corr = numeric_df.corr()
        return {
            'type': 'heatmap',
            'data': {'matrix': corr.values.tolist(), 'labels': corr.columns.tolist()}
        }
    
    elif chart_type == 'bar':
        if len(columns) == 2:
            cat_col, num_col = columns
            grouped = df.groupby(cat_col)[num_col].mean().sort_values(ascending=False).head(20)
            return {
                'type': 'bar',
                'data': {'categories': grouped.index.tolist(), 'values': grouped.values.tolist()},
                'x_label': cat_col,
                'y_label': num_col
            }
        else:
            col = columns[0]
            counts = df[col].value_counts().head(20)
            return {
                'type': 'bar',
                'data': {'categories': counts.index.tolist(), 'values': counts.values.tolist()},
                'x_label': col,
                'y_label': 'Count'
            }
    
    elif chart_type == 'pie':
        col = columns[0]
        counts = df[col].value_counts().head(10)
        return {
            'type': 'pie',
            'data': {'labels': counts.index.tolist(), 'values': counts.values.tolist()},
            'title': f'Distribution of {col}'
        }
    
    elif chart_type == 'line':
        x_col, y_col = columns[0], columns[1]
        df_sorted = df.sort_values(x_col)
        x_vals = df_sorted[x_col].tolist()
        y_vals = pd.to_numeric(df_sorted[y_col], errors='coerce').tolist()
        return {
            'type': 'line',
            'data': {'x': x_vals, 'y': y_vals},
            'x_label': x_col,
            'y_label': y_col
        }
    
    elif chart_type == 'violin':
        col = columns[0]
        vals = pd.to_numeric(df[col], errors='coerce').dropna()
        return {
            'type': 'violin',
            'data': {'values': vals.tolist()},
            'label': col
        }
    
    return {'type': chart_type, 'data': {}, 'error': 'Chart data generation not implemented'}