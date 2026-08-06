import random
from typing import List, Tuple

CONCEPT_VARIATIONS = {
    'Salary': [
        'salary', 'salaries', 'income', 'monthly_income', 'basic_salary', 'wage', 'wages',
        'monthly_pay', 'pay', 'compensation', 'payroll', 'employee_salary', 'package',
        'base_salary', 'annual_salary', 'hourly_rate', 'net_pay', 'remuneration', 'earnings'
    ],
    'Revenue': [
        'revenue', 'revenues', 'sales', 'total_sales', 'gross_revenue', 'gross_sales',
        'turnover', 'earnings', 'total_revenue', 'sales_amount', 'billings', 'sales_volume',
        'transaction_amount', 'contract_value', 'sales_rev', 'gross_receipts', 'receipts'
    ],
    'Profit': [
        'profit', 'profits', 'net_profit', 'margin', 'net_margin', 'net_income',
        'gross_profit', 'net_margin_amt', 'operating_income', 'profit_amt', 'bottom_line',
        'operating_profit', 'gain', 'net_earnings', 'profit_margin'
    ],
    'Employee Travel Frequency': [
        'business_travel', 'travel_frequency', 'employee_travel', 'travel_pref',
        'business_travel_frequency', 'travel_count', 'trip_freq', 'travel_habits',
        'travel_type', 'business_trips'
    ],
    'Employee Position': [
        'job_role', 'role', 'position', 'title', 'designation', 'job_title',
        'employee_role', 'employee_position', 'job_designation', 'post', 'job_role_name',
        'occupation', 'staff_role'
    ],
    'Company Revenue': [
        'company_revenue', 'annual_revenue', 'firm_revenue', 'total_company_revenue',
        'corporate_revenue', 'organization_revenue', 'enterprise_revenue', 'business_revenue'
    ],
    'Department': [
        'department', 'dept', 'division', 'business_unit', 'team', 'dept_name',
        'function', 'dept_code', 'group_name', 'department_name', 'dept_id'
    ],
    'Product': [
        'product', 'product_name', 'item', 'item_name', 'sku', 'product_id',
        'product_sku', 'merchandise', 'product_desc', 'item_desc', 'goods'
    ],
    'Quantity': [
        'quantity', 'qty', 'units', 'units_sold', 'quantity_ordered', 'items_count',
        'volume', 'quantity_sold', 'pieces', 'units_purchased', 'number_of_items'
    ],
    'Discount': [
        'discount', 'discount_percentage', 'discount_pct', 'rebate', 'promo_discount',
        'price_cut', 'discount_amount', 'markdown', 'discount_rate', 'price_reduction'
    ],
    'Price': [
        'unit_price', 'price', 'retail_price', 'selling_price', 'cost_price',
        'list_price', 'msrp', 'item_price', 'rate', 'unit_cost', 'price_per_unit'
    ],
    'Date': [
        'date', 'order_date', 'sale_date', 'invoice_date', 'transaction_date',
        'timestamp', 'created_at', 'signup_date', 'hire_date', 'join_date', 'date_added'
    ],
    'Region': [
        'region', 'country', 'territory', 'state', 'zone', 'area', 'location',
        'market', 'division', 'city', 'warehouse_location', 'geography', 'province'
    ],
    'Customer': [
        'customer', 'customer_name', 'client', 'client_name', 'account', 'account_name',
        'customer_id', 'client_id', 'user_id', 'buyer', 'consumer', 'subscriber'
    ],
    'Churn': [
        'churn', 'left', 'active', 'status', 'terminated', 'resigned', 'attrition',
        'termination_status', 'churn_status', 'exit', 'retention', 'active_status'
    ]
}

def generate_schema_samples(num_samples: int = 500) -> Tuple[List[str], List[str]]:
    texts = []
    labels = []
    
    # Let's generate a list of column names mapped to concepts
    # We will expand each concept using random casing, formatting, prefixes, and suffixes.
    prefixes = ['', 'df_', 'col_', 'tbl_', 'data_']
    suffixes = ['', '_val', '_id', '_code', '_name', '_data']
    
    for concept, variations in CONCEPT_VARIATIONS.items():
        for _ in range(num_samples):
            base_var = random.choice(variations)
            
            # Format variations
            format_type = random.choice(['camel', 'snake', 'upper', 'lower', 'title'])
            
            # Add prefix/suffix sometimes
            prefix = random.choice(prefixes) if random.random() > 0.7 else ''
            suffix = random.choice(suffixes) if random.random() > 0.7 else ''
            
            # Assemble
            words = []
            if prefix:
                words.append(prefix)
            words.extend(base_var.split('_'))
            if suffix:
                words.append(suffix)
                
            if format_type == 'snake':
                col_name = "_".join(words)
            elif format_type == 'camel':
                col_name = words[0].lower() + "".join(w.capitalize() for w in words[1:])
            elif format_type == 'upper':
                col_name = "_".join(words).upper()
            elif format_type == 'title':
                col_name = " ".join(words).title()
            else:  # lower
                col_name = "".join(words).lower()
                
            # Clean spaces
            col_name = col_name.strip()
            
            texts.append(col_name)
            labels.append(concept)
            
    return texts, labels
