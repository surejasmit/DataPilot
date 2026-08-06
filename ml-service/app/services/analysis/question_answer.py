import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.services.analysis.dataset_reader import read_dataset, infer_data_type, get_preview_rows
from app.services.analysis.business_validation import detect_business_domain


def answer_dataset_question(file_path: str, file_name: str, question: str) -> Dict[str, Any]:
    df = read_dataset(file_path, file_name)
    column_types = {col: infer_data_type(df[col]) for col in df.columns}
    return answer_question(df, column_types, question)


def _fmt(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return 'N/A'
    if abs(v) >= 1000000:
        return '${:,.2f}M'.format(v / 1000000) if v >= 0 else '-${:,.2f}M'.format(abs(v) / 1000000)
    if abs(v) >= 1000:
        return '${:,.2f}'.format(v) if v >= 0 else '-${:,.2f}'.format(abs(v))
    return '{:,.2f}'.format(v)


def _find_col(df, hints):
    for col in df.columns:
        cl = str(col).lower()
        if any(h in cl for h in hints):
            return col
    return None


def answer_question(df, column_types, question):
    question_lower = question.lower()
    total_rows = len(df)

    validation = detect_business_domain(df)
    is_business = validation.get('is_business', False)
    domain = validation.get('domain', 'unknown')

    try:
        from app.ml.registry import registry
        cmd_model = registry.get_model("command_understander")
    except Exception:
        cmd_model = None

    if cmd_model is not None:
        try:
            pred = cmd_model.predict(question, df.columns.tolist())
            confidence = pred.get("confidence", 0.0)
            intent = pred.get("intent")
            params = pred.get("params", {})

            if confidence >= 0.45:
                # Handle COUNT
                if intent == 'COUNT':
                    return {
                        'answer': f"The dataset has {total_rows:,} rows.",
                        'confidence': int(confidence * 100),
                        'details': {'metric': 'Total Rows', 'value': total_rows},
                        'sources': ['dataset']
                    }
                # Handle DESCRIBE
                elif intent == 'DESCRIBE':
                    return {
                        'answer': f"The dataset contains {total_rows:,} rows and {len(df.columns)} columns: {', '.join(df.columns.tolist())}.",
                        'confidence': int(confidence * 100),
                        'details': {'metric': 'Dataset Summary', 'columns': df.columns.tolist()},
                        'sources': ['dataset']
                    }
                # Handle REMOVE_COLUMNS
                elif intent == 'REMOVE_COLUMNS':
                    cols = params.get('columns', [])
                    return {
                        'answer': f"Identified REMOVE_COLUMNS request. Target columns to remove: {', '.join(cols)}.",
                        'confidence': int(confidence * 100),
                        'details': {'intent': 'REMOVE_COLUMNS', 'columns': cols},
                        'sources': ['command_model']
                    }
                # Handle FILTER
                elif intent == 'FILTER':
                    col = params.get('column')
                    val = params.get('value')
                    op = params.get('operator_symbol', '==')
                    return {
                        'answer': f"Identified FILTER request. Filter where column '{col}' {op} '{val}'.",
                        'confidence': int(confidence * 100),
                        'details': {'intent': 'FILTER', 'column': col, 'value': val, 'operator': params.get('operator')},
                        'sources': ['command_model']
                    }
                # Handle SORT
                elif intent == 'SORT':
                    col = params.get('column')
                    asc = params.get('ascending', True)
                    direction = 'ascending' if asc else 'descending'
                    return {
                        'answer': f"Identified SORT request. Sort by column '{col}' in {direction} order.",
                        'confidence': int(confidence * 100),
                        'details': {'intent': 'SORT', 'column': col, 'ascending': asc},
                        'sources': ['command_model']
                    }
                # Handle GROUP_BY
                elif intent == 'GROUP_BY':
                    col = params.get('column')
                    return {
                        'answer': f"Identified GROUP_BY request. Group dataset by column '{col}'.",
                        'confidence': int(confidence * 100),
                        'details': {'intent': 'GROUP_BY', 'column': col},
                        'sources': ['command_model']
                    }
                # Handle RENAME_COLUMN
                elif intent == 'RENAME_COLUMN':
                    col = params.get('column')
                    new_name = params.get('new_column_name')
                    return {
                        'answer': f"Identified RENAME_COLUMN request. Rename '{col}' to '{new_name}'.",
                        'confidence': int(confidence * 100),
                        'details': {'intent': 'RENAME_COLUMN', 'column': col, 'new_column_name': new_name},
                        'sources': ['command_model']
                    }
                # Handle AGGREGATE
                elif intent == 'AGGREGATE':
                    col = params.get('column')
                    agg_type = params.get('type', 'mean')
                    if col in df.columns:
                        vals = pd.to_numeric(df[col], errors='coerce').dropna()
                        if len(vals) > 0:
                            if agg_type == 'mean':
                                return {
                                    'answer': f"The average of {col} is {_fmt(vals.mean())}.",
                                    'confidence': int(confidence * 100),
                                    'details': {'metric': f"Average {col}", 'value': vals.mean()},
                                    'sources': ['dataset']
                                }
                            elif agg_type == 'sum':
                                return {
                                    'answer': f"The sum of {col} is {_fmt(vals.sum())}.",
                                    'confidence': int(confidence * 100),
                                    'details': {'metric': f"Total {col}", 'value': vals.sum()},
                                    'sources': ['dataset']
                                }
                            elif agg_type == 'max':
                                return {
                                    'answer': f"The maximum value of {col} is {_fmt(vals.max())}.",
                                    'confidence': int(confidence * 100),
                                    'details': {'metric': f"Max {col}", 'value': vals.max()},
                                    'sources': ['dataset']
                                }
                            elif agg_type == 'min':
                                return {
                                    'answer': f"The minimum value of {col} is {_fmt(vals.min())}.",
                                    'confidence': int(confidence * 100),
                                    'details': {'metric': f"Min {col}", 'value': vals.min()},
                                    'sources': ['dataset']
                                }
                            elif agg_type == 'median':
                                return {
                                    'answer': f"The median of {col} is {_fmt(vals.median())}.",
                                    'confidence': int(confidence * 100),
                                    'details': {'metric': f"Median {col}", 'value': vals.median()},
                                    'sources': ['dataset']
                                }
                            elif agg_type == 'std':
                                return {
                                    'answer': f"The standard deviation of {col} is {_fmt(vals.std())}.",
                                    'confidence': int(confidence * 100),
                                    'details': {'metric': f"Std Dev {col}", 'value': vals.std()},
                                    'sources': ['dataset']
                                }
                # Handle FILL_MISSING
                elif intent == 'FILL_MISSING':
                    col = params.get('column')
                    method = params.get('method', 'mode')
                    return {
                        'answer': f"Identified FILL_MISSING request. Impute missing values in '{col}' using '{method}'.",
                        'confidence': int(confidence * 100),
                        'details': {'intent': 'FILL_MISSING', 'column': col, 'method': method},
                        'sources': ['command_model']
                    }
                # Handle REMOVE_MISSING
                elif intent == 'REMOVE_MISSING':
                    col = params.get('column')
                    return {
                        'answer': f"Identified REMOVE_MISSING request. Drop rows where column '{col}' has null values.",
                        'confidence': int(confidence * 100),
                        'details': {'intent': 'REMOVE_MISSING', 'column': col},
                        'sources': ['command_model']
                    }
                # Handle CONVERT_TYPE
                elif intent == 'CONVERT_TYPE':
                    col = params.get('column')
                    t_type = params.get('target_type')
                    return {
                        'answer': f"Identified CONVERT_TYPE request. Cast column '{col}' to '{t_type}'.",
                        'confidence': int(confidence * 100),
                        'details': {'intent': 'CONVERT_TYPE', 'column': col, 'target_type': t_type},
                        'sources': ['command_model']
                    }
        except Exception as e:
            print(f"[ML Q&A] Error running ML command parser: {e}. Falling back to rule-based.")

    if any(kw in question_lower for kw in ['which department has the highest attrition', 'department with highest attrition', 'highest attrition department']):
        dept_col = _find_col(df, ['department', 'dept'])
        attr_col = _find_col(df, ['attrition', 'left', 'terminated', 'resigned'])
        if dept_col and attr_col:
            try:
                if df[attr_col].dtype == 'object':
                    rates = df.groupby(dept_col)[attr_col].apply(
                        lambda x: (x.str.lower().isin(['yes', 'true', '1', 'y'])).sum() / max(len(x), 1) * 100
                    ).sort_values(ascending=False)
                else:
                    rates = df.groupby(dept_col)[attr_col].mean().sort_values(ascending=False) * 100
                top_dept = rates.index[0]
                top_rate = rates.iloc[0]
                return {
                    'answer': "Department '{}' has the highest attrition rate at {:.1f}%.".format(top_dept, top_rate),
                    'confidence': 90,
                    'details': {'metric': 'Highest Attrition Department', 'value': '{} ({:.1f}%)'.format(top_dept, top_rate)},
                    'sources': ['dataset']
                }
            except Exception:
                pass

    if any(kw in question_lower for kw in ['show sales trend by month', 'sales trend by month', 'monthly sales trend']):
        sales_col = _find_col(df, ['sales', 'revenue', 'amount'])
        date_col = _find_col(df, ['date', 'order_date', 'sale_date'])
        if sales_col and date_col:
            try:
                temp_df = pd.DataFrame({
                    sales_col: pd.to_numeric(df[sales_col], errors='coerce'),
                    date_col: pd.to_datetime(df[date_col], errors='coerce')
                }).dropna()
                temp_df['month'] = temp_df[date_col].dt.to_period('M')
                monthly = temp_df.groupby('month')[sales_col].sum().sort_index()
                trend = 'increasing' if len(monthly) > 1 and monthly.iloc[-1] > monthly.iloc[0] else 'decreasing'
                return {
                    'answer': "Monthly sales trend is {} over {} months. Total: {}. Peak month: {} ({}).".format(
                        trend, len(monthly), _fmt(monthly.sum()), str(monthly.idxmax()), _fmt(monthly.max())),
                    'confidence': 85,
                    'details': {'metric': 'Monthly Sales', 'value': _fmt(monthly.sum())},
                    'sources': ['dataset']
                }
            except Exception:
                pass

    if any(kw in question_lower for kw in ['which products generate the most profit', 'top products by profit', 'most profitable products']):
        prod_col = _find_col(df, ['product', 'item', 'sku'])
        profit_col = _find_col(df, ['profit', 'net', 'margin'])
        if prod_col and profit_col:
            try:
                temp_df = pd.DataFrame({
                    prod_col: df[prod_col],
                    profit_col: pd.to_numeric(df[profit_col], errors='coerce')
                }).dropna()
                grouped = temp_df.groupby(prod_col)[profit_col].sum().sort_values(ascending=False).head(10)
                top = grouped.index[0]
                top_val = grouped.iloc[0]
                return {
                    'answer': "Top product '{}' generates {} in profit. Top 5 products: {}".format(
                        top, _fmt(top_val), ', '.join(["'{}' ({})".format(k, _fmt(v)) for k, v in grouped.head(5).items()])),
                    'confidence': 85,
                    'details': {'metric': 'Top Product Profit', 'value': _fmt(top_val)},
                    'sources': ['dataset']
                }
            except Exception:
                pass

    if any(kw in question_lower for kw in ['find duplicate customers', 'duplicate customer', 'customer duplicates']):
        cust_col = _find_col(df, ['customer_id', 'customer', 'client', 'account_id'])
        if cust_col:
            try:
                dup_mask = df[cust_col].duplicated(keep=False)
                dup_count = df[dup_mask][cust_col].nunique()
                dup_rows = int(dup_mask.sum())
                return {
                    'answer': "Found {} duplicate customer records across {} unique customers ({} rows).".format(
                        dup_count, dup_count, dup_rows),
                    'confidence': 90,
                    'details': {'metric': 'Duplicate Customers', 'value': str(dup_count)},
                    'sources': ['dataset']
                }
            except Exception:
                pass

    if any(kw in question_lower for kw in ['average salary by department', 'salary by department', 'mean salary by department']):
        dept_col = _find_col(df, ['department', 'dept'])
        sal_col = _find_col(df, ['salary', 'pay', 'compensation', 'wage'])
        if dept_col and sal_col:
            try:
                temp_df = pd.DataFrame({
                    dept_col: df[dept_col],
                    sal_col: pd.to_numeric(df[sal_col], errors='coerce')
                }).dropna()
                grouped = temp_df.groupby(dept_col)[sal_col].mean().sort_values(ascending=False)
                result_parts = ["'{}': {}".format(k, _fmt(v)) for k, v in grouped.items()]
                return {
                    'answer': "Average salary by department: {}.".format(', '.join(result_parts)),
                    'confidence': 90,
                    'details': {'metric': 'Avg Salary by Dept', 'value': {str(k): _fmt(v) for k, v in grouped.items()}},
                    'sources': ['dataset']
                }
            except Exception:
                pass

    if any(kw in question_lower for kw in ['top five products by revenue', 'top 5 products by revenue', 'highest revenue products']):
        prod_col = _find_col(df, ['product', 'item', 'sku'])
        rev_col = _find_col(df, ['revenue', 'sales', 'amount'])
        if prod_col and rev_col:
            try:
                temp_df = pd.DataFrame({
                    prod_col: df[prod_col],
                    rev_col: pd.to_numeric(df[rev_col], errors='coerce')
                }).dropna()
                grouped = temp_df.groupby(prod_col)[rev_col].sum().sort_values(ascending=False).head(5)
                result_parts = ["'{}': {}".format(k, _fmt(v)) for k, v in grouped.items()]
                return {
                    'answer': "Top 5 products by revenue: {}.".format(', '.join(result_parts)),
                    'confidence': 90,
                    'details': {'metric': 'Top 5 Products by Revenue', 'value': {str(k): _fmt(v) for k, v in grouped.items()}},
                    'sources': ['dataset']
                }
            except Exception:
                pass

    if any(kw in question_lower for kw in ['what is the total revenue', 'total revenue', 'sum of revenue']):
        rev_col = _find_col(df, ['revenue', 'sales', 'amount'])
        if rev_col:
            try:
                total = pd.to_numeric(df[rev_col], errors='coerce').dropna().sum()
                return {
                    'answer': "Total revenue is {}.".format(_fmt(total)),
                    'confidence': 95,
                    'details': {'metric': 'Total Revenue', 'value': _fmt(total)},
                    'sources': ['dataset']
                }
            except Exception:
                pass

    if any(kw in question_lower for kw in ['which region has the highest sales', 'region with highest sales', 'highest sales region']):
        region_col = _find_col(df, ['region', 'territory', 'area', 'zone'])
        sales_col = _find_col(df, ['sales', 'revenue', 'amount'])
        if region_col and sales_col:
            try:
                temp_df = pd.DataFrame({
                    region_col: df[region_col],
                    sales_col: pd.to_numeric(df[sales_col], errors='coerce')
                }).dropna()
                grouped = temp_df.groupby(region_col)[sales_col].sum().sort_values(ascending=False)
                top = grouped.index[0]
                top_val = grouped.iloc[0]
                return {
                    'answer': "Region '{}' has the highest sales with {}.".format(top, _fmt(top_val)),
                    'confidence': 90,
                    'details': {'metric': 'Highest Sales Region', 'value': '{} ({})'.format(top, _fmt(top_val))},
                    'sources': ['dataset']
                }
            except Exception:
                pass

    if any(kw in question_lower for kw in ['how many rows', 'number of rows', 'row count', 'total rows']):
        return {
            'answer': 'The dataset has {:,} rows.'.format(total_rows),
            'confidence': 100,
            'details': {'metric': 'Total Rows', 'value': total_rows},
            'sources': ['dataset_profile']
        }

    if any(kw in question_lower for kw in ['how many columns', 'number of columns', 'column count', 'total columns']):
        return {
            'answer': 'The dataset has {} columns: {}.'.format(len(df.columns), ', '.join(df.columns.tolist())),
            'confidence': 100,
            'details': {'metric': 'Total Columns', 'value': len(df.columns)},
            'sources': ['dataset_profile']
        }

    if 'missing' in question_lower or 'null' in question_lower:
        total_missing = df.isna().sum().sum()
        cols_with_missing = df.columns[df.isna().any()].tolist()
        return {
            'answer': 'There are {} missing values across {} columns: {}.'.format(
                int(total_missing), len(cols_with_missing), ', '.join(cols_with_missing)),
            'confidence': 100,
            'details': {'total_missing': int(total_missing), 'columns_with_missing': cols_with_missing},
            'sources': ['quality_report']
        }

    if 'duplicate' in question_lower:
        dup_count = total_rows - df.drop_duplicates().shape[0]
        return {
            'answer': 'There are {} duplicate rows in the dataset.'.format(dup_count),
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
                    return {'answer': 'Column "{}" has no valid numeric values.'.format(col), 'confidence': 50, 'details': {}, 'sources': []}

                if 'average' in question_lower or 'mean' in question_lower:
                    return {'answer': 'The average of {} is {:,.2f}.'.format(col, numeric_vals.mean()), 'confidence': 95,
                           'details': {'metric': 'Mean {}'.format(col), 'value': '{:,.2f}'.format(numeric_vals.mean())}, 'sources': ['statistics']}
                if 'median' in question_lower:
                    return {'answer': 'The median of {} is {:,.2f}.'.format(col, numeric_vals.median()), 'confidence': 95,
                           'details': {'metric': 'Median {}'.format(col), 'value': '{:,.2f}'.format(numeric_vals.median())}, 'sources': ['statistics']}
                if 'max' in question_lower or 'maximum' in question_lower:
                    return {'answer': 'The maximum value of {} is {:,.2f}.'.format(col, numeric_vals.max()), 'confidence': 100,
                           'details': {'metric': 'Max {}'.format(col), 'value': '{:,.2f}'.format(numeric_vals.max())}, 'sources': ['statistics']}
                if 'min' in question_lower or 'minimum' in question_lower:
                    return {'answer': 'The minimum value of {} is {:,.2f}.'.format(col, numeric_vals.min()), 'confidence': 100,
                           'details': {'metric': 'Min {}'.format(col), 'value': '{:,.2f}'.format(numeric_vals.min())}, 'sources': ['statistics']}
                if 'std' in question_lower or 'standard deviation' in question_lower:
                    return {'answer': 'The standard deviation of {} is {:,.2f}.'.format(col, numeric_vals.std()), 'confidence': 95,
                           'details': {'metric': 'Std Dev {}'.format(col), 'value': '{:,.2f}'.format(numeric_vals.std())}, 'sources': ['statistics']}
                if 'unique' in question_lower:
                    return {'answer': 'Column {} has {} unique values.'.format(col, numeric_vals.nunique()), 'confidence': 100,
                           'details': {'metric': 'Unique {}'.format(col), 'value': str(numeric_vals.nunique())}, 'sources': ['statistics']}

            elif dtype == 'string':
                if 'unique' in question_lower:
                    return {'answer': 'Column {} has {} unique values.'.format(col, non_null.nunique()), 'confidence': 100,
                           'details': {'metric': 'Unique {}'.format(col), 'value': str(non_null.nunique())}, 'sources': ['statistics']}
                if 'most common' in question_lower or 'top' in question_lower or 'frequent' in question_lower:
                    freq = non_null.astype(str).value_counts()
                    if len(freq) > 0:
                        return {'answer': 'The most common value in {} is "{}" appearing {} times.'.format(col, freq.index[0], freq.iloc[0]), 'confidence': 95,
                               'details': {'metric': 'Top {}'.format(col), 'value': '{} ({})'.format(freq.index[0], freq.iloc[0])}, 'sources': ['insights']}
                if 'categories' in question_lower or 'values' in question_lower:
                    freq = non_null.astype(str).value_counts().head(10)
                    return {'answer': 'Top categories in {}: {}.'.format(col, ', '.join(['{} ({})'.format(k, v) for k, v in freq.items()])), 'confidence': 90,
                           'details': {'metric': 'Top Categories {}'.format(col), 'value': ', '.join(['{} ({})'.format(k, v) for k, v in freq.items()])}, 'sources': ['insights']}

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
            desc = '; '.join(['{} & {}: {:.4f}'.format(c1, c2, v) for c1, c2, v in top_pairs])
            return {'answer': 'Top correlations: {}'.format(desc), 'confidence': 85,
                   'details': {'correlations': [{'col1': c1, 'col2': c2, 'value': v} for c1, c2, v in top_pairs]}, 'sources': ['correlations']}

    if 'summary' in question_lower or 'overview' in question_lower:
        numeric_cols = [c for c, t in column_types.items() if t == 'number']
        cat_cols = [c for c, t in column_types.items() if t == 'string']
        return {'answer': 'Dataset has {:,} rows, {} columns. Numeric: {}, Categorical: {}. Missing: {}.'.format(
            total_rows, len(df.columns), len(numeric_cols), len(cat_cols), int(df.isna().sum().sum())), 'confidence': 95,
               'details': {'rows': total_rows, 'columns': len(df.columns), 'numeric': len(numeric_cols), 'categorical': len(cat_cols)}, 'sources': ['profile']}

    if is_business:
        return {
            'answer': "I cannot answer that specific business question. Try asking about: attrition by department, sales trends, product performance, revenue totals, salary distributions, or regional performance.",
            'confidence': 30,
            'details': {},
            'sources': []
        }

    return {
        'answer': 'I cannot answer that question. Try asking about rows, columns, missing values, duplicates, specific column statistics, or correlations.',
        'confidence': 30,
        'details': {},
        'sources': []
    }


def generate_suggested_questions(df, column_types):
    questions = []

    validation = detect_business_domain(df)
    is_business = validation.get('is_business', False)
    domain = validation.get('domain', 'unknown')

    if is_business:
        if domain == 'hr':
            questions.extend([
                "Which department has the highest attrition?",
                "Average salary by department",
                "What is the overall attrition rate?",
                "Show hiring trends over time"
            ])
        elif domain == 'sales':
            questions.extend([
                "What is the total revenue?",
                "Which region has the highest sales?",
                "Show sales trend by month",
                "Top five products by revenue"
            ])
        elif domain == 'customer':
            questions.extend([
                "Find duplicate customers",
                "How many unique customers are there?",
                "What is the average customer lifetime value?",
                "Which segment has the most customers?"
            ])
        elif domain == 'finance':
            questions.extend([
                "What is the total revenue?",
                "Which products generate the most profit?",
                "What is the cost vs revenue comparison?",
                "Show profitability summary"
            ])
        elif domain == 'inventory':
            questions.extend([
                "How many items are below reorder point?",
                "Which supplier has the lowest stock?",
                "What is the average stock level?",
                "Show stock level distribution"
            ])
    else:
        questions.extend([
            "How many rows are in the dataset?",
            "How many columns are in the dataset?",
            "Are there any missing values?",
            "Are there any duplicate rows?",
            "What is the summary of the dataset?"
        ])

    numeric_cols = [c for c, t in column_types.items() if t == 'number']
    for col in numeric_cols[:3]:
        questions.extend([
            "What is the average of {}?".format(col),
            "What is the maximum value of {}?".format(col),
            "What is the minimum value of {}?".format(col),
            "How many unique values in {}?".format(col)
        ])

    cat_cols = [c for c, t in column_types.items() if t == 'string']
    for col in cat_cols[:3]:
        questions.extend([
            "What are the top categories in {}?".format(col),
            "How many unique values in {}?".format(col),
            "What is the most common value in {}?".format(col)
        ])

    if len(numeric_cols) >= 2:
        questions.append("What are the strongest correlations?")

    return questions[:15]


def clean_dataset(file_path, file_name, operation, params=None):
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
                else:
                    fill_val = non_null.mode().iloc[0] if len(non_null.mode()) > 0 else ''
            elif method == 'median':
                numeric = pd.to_numeric(non_null, errors='coerce').dropna()
                if len(numeric) > 0:
                    fill_val = numeric.median()
                else:
                    fill_val = non_null.mode().iloc[0] if len(non_null.mode()) > 0 else ''
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
        raise ValueError("Unknown cleaning operation: {}".format(operation))


def get_chart_data(file_path, file_name, chart_type, columns):
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
