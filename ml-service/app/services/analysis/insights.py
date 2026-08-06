import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.services.analysis.dataset_reader import infer_data_type
from app.services.analysis.business_validation import detect_business_domain


def _detect_domain_columns(df: pd.DataFrame) -> Dict[str, list]:
    domain_cols: Dict[str, list] = {}
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


def _fmt_val(v):
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return 'N/A'
    if abs(v) >= 1000000:
        return '${:,.2f}M'.format(v / 1000000) if v >= 0 else '-${:,.2f}M'.format(abs(v) / 1000000)
    if abs(v) >= 1000:
        return '${:,.2f}'.format(v) if v >= 0 else '-${:,.2f}'.format(abs(v))
    return '{:,.2f}'.format(v)


def _get_col_label(col):
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
        'score': 'Score', 'rating': 'Rating',
    }
    for key, label in label_map.items():
        if key in col_lower:
            return label
    return col.replace('_', ' ').title()


def generate_insights(df, column_types, column_stats=None):
    candidates = []
    total_rows = len(df)
    if total_rows == 0:
        return candidates

    numeric_cols = [col for col, dtype in column_types.items() if dtype == 'number']
    categorical_cols = [col for col, dtype in column_types.items() if dtype == 'string']
    datetime_cols = [col for col, dtype in column_types.items() if dtype == 'date']

    validation = detect_business_domain(df)
    domain = validation.get('domain', 'generic')
    is_business = validation.get('is_business', False)
    domain_cols = _detect_domain_columns(df)

    if is_business:
        candidates.extend(_generate_domain_insights(df, domain, domain_cols, numeric_cols, categorical_cols, datetime_cols))

    candidates.extend(_generate_kpi_insights(df, numeric_cols, categorical_cols, datetime_cols, total_rows))
    candidates.extend(_generate_statistical_insights(df, numeric_cols, categorical_cols, column_stats, total_rows))
    candidates.extend(_generate_quality_insights(df, total_rows))

    if len(numeric_cols) >= 2:
        candidates.extend(_generate_correlation_insights(df, numeric_cols))

    # Apply ML ranking
    try:
        from app.ml.registry import registry
        recommender = registry.get_model("insight_recommender")
    except Exception:
        recommender = None

    if recommender is not None:
        try:
            recs = recommender.predict(domain, df.columns.tolist(), column_types)
            rec_map = {r['insight']: r['confidence'] for r in recs}

            def _map_insight_to_class(insight) -> str:
                title = insight.get('title', '').lower()
                desc = insight.get('description', '').lower()
                if 'attrition' in title or 'attrition' in desc:
                    return 'attrition_analysis'
                if 'salary' in title or 'salary' in desc:
                    return 'salary_analysis'
                if 'department' in title or 'department' in desc:
                    return 'department_comparison'
                if 'promotion' in title or 'promotion' in desc:
                    return 'promotion_analysis'
                if 'overtime' in title or 'overtime' in desc:
                    return 'overtime_analysis'
                if 'satisfaction' in title or 'satisfaction' in desc:
                    return 'job_satisfaction_analysis'
                if 'revenue trend' in title or 'revenue trend' in desc or 'sales trend' in title:
                    return 'revenue_trend'
                if 'top product' in title or 'top product' in desc:
                    return 'top_products'
                if 'growth' in title or 'growth' in desc:
                    return 'sales_growth'
                if 'segmentation' in title or 'segment' in title:
                    return 'customer_segmentation'
                if 'regional' in title or 'region' in title:
                    return 'regional_sales'
                if 'profit' in title or 'profit' in desc or 'margin' in title:
                    return 'profit_analysis'
                if 'stock level' in title or 'stock level' in desc:
                    return 'stock_level_analysis'
                if 'supplier' in title or 'supplier' in desc:
                    return 'supplier_performance'
                if 'inventory' in title or 'inventory' in desc:
                    return 'inventory_turnover'
                if 'campaign' in title or 'campaign' in desc:
                    return 'campaign_roi'
                if 'funnel' in title or 'funnel' in desc:
                    return 'conversion_funnel'
                if 'retention' in title or 'retention' in desc:
                    return 'retention_rate_analysis'
                if 'missing' in title or 'duplicate' in title or 'quality' in title:
                    return 'data_quality_issues'
                return 'general_statistics'

            for insight in candidates:
                cls_name = _map_insight_to_class(insight)
                conf = rec_map.get(cls_name, 0.5)
                insight['confidence'] = int(conf * 100)

            # Sort by confidence descending
            candidates.sort(key=lambda x: x.get('confidence', 50), reverse=True)
        except Exception as e:
            print(f"[ML Insights] Error ranking insights with ML: {e}")

    return candidates


def _generate_domain_insights(df, domain, domain_cols, numeric_cols, categorical_cols, datetime_cols):
    insights = []
    if domain == 'hr':
        insights.extend(_generate_hr_insights(df, domain_cols, numeric_cols, categorical_cols))
    elif domain == 'sales':
        insights.extend(_generate_sales_insights(df, domain_cols, numeric_cols, categorical_cols, datetime_cols))
    elif domain == 'customer':
        insights.extend(_generate_customer_insights(df, domain_cols, numeric_cols, categorical_cols))
    elif domain == 'finance':
        insights.extend(_generate_finance_insights(df, domain_cols, numeric_cols, categorical_cols))
    elif domain == 'inventory':
        insights.extend(_generate_inventory_insights(df, domain_cols, numeric_cols, categorical_cols))
    return insights


def _generate_hr_insights(df, domain_cols, numeric_cols, categorical_cols):
    insights = []
    dept_col = attrition_col = salary_col = hire_col = None

    for col in df.columns:
        col_lower = str(col).lower()
        if not dept_col and any(h in col_lower for h in ['department', 'dept']):
            dept_col = col
        if not attrition_col and any(h in col_lower for h in ['attrition', 'left', 'terminated', 'resigned']):
            attrition_col = col
        if not salary_col and any(h in col_lower for h in ['salary', 'pay', 'compensation', 'wage', 'income']):
            salary_col = col
        if not hire_col and any(h in col_lower for h in ['hire_date', 'start_date', 'join_date', 'hiring']):
            hire_col = col

    if attrition_col and dept_col:
        try:
            if df[attrition_col].dtype == 'object':
                attrition_by_dept = df.groupby(dept_col)[attrition_col].apply(
                    lambda x: (x.str.lower().isin(['yes', 'true', '1', 'y'])).sum() / max(len(x), 1) * 100
                ).sort_values(ascending=False)
            else:
                attrition_by_dept = df.groupby(dept_col)[attrition_col].mean().sort_values(ascending=False) * 100
            if len(attrition_by_dept) > 0:
                top_dept = attrition_by_dept.index[0]
                top_rate = attrition_by_dept.iloc[0]
                insights.append({
                    'type': 'business_insight',
                    'title': 'Department Attrition Risk',
                    'description': "Department '{}' has the highest attrition rate at {:.1f}%. This may indicate issues with employee satisfaction, management, or compensation. Consider conducting employee surveys and reviewing retention strategies.".format(top_dept, top_rate),
                    'details': {'metric': 'Attrition Rate by Department', 'value': '{:.1f}%'.format(top_rate)},
                    'severity': 'warning' if top_rate > 20 else 'info',
                    'confidence': 85
                })
        except Exception:
            pass

    if salary_col and dept_col:
        try:
            salary_numeric = pd.to_numeric(df[salary_col], errors='coerce')
            valid_mask = salary_numeric.notna()
            if valid_mask.sum() > 0:
                temp_df = pd.DataFrame({dept_col: df.loc[valid_mask, dept_col], salary_col: salary_numeric[valid_mask]})
                salary_stats = temp_df.groupby(dept_col)[salary_col].agg(['mean', 'median', 'min', 'max'])
                avg_salary = temp_df[salary_col].mean()
                highest_dept = salary_stats['mean'].idxmax()
                lowest_dept = salary_stats['mean'].idxmin()
                spread = salary_stats['mean'].max() - salary_stats['mean'].min()
                insights.append({
                    'type': 'business_insight',
                    'title': 'Salary Distribution by Department',
                    'description': "Average salary across all departments is {}. '{}' has the highest average at {}, while '{}' has the lowest at {}. The salary spread between departments is {}.".format(
                        _fmt_val(avg_salary), highest_dept, _fmt_val(salary_stats.loc[highest_dept, 'mean']),
                        lowest_dept, _fmt_val(salary_stats.loc[lowest_dept, 'mean']), _fmt_val(spread)),
                    'details': {'metric': 'Average Salary', 'value': _fmt_val(avg_salary)},
                    'severity': 'info',
                    'confidence': 90
                })
        except Exception:
            pass

    if attrition_col:
        try:
            if df[attrition_col].dtype == 'object':
                attrition_rate = df[attrition_col].str.lower().isin(['yes', 'true', '1', 'y']).mean() * 100
            else:
                attrition_rate = pd.to_numeric(df[attrition_col], errors='coerce').mean() * 100
            count = int(attrition_rate * len(df) / 100)
            severity_msg = 'This is above industry average (15-20%) and requires immediate attention.' if attrition_rate > 20 else 'This is within acceptable industry range.'
            insights.append({
                'type': 'business_insight',
                'title': 'Overall Attrition Rate',
                'description': "The overall attrition rate is {:.1f}% ({} employees out of {}). {}".format(attrition_rate, count, len(df), severity_msg),
                'details': {'metric': 'Attrition Rate', 'value': '{:.1f}%'.format(attrition_rate)},
                'severity': 'warning' if attrition_rate > 20 else 'info',
                'confidence': 90
            })
        except Exception:
            pass

    if hire_col:
        try:
            hire_dates = pd.to_datetime(df[hire_col], errors='coerce')
            valid_dates = hire_dates.dropna()
            if len(valid_dates) > 10:
                valid_dates_sorted = valid_dates.sort_values()
                earliest = valid_dates_sorted.iloc[0]
                latest = valid_dates_sorted.iloc[-1]
                year_counts = valid_dates_sorted.dt.year.value_counts().sort_index()
                peak_year = year_counts.idxmax() if len(year_counts) > 0 else 'N/A'
                peak_count = int(year_counts.max()) if len(year_counts) > 0 else 0
                insights.append({
                    'type': 'business_insight',
                    'title': 'Hiring Trends Over Time',
                    'description': "Hiring data spans from {} to {}. The peak hiring year was {} with {} new hires. Total hires recorded: {}.".format(
                        earliest.strftime('%Y-%m-%d'), latest.strftime('%Y-%m-%d'), peak_year, peak_count, len(valid_dates)),
                    'details': {'metric': 'Hiring Period', 'value': '{} - {}'.format(earliest.strftime('%Y'), latest.strftime('%Y'))},
                    'severity': 'info',
                    'confidence': 85
                })
        except Exception:
            pass

    return insights


def _generate_sales_insights(df, domain_cols, numeric_cols, categorical_cols, datetime_cols):
    insights = []
    revenue_col = product_col = region_col = date_col = discount_col = None

    for col in df.columns:
        col_lower = str(col).lower()
        if not revenue_col and any(h in col_lower for h in ['revenue', 'sales', 'total_sales', 'amount']):
            revenue_col = col
        if not product_col and any(h in col_lower for h in ['product', 'item', 'sku', 'product_name']):
            product_col = col
        if not region_col and any(h in col_lower for h in ['region', 'territory', 'area', 'zone', 'location']):
            region_col = col
        if not discount_col and any(h in col_lower for h in ['discount', 'discount_pct', 'discount_amount']):
            discount_col = col
        if not date_col and any(h in col_lower for h in ['date', 'order_date', 'sale_date', 'transaction_date']):
            date_col = col

    if revenue_col:
        try:
            rev_vals = pd.to_numeric(df[revenue_col], errors='coerce').dropna()
            if len(rev_vals) > 0:
                total_revenue = rev_vals.sum()
                avg_revenue = rev_vals.mean()
                max_revenue = rev_vals.max()
                insights.append({
                    'type': 'business_insight',
                    'title': 'Revenue Summary',
                    'description': "Total revenue is {} across {} records. Average revenue per record is {}. The highest single revenue value is {}.".format(
                        _fmt_val(total_revenue), len(rev_vals), _fmt_val(avg_revenue), _fmt_val(max_revenue)),
                    'details': {'metric': 'Total Revenue', 'value': _fmt_val(total_revenue)},
                    'severity': 'info',
                    'confidence': 95
                })
        except Exception:
            pass

    if revenue_col and product_col:
        try:
            temp_df = pd.DataFrame({
                revenue_col: pd.to_numeric(df[revenue_col], errors='coerce'),
                product_col: df[product_col]
            }).dropna()
            if len(temp_df) > 0:
                product_revenue = temp_df.groupby(product_col)[revenue_col].sum().sort_values(ascending=False)
                top_5 = product_revenue.head(5)
                top_product = product_revenue.index[0]
                top_product_rev = product_revenue.iloc[0]
                total = product_revenue.sum()
                top_5_pct = (top_5.sum() / total * 100) if total > 0 else 0
                insights.append({
                    'type': 'business_insight',
                    'title': 'Top Products by Revenue',
                    'description': "The top product '{}' generated {} in revenue. The top 5 products account for {:.1f}% of total revenue. There are {} unique products in total.".format(
                        top_product, _fmt_val(top_product_rev), top_5_pct, product_revenue.nunique()),
                    'details': {'metric': 'Top Product Revenue', 'value': _fmt_val(top_product_rev)},
                    'severity': 'info',
                    'confidence': 90
                })
        except Exception:
            pass

    if revenue_col and region_col:
        try:
            temp_df = pd.DataFrame({
                revenue_col: pd.to_numeric(df[revenue_col], errors='coerce'),
                region_col: df[region_col]
            }).dropna()
            if len(temp_df) > 0:
                region_revenue = temp_df.groupby(region_col)[revenue_col].sum().sort_values(ascending=False)
                top_region = region_revenue.index[0]
                top_region_rev = region_revenue.iloc[0]
                total_rev = region_revenue.sum()
                insights.append({
                    'type': 'business_insight',
                    'title': 'Regional Performance',
                    'description': "Region '{}' leads with {} in total revenue. There are {} regions in total. Top region contributes {:.1f}% of total.".format(
                        top_region, _fmt_val(top_region_rev), region_revenue.nunique(),
                        (top_region_rev / total_rev * 100) if total_rev > 0 else 0),
                    'details': {'metric': 'Top Region Revenue', 'value': _fmt_val(top_region_rev)},
                    'severity': 'info',
                    'confidence': 90
                })
        except Exception:
            pass

    if revenue_col and discount_col:
        try:
            temp_df = pd.DataFrame({
                revenue_col: pd.to_numeric(df[revenue_col], errors='coerce'),
                discount_col: pd.to_numeric(df[discount_col], errors='coerce')
            }).dropna()
            if len(temp_df) > 0:
                corr = temp_df[revenue_col].corr(temp_df[discount_col])
                avg_discount = temp_df[discount_col].mean()
                if corr > 0.2:
                    msg = 'Higher discounts appear to drive more revenue.'
                elif corr < -0.2:
                    msg = 'Discount strategy may need review.'
                else:
                    msg = 'Discount has minimal impact on revenue.'
                insights.append({
                    'type': 'business_insight',
                    'title': 'Discount Impact Analysis',
                    'description': "Average discount is {:.2f}. The correlation between discount and revenue is {:.3f} ({}). {}".format(
                        avg_discount, corr, 'positive' if corr > 0 else 'negative', msg),
                    'details': {'metric': 'Discount-Revenue Correlation', 'value': '{:.3f}'.format(corr)},
                    'severity': 'warning' if abs(corr) > 0.3 else 'info',
                    'confidence': 80
                })
        except Exception:
            pass

    if revenue_col and date_col:
        try:
            temp_df = pd.DataFrame({
                revenue_col: pd.to_numeric(df[revenue_col], errors='coerce'),
                date_col: pd.to_datetime(df[date_col], errors='coerce')
            }).dropna()
            if len(temp_df) > 10:
                temp_df = temp_df.copy()
                temp_df['month'] = temp_df[date_col].dt.to_period('M')
                monthly = temp_df.groupby('month')[revenue_col].sum().sort_index()
                if len(monthly) > 2:
                    trend = 'increasing' if monthly.iloc[-1] > monthly.iloc[0] else 'decreasing'
                    change_pct = ((monthly.iloc[-1] - monthly.iloc[0]) / max(monthly.iloc[0], 1)) * 100
                    insights.append({
                        'type': 'business_insight',
                        'title': 'Revenue Trend Over Time',
                        'description': "Revenue trend is {} over {} months. Change from first to last month: {:+.1f}%. Peak month: {} ({}). Lowest month: {} ({}).".format(
                            trend, len(monthly), change_pct,
                            str(monthly.idxmax()), _fmt_val(monthly.max()),
                            str(monthly.idxmin()), _fmt_val(monthly.min())),
                        'details': {'metric': 'Revenue Trend', 'value': '{} ({:+.1f}%)'.format(trend, change_pct)},
                        'severity': 'info',
                        'confidence': 85
                    })
        except Exception:
            pass

    return insights


def _generate_customer_insights(df, domain_cols, numeric_cols, categorical_cols):
    insights = []
    customer_col = revenue_col = segment_col = None

    for col in df.columns:
        col_lower = str(col).lower()
        if not customer_col and any(h in col_lower for h in ['customer_id', 'customer', 'client', 'account_id']):
            customer_col = col
        if not revenue_col and any(h in col_lower for h in ['revenue', 'amount', 'total', 'spent', 'value']):
            revenue_col = col
        if not segment_col and any(h in col_lower for h in ['segment', 'category', 'tier', 'group', 'type']):
            segment_col = col

    if customer_col:
        try:
            unique_customers = df[customer_col].nunique()
            total_records = len(df)
            avg_records_per_customer = total_records / max(unique_customers, 1)
            insights.append({
                'type': 'business_insight',
                'title': 'Customer Base Overview',
                'description': "The dataset contains {:,} unique customers across {:,} records. Average records per customer: {:.1f}.".format(
                    unique_customers, total_records, avg_records_per_customer),
                'details': {'metric': 'Unique Customers', 'value': '{:,}'.format(unique_customers)},
                'severity': 'info',
                'confidence': 95
            })
            dup_customers = df[customer_col].value_counts()
            repeat_customers = dup_customers[dup_customers > 1]
            if len(repeat_customers) > 0:
                repeat_pct = len(repeat_customers) / unique_customers * 100
                insights.append({
                    'type': 'business_insight',
                    'title': 'Customer Retention Pattern',
                    'description': "{:,} customers ({:.1f}%) have multiple records, indicating repeat purchases. The most active customer has {} records.".format(
                        len(repeat_customers), repeat_pct, int(dup_customers.max())),
                    'details': {'metric': 'Repeat Customers', 'value': '{:.1f}%'.format(repeat_pct)},
                    'severity': 'info',
                    'confidence': 85
                })
        except Exception:
            pass

    if customer_col and revenue_col:
        try:
            temp_df = pd.DataFrame({
                customer_col: df[customer_col],
                revenue_col: pd.to_numeric(df[revenue_col], errors='coerce')
            }).dropna()
            if len(temp_df) > 0:
                customer_ltv = temp_df.groupby(customer_col)[revenue_col].sum()
                avg_ltv = customer_ltv.mean()
                median_ltv = customer_ltv.median()
                top_ltv = customer_ltv.max()
                insights.append({
                    'type': 'business_insight',
                    'title': 'Customer Lifetime Value',
                    'description': "Average customer lifetime value is {}. Median LTV is {}. Top customer LTV is {}.".format(
                        _fmt_val(avg_ltv), _fmt_val(median_ltv), _fmt_val(top_ltv)),
                    'details': {'metric': 'Average LTV', 'value': _fmt_val(avg_ltv)},
                    'severity': 'info',
                    'confidence': 90
                })
        except Exception:
            pass

    if segment_col:
        try:
            seg_counts = df[segment_col].value_counts()
            if len(seg_counts) > 1:
                top_seg = seg_counts.index[0]
                top_count = seg_counts.iloc[0]
                top_pct = top_count / len(df) * 100
                insights.append({
                    'type': 'business_insight',
                    'title': 'Customer Segmentation',
                    'description': "The largest segment is '{}' with {:,} customers ({:.1f}%). There are {} segments in total.".format(
                        top_seg, top_count, top_pct, len(seg_counts)),
                    'details': {'metric': 'Largest Segment', 'value': '{} ({:.1f}%)'.format(top_seg, top_pct)},
                    'severity': 'info',
                    'confidence': 85
                })
        except Exception:
            pass

    return insights


def _generate_finance_insights(df, domain_cols, numeric_cols, categorical_cols):
    insights = []
    revenue_col = cost_col = profit_col = None

    for col in df.columns:
        col_lower = str(col).lower()
        if not revenue_col and any(h in col_lower for h in ['revenue', 'income', 'gross']):
            revenue_col = col
        if not cost_col and any(h in col_lower for h in ['cost', 'expense', 'spending']):
            cost_col = col
        if not profit_col and any(h in col_lower for h in ['profit', 'net_income', 'net']):
            profit_col = col

    if revenue_col:
        try:
            rev_vals = pd.to_numeric(df[revenue_col], errors='coerce').dropna()
            if len(rev_vals) > 0:
                total_rev = rev_vals.sum()
                avg_rev = rev_vals.mean()
                insights.append({
                    'type': 'business_insight',
                    'title': 'Total Revenue Overview',
                    'description': "Total revenue is {} across {} records with an average of {} per record.".format(
                        _fmt_val(total_rev), len(rev_vals), _fmt_val(avg_rev)),
                    'details': {'metric': 'Total Revenue', 'value': _fmt_val(total_rev)},
                    'severity': 'info',
                    'confidence': 95
                })
        except Exception:
            pass

    if revenue_col and cost_col:
        try:
            temp_df = pd.DataFrame({
                revenue_col: pd.to_numeric(df[revenue_col], errors='coerce'),
                cost_col: pd.to_numeric(df[cost_col], errors='coerce')
            }).dropna()
            if len(temp_df) > 0:
                total_rev = temp_df[revenue_col].sum()
                total_cost = temp_df[cost_col].sum()
                margin = ((total_rev - total_cost) / max(total_rev, 1)) * 100
                insights.append({
                    'type': 'business_insight',
                    'title': 'Cost vs Revenue Analysis',
                    'description': "Total cost is {} against total revenue of {}. Gross margin is {:.1f}%.".format(
                        _fmt_val(total_cost), _fmt_val(total_rev), margin),
                    'details': {'metric': 'Gross Margin', 'value': '{:.1f}%'.format(margin)},
                    'severity': 'warning' if margin < 20 else 'info',
                    'confidence': 90
                })
        except Exception:
            pass

    if profit_col:
        try:
            profit_vals = pd.to_numeric(df[profit_col], errors='coerce').dropna()
            if len(profit_vals) > 0:
                total_profit = profit_vals.sum()
                avg_profit = profit_vals.mean()
                loss_count = int((profit_vals < 0).sum())
                loss_pct = (loss_count / len(profit_vals)) * 100
                insights.append({
                    'type': 'business_insight',
                    'title': 'Profitability Summary',
                    'description': "Total profit is {} with an average of {} per record. {} records ({:.1f}%) show a loss.".format(
                        _fmt_val(total_profit), _fmt_val(avg_profit), loss_count, loss_pct),
                    'details': {'metric': 'Total Profit', 'value': _fmt_val(total_profit)},
                    'severity': 'warning' if loss_pct > 30 else 'info',
                    'confidence': 90
                })
        except Exception:
            pass

    return insights


def _generate_inventory_insights(df, domain_cols, numeric_cols, categorical_cols):
    insights = []
    stock_col = reorder_col = supplier_col = product_col = None

    for col in df.columns:
        col_lower = str(col).lower()
        if not stock_col and any(h in col_lower for h in ['stock', 'quantity', 'inventory', 'units', 'on_hand']):
            stock_col = col
        if not reorder_col and any(h in col_lower for h in ['reorder', 'reorder_point', 'min_stock']):
            reorder_col = col
        if not supplier_col and any(h in col_lower for h in ['supplier', 'vendor', 'source']):
            supplier_col = col
        if not product_col and any(h in col_lower for h in ['product', 'item', 'sku', 'product_name']):
            product_col = col

    if stock_col:
        try:
            stock_vals = pd.to_numeric(df[stock_col], errors='coerce').dropna()
            if len(stock_vals) > 0:
                avg_stock = stock_vals.mean()
                low_stock = int((stock_vals < avg_stock * 0.5).sum())
                insights.append({
                    'type': 'business_insight',
                    'title': 'Stock Level Overview',
                    'description': "Average stock level is {:.0f} units. {} items ({:.1f}%) are below 50% of average stock, potentially at risk of stockout.".format(
                        avg_stock, low_stock, (low_stock / len(stock_vals)) * 100),
                    'details': {'metric': 'Average Stock', 'value': '{:.0f}'.format(avg_stock)},
                    'severity': 'warning' if low_stock > len(stock_vals) * 0.2 else 'info',
                    'confidence': 85
                })
        except Exception:
            pass

    if stock_col and reorder_col:
        try:
            temp_df = pd.DataFrame({
                stock_col: pd.to_numeric(df[stock_col], errors='coerce'),
                reorder_col: pd.to_numeric(df[reorder_col], errors='coerce')
            }).dropna()
            if len(temp_df) > 0:
                below_reorder = int((temp_df[stock_col] < temp_df[reorder_col]).sum())
                below_pct = (below_reorder / len(temp_df)) * 100
                insights.append({
                    'type': 'business_insight',
                    'title': 'Reorder Point Analysis',
                    'description': "{} items ({:.1f}%) are below their reorder point and need replenishment.".format(below_reorder, below_pct),
                    'details': {'metric': 'Items Below Reorder', 'value': '{} ({:.1f}%)'.format(below_reorder, below_pct)},
                    'severity': 'critical' if below_pct > 30 else 'warning',
                    'confidence': 90
                })
        except Exception:
            pass

    if supplier_col and stock_col:
        try:
            temp_df = pd.DataFrame({
                supplier_col: df[supplier_col],
                stock_col: pd.to_numeric(df[stock_col], errors='coerce')
            }).dropna()
            if len(temp_df) > 0:
                supplier_stock = temp_df.groupby(supplier_col)[stock_col].agg(['mean', 'count'])
                supplier_stock = supplier_stock.sort_values('mean')
                if len(supplier_stock) > 1:
                    low_supplier = supplier_stock.index[0]
                    high_supplier = supplier_stock.index[-1]
                    insights.append({
                        'type': 'business_insight',
                        'title': 'Supplier Performance',
                        'description': "Supplier '{}' has the lowest average stock level ({:.0f} units), while '{}' has the highest ({:.0f} units). Consider diversifying supply chain.".format(
                            low_supplier, supplier_stock.loc[low_supplier, 'mean'],
                            high_supplier, supplier_stock.loc[high_supplier, 'mean']),
                        'details': {'metric': 'Suppliers Analyzed', 'value': str(len(supplier_stock))},
                        'severity': 'info',
                        'confidence': 80
                    })
        except Exception:
            pass

    return insights


def _generate_kpi_insights(df, numeric_cols, categorical_cols, datetime_cols, total_rows):
    insights = []
    insights.append({
        'type': 'business_insight',
        'title': 'Dataset Overview',
        'description': "The dataset contains {:,} records with {} columns ({} numeric, {} categorical, {} date).".format(
            total_rows, len(df.columns), len(numeric_cols), len(categorical_cols), len(datetime_cols)),
        'details': {'metric': 'Total Records', 'value': '{:,}'.format(total_rows)},
        'severity': 'info',
        'confidence': 100
    })
    if len(datetime_cols) > 0 and len(numeric_cols) > 0:
        insights.append({
            'type': 'business_insight',
            'title': 'Time Series Potential',
            'description': "Dataset contains {} date column(s) and {} numeric column(s), suitable for time-series business analysis.".format(
                len(datetime_cols), len(numeric_cols)),
            'details': {'metric': 'Time Series Columns', 'value': ', '.join(datetime_cols)},
            'severity': 'info',
            'confidence': 85
        })
    return insights


def _generate_statistical_insights(df, numeric_cols, categorical_cols, column_stats, total_rows):
    insights = []

    for col in numeric_cols[:5]:
        vals = pd.to_numeric(df[col], errors='coerce').dropna()
        if len(vals) == 0:
            continue
        mean_val = vals.mean()
        max_val = vals.max()
        min_val = vals.min()
        label = _get_col_label(col)
        insights.append({
            'type': 'business_insight',
            'title': '{}: Average {}'.format(label, col),
            'description': 'The average value of {} is {:,.2f}'.format(col, mean_val),
            'details': {'metric': 'Average {}'.format(label), 'value': '{:,.2f}'.format(mean_val)},
            'severity': 'info',
            'confidence': 95
        })
        insights.append({
            'type': 'business_insight',
            'title': '{}: Range {}'.format(label, col),
            'description': '{} ranges from {:,.2f} to {:,.2f} (spread: {:,.2f})'.format(col, min_val, max_val, max_val - min_val),
            'details': {'metric': 'Range {}'.format(label), 'value': '{:,.2f} - {:,.2f}'.format(min_val, max_val)},
            'severity': 'info',
            'confidence': 100
        })

    for col in categorical_cols[:3]:
        vals = df[col].dropna().astype(str)
        if len(vals) == 0:
            continue
        freq = vals.value_counts()
        top = freq.head(5)
        unique_count = vals.nunique()
        insights.append({
            'type': 'business_insight',
            'title': '{} Distribution'.format(col),
            'description': 'Top categories: {}'.format(', '.join(['{} ({})'.format(k, v) for k, v in top.items()])),
            'details': {'metric': 'Unique Values', 'value': str(unique_count)},
            'severity': 'info',
            'confidence': 90
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
            'type': 'business_insight',
            'title': 'Missing Value Distribution',
            'description': '{} columns have missing values. "{}" has the most ({} / {:.2f}%)'.format(
                len(missing_info), worst_col[0], worst_col[1], pct),
            'details': {'metric': 'Total Missing', 'value': str(total_missing)},
            'severity': 'warning',
            'confidence': 100
        })

    duplicate_rows = total_rows - df.drop_duplicates().shape[0]
    if duplicate_rows > 0:
        dup_pct = (duplicate_rows / total_rows * 100) if total_rows > 0 else 0
        insights.append({
            'type': 'business_insight',
            'title': 'Duplicate Records',
            'description': '{} duplicate records found ({:.2f}% of total)'.format(duplicate_rows, dup_pct),
            'details': {'metric': 'Duplicate Records', 'value': str(duplicate_rows)},
            'severity': 'warning',
            'confidence': 100
        })

    return insights


def _generate_quality_insights(df, total_rows):
    return []


def _generate_correlation_insights(df, numeric_cols):
    insights = []
    try:
        numeric_df = df[numeric_cols[:8]].apply(pd.to_numeric, errors='coerce')
        corr_matrix = numeric_df.corr()
        pairs = []
        cols_used = numeric_cols[:8]
        for i in range(len(cols_used)):
            for j in range(i + 1, min(len(cols_used), i + 3)):
                val = corr_matrix.iloc[i, j]
                if not pd.isna(val):
                    pairs.append({'col1': cols_used[i], 'col2': cols_used[j], 'corr': val})
        for p in pairs[:3]:
            strength = 'strong' if abs(p['corr']) > 0.7 else 'moderate' if abs(p['corr']) > 0.4 else 'weak'
            direction = 'positive' if p['corr'] >= 0 else 'negative'
            insights.append({
                'type': 'business_insight',
                'title': 'Correlation: {} & {}'.format(p['col1'], p['col2']),
                'description': '{} {} correlation ({:.4f}) between {} and {}'.format(
                    strength, direction, p['corr'], p['col1'], p['col2']),
                'details': {'metric': 'Pearson Correlation', 'value': '{:.4f}'.format(p['corr'])},
                'severity': 'info',
                'confidence': 85
            })
    except Exception:
        pass
    return insights
