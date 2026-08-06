import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.services.analysis.business_validation import detect_business_domain


def _get_domain_columns(df: pd.DataFrame) -> dict:
    domain_cols = {}
    for col in df.columns:
        col_lower = str(col).lower()
        domain_cols.setdefault('all', []).append(col)
        hr_hints = ['employee', 'salary', 'attrition', 'department', 'hire', 'job',
                     'role', 'manager', 'tenure', 'turnover', 'headcount']
        if any(h in col_lower for h in hr_hints):
            domain_cols.setdefault('hr', []).append(col)
        sales_hints = ['sales', 'revenue', 'order', 'product', 'quantity', 'price',
                        'discount', 'invoice', 'transaction', 'deal']
        if any(h in col_lower for h in sales_hints):
            domain_cols.setdefault('sales', []).append(col)
        customer_hints = ['customer', 'churn', 'lifetime', 'ltv', 'retention',
                           'segment', 'cohort', 'satisfaction', 'nps']
        if any(h in col_lower for h in customer_hints):
            domain_cols.setdefault('customer', []).append(col)
        finance_hints = ['revenue', 'profit', 'cost', 'expense', 'budget', 'income',
                          'payment', 'billing', 'account', 'cash', 'tax', 'margin']
        if any(h in col_lower for h in finance_hints):
            domain_cols.setdefault('finance', []).append(col)
        inventory_hints = ['inventory', 'stock', 'warehouse', 'supplier', 'sku',
                            'reorder', 'shipment', 'delivery', 'batch', 'lot']
        if any(h in col_lower for h in inventory_hints):
            domain_cols.setdefault('inventory', []).append(col)
    return domain_cols


def _business_label(col: str) -> str:
    col_lower = col.lower()
    label_map = {
        'revenue': 'Revenue', 'sales': 'Sales', 'profit': 'Profit',
        'salary': 'Salary', 'cost': 'Cost', 'price': 'Price',
        'expense': 'Expense', 'budget': 'Budget', 'income': 'Income',
        'discount': 'Discount', 'margin': 'Margin', 'amount': 'Amount',
        'total': 'Total', 'quantity': 'Quantity', 'units': 'Units',
        'count': 'Count', 'order': 'Orders', 'customer': 'Customers',
        'employee': 'Employees', 'department': 'Department',
        'region': 'Region', 'product': 'Product', 'category': 'Category',
        'stock': 'Stock', 'inventory': 'Inventory', 'payment': 'Payment',
        'invoice': 'Invoice', 'transaction': 'Transactions',
        'age': 'Age', 'tenure': 'Tenure', 'rate': 'Rate',
        'score': 'Score', 'rating': 'Rating', 'satisfaction': 'Satisfaction',
    }
    for key, label in label_map.items():
        if key in col_lower:
            return label
    return col.replace('_', ' ').title()
def recommend_charts(df: pd.DataFrame, column_types: Dict[str, str], column_stats: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    numeric_cols = [col for col, dtype in column_types.items() if dtype == 'number']
    categorical_cols = [col for col, dtype in column_types.items() if dtype == 'string']
    datetime_cols = [col for col, dtype in column_types.items() if dtype == 'date']

    validation = detect_business_domain(df)
    domain = validation.get('domain', 'generic')
    is_business = validation.get('is_business', False)
    domain_cols = _get_domain_columns(df)

    try:
        from app.ml.registry import registry
        chart_model = registry.get_model("chart_recommender")
    except Exception:
        chart_model = None

    if chart_model is not None:
        try:
            candidates = []
            
            # Single numeric columns
            for col in numeric_cols[:3]:
                candidates.append([col])
                
            # Single categorical columns
            for col in categorical_cols[:3]:
                candidates.append([col])
                
            # Pairs of numeric columns
            if len(numeric_cols) >= 2:
                for i in range(min(2, len(numeric_cols))):
                    for j in range(i+1, min(3, len(numeric_cols))):
                        candidates.append([numeric_cols[i], numeric_cols[j]])
                        
            # Pairs of categorical + numeric columns
            for cat in categorical_cols[:2]:
                for num in numeric_cols[:2]:
                    candidates.append([cat, num])
                    
            # Pairs of date + numeric columns
            for dt in datetime_cols[:2]:
                for num in numeric_cols[:2]:
                    candidates.append([dt, num])
                    
            ml_recs = []
            for cols in candidates:
                preds = chart_model.predict(cols, column_types, domain)
                if preds:
                    best_pred = preds[0]
                    if best_pred["confidence"] >= 0.35:
                        ml_recs.append({
                            'type': best_pred['type'],
                            'title': f"{best_pred['type'].title()} Chart of {' vs '.join(cols)}",
                            'columns': cols,
                            'reason': best_pred['reason']
                        })
            
            if ml_recs:
                seen = set()
                unique_recs = []
                for rec in ml_recs:
                    key = (rec['type'], tuple(rec['columns']))
                    if key not in seen:
                        seen.add(key)
                        unique_recs.append(rec)
                return unique_recs[:10]
        except Exception as e:
            print(f"[ML Charts] Error running ML chart recommender: {e}. Falling back to rule-based.")

    recommendations = []
    if is_business:
        recommendations.extend(_domain_chart_recs(df, domain, domain_cols, numeric_cols, categorical_cols, datetime_cols))

    recommendations.extend(_generic_chart_recs(df, numeric_cols, categorical_cols, datetime_cols))
    return recommendations


def _domain_chart_recs(df, domain, domain_cols, numeric_cols, categorical_cols, datetime_cols):
    recs = []

    if domain == 'hr':
        recs.extend(_hr_chart_recs(df, domain_cols, numeric_cols, categorical_cols))
    elif domain == 'sales':
        recs.extend(_sales_chart_recs(df, domain_cols, numeric_cols, categorical_cols, datetime_cols))
    elif domain == 'customer':
        recs.extend(_customer_chart_recs(df, domain_cols, numeric_cols, categorical_cols))
    elif domain == 'inventory':
        recs.extend(_inventory_chart_recs(df, domain_cols, numeric_cols, categorical_cols))

    return recs


def _hr_chart_recs(df, domain_cols, numeric_cols, categorical_cols):
    recs = []
    dept_col = salary_col = attrition_col = None

    for col in df.columns:
        cl = str(col).lower()
        if not dept_col and any(h in cl for h in ['department', 'dept']):
            dept_col = col
        if not salary_col and any(h in cl for h in ['salary', 'pay', 'compensation']):
            salary_col = col
        if not attrition_col and any(h in cl for h in ['attrition', 'left']):
            attrition_col = col

    if dept_col:
        recs.append({
            'type': 'bar',
            'title': 'Employee Distribution by Department',
            'columns': [dept_col],
            'reason': 'Show headcount distribution across departments'
        })
        if salary_col:
            recs.append({
                'type': 'bar',
                'title': 'Average Salary by Department',
                'columns': [dept_col, salary_col],
                'reason': 'Compare average salaries across departments'
            })

    if attrition_col and dept_col:
        recs.append({
            'type': 'bar',
            'title': 'Attrition Analysis by Department',
            'columns': [dept_col, attrition_col],
            'reason': 'Analyze attrition rates across departments'
        })

    if salary_col:
        recs.append({
            'type': 'histogram',
            'title': 'Salary Distribution',
            'columns': [salary_col],
            'reason': 'Show distribution of salary values across the workforce'
        })

    return recs


def _sales_chart_recs(df, domain_cols, numeric_cols, categorical_cols, datetime_cols):
    recs = []
    revenue_col = product_col = region_col = None

    for col in df.columns:
        cl = str(col).lower()
        if not revenue_col and any(h in cl for h in ['revenue', 'sales', 'amount']):
            revenue_col = col
        if not product_col and any(h in cl for h in ['product', 'item', 'sku']):
            product_col = col
        if not region_col and any(h in cl for h in ['region', 'territory', 'area']):
            region_col = col

    if revenue_col:
        recs.append({
            'type': 'histogram',
            'title': 'Revenue Distribution',
            'columns': [revenue_col],
            'reason': 'Show distribution of revenue values'
        })

    if revenue_col and product_col:
        recs.append({
            'type': 'bar',
            'title': 'Top Products by Revenue',
            'columns': [product_col, revenue_col],
            'reason': 'Identify highest-performing products by revenue'
        })

    if revenue_col and region_col:
        recs.append({
            'type': 'bar',
            'title': 'Sales by Region',
            'columns': [region_col, revenue_col],
            'reason': 'Compare revenue performance across regions'
        })

    if revenue_col and datetime_cols:
        dt_col = datetime_cols[0]
        recs.append({
            'type': 'line',
            'title': 'Monthly Revenue Trend',
            'columns': [dt_col, revenue_col],
            'reason': 'Track revenue trends over time'
        })

    return recs


def _customer_chart_recs(df, domain_cols, numeric_cols, categorical_cols):
    recs = []
    customer_col = revenue_col = segment_col = None

    for col in df.columns:
        cl = str(col).lower()
        if not customer_col and any(h in cl for h in ['customer', 'client', 'account_id']):
            customer_col = col
        if not revenue_col and any(h in cl for h in ['revenue', 'amount', 'total', 'value']):
            revenue_col = col
        if not segment_col and any(h in cl for h in ['segment', 'category', 'tier']):
            segment_col = col

    if segment_col:
        recs.append({
            'type': 'pie',
            'title': 'Customer Segmentation',
            'columns': [segment_col],
            'reason': 'Show proportion of customers across segments'
        })

    if customer_col and revenue_col:
        recs.append({
            'type': 'bar',
            'title': 'Revenue by Customer',
            'columns': [customer_col, revenue_col],
            'reason': 'Identify highest-value customers'
        })

    return recs


def _inventory_chart_recs(df, domain_cols, numeric_cols, categorical_cols):
    recs = []
    stock_col = supplier_col = product_col = None

    for col in df.columns:
        cl = str(col).lower()
        if not stock_col and any(h in cl for h in ['stock', 'quantity', 'inventory']):
            stock_col = col
        if not supplier_col and any(h in cl for h in ['supplier', 'vendor']):
            supplier_col = col
        if not product_col and any(h in cl for h in ['product', 'item', 'sku']):
            product_col = col

    if stock_col:
        recs.append({
            'type': 'histogram',
            'title': 'Stock Level Distribution',
            'columns': [stock_col],
            'reason': 'Show distribution of stock levels across items'
        })

    if supplier_col and stock_col:
        recs.append({
            'type': 'bar',
            'title': 'Supplier Performance by Stock Level',
            'columns': [supplier_col, stock_col],
            'reason': 'Compare average stock levels by supplier'
        })

    if product_col and stock_col:
        recs.append({
            'type': 'bar',
            'title': 'Inventory by Product',
            'columns': [product_col, stock_col],
            'reason': 'Show inventory levels per product'
        })

    return recs


def _generic_chart_recs(df, numeric_cols, categorical_cols, datetime_cols):
    recs = []

    if len(numeric_cols) >= 1:
        for col in numeric_cols[:3]:
            recs.append({
                'type': 'histogram',
                'title': 'Distribution of {}'.format(col),
                'columns': [col],
                'reason': 'Show distribution of numeric values'
            })

        if len(numeric_cols) >= 2:
            recs.append({
                'type': 'boxplot',
                'title': 'Box Plot of Numeric Variables',
                'columns': numeric_cols[:5],
                'reason': 'Show quartiles and outliers'
            })

    if len(numeric_cols) >= 2:
        for i in range(min(3, len(numeric_cols))):
            for j in range(i + 1, min(3, len(numeric_cols))):
                recs.append({
                    'type': 'scatter',
                    'title': '{} vs {}'.format(numeric_cols[i], numeric_cols[j]),
                    'columns': [numeric_cols[i], numeric_cols[j]],
                    'reason': 'Show relationship between two numeric variables'
                })

        corr_cols = numeric_cols[:min(8, len(numeric_cols))]
        recs.append({
            'type': 'heatmap',
            'title': 'Correlation Heatmap',
            'columns': corr_cols,
            'reason': 'Show correlations between numeric variables'
        })

    if len(categorical_cols) >= 1 and len(numeric_cols) >= 1:
        for cat_col in categorical_cols[:3]:
            if df[cat_col].nunique() <= 20:
                for num_col in numeric_cols[:2]:
                    recs.append({
                        'type': 'bar',
                        'title': '{} by {}'.format(num_col, cat_col),
                        'columns': [cat_col, num_col],
                        'reason': 'Compare numeric values across categories'
                    })

    if len(categorical_cols) >= 1:
        for col in categorical_cols[:3]:
            unique_count = df[col].nunique()
            if unique_count <= 15:
                recs.append({
                    'type': 'pie',
                    'title': 'Distribution of {}'.format(col),
                    'columns': [col],
                    'reason': 'Show proportion of categories'
                })
            else:
                recs.append({
                    'type': 'bar',
                    'title': 'Top Categories in {}'.format(col),
                    'columns': [col],
                    'reason': 'Show frequency of top categories'
                })

    if len(datetime_cols) >= 1 and len(numeric_cols) >= 1:
        for dt_col in datetime_cols[:2]:
            for num_col in numeric_cols[:2]:
                recs.append({
                    'type': 'line',
                    'title': '{} over {}'.format(num_col, dt_col),
                    'columns': [dt_col, num_col],
                    'reason': 'Show trend over time'
                })

    if len(numeric_cols) >= 3:
        for col in numeric_cols[:3]:
            recs.append({
                'type': 'violin',
                'title': 'Violin Plot of {}'.format(col),
                'columns': [col],
                'reason': 'Show distribution shape and density'
            })

    if len(categorical_cols) >= 2 and len(numeric_cols) >= 1:
        cat1, cat2 = categorical_cols[:2]
        num = numeric_cols[0]
        if df[cat1].nunique() <= 10 and df[cat2].nunique() <= 10:
            recs.append({
                'type': 'grouped_bar',
                'title': '{} by {} and {}'.format(num, cat1, cat2),
                'columns': [cat1, cat2, num],
                'reason': 'Compare numeric values across two categorical dimensions'
            })

    return recs


def get_chart_data(df: pd.DataFrame, chart_type: str, columns: List[str], column_types: Dict[str, str]) -> Dict[str, Any]:
    if chart_type == 'histogram':
        col = columns[0]
        vals = pd.to_numeric(df[col], errors='coerce').dropna()
        hist, bins = np.histogram(vals, bins=min(20, max(5, len(vals) // 10)))
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
                q1 = float(vals.quantile(0.25))
                q3 = float(vals.quantile(0.75))
                iqr = q3 - q1
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr
                outlier_vals = vals[(vals < lower) | (vals > upper)]
                data[col] = {
                    'min': float(vals.min()),
                    'q1': q1,
                    'median': float(vals.median()),
                    'q3': q3,
                    'max': float(vals.max()),
                    'outliers': outlier_vals.tolist()
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
            'title': 'Distribution of {}'.format(col)
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

    elif chart_type == 'grouped_bar':
        cat1, cat2, num_col = columns[0], columns[1], columns[2]
        grouped = df.groupby([cat1, cat2])[num_col].mean().unstack(fill_value=0)
        categories = grouped.index.tolist()
        sub_categories = grouped.columns.tolist()
        values = []
        for sub in sub_categories:
            values.append(grouped[sub].tolist())
        return {
            'type': 'grouped_bar',
            'data': {
                'categories': categories,
                'sub_categories': sub_categories,
                'values': values
            },
            'x_label': cat1,
            'y_label': num_col
        }

    return {'type': chart_type, 'data': {}, 'error': 'Chart data generation not implemented'}
