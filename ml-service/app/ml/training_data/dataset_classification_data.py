import random
from typing import List, Tuple

DOMAIN_COLUMNS = {
    'hr': [
        'employee_id', 'employee_name', 'age', 'gender', 'salary', 'department', 
        'job_role', 'tenure', 'hire_date', 'performance_rating', 'attrition', 
        'overtime', 'satisfaction', 'education', 'manager', 'relationship_satisfaction', 
        'work_life_balance', 'years_at_company', 'years_since_last_promotion', 'birth_date',
        'termination_date', 'job_level', 'monthly_income', 'percent_salary_hike'
    ],
    'sales': [
        'sales_id', 'order_id', 'product_id', 'product_name', 'quantity', 'price', 
        'discount', 'revenue', 'profit', 'customer_id', 'region', 'state', 'country', 
        'order_date', 'ship_date', 'category', 'sub_category', 'segment', 'shipping_cost',
        'sales_rep', 'payment_method', 'order_status', 'unit_price', 'total_amount'
    ],
    'customer': [
        'customer_id', 'customer_name', 'email', 'phone', 'age', 'gender', 'signup_date', 
        'churn', 'tenure', 'ltv', 'satisfaction_score', 'loyalty_points', 'last_purchase_date', 
        'region', 'segment', 'acquisition_channel', 'support_tickets_count', 'address',
        'postal_code', 'customer_type', 'active_status', 'membership_tier'
    ],
    'finance': [
        'transaction_id', 'account_id', 'date', 'description', 'amount', 'type', 
        'category', 'balance', 'budget', 'expense', 'cost', 'revenue', 'profit', 'tax', 
        'margin', 'asset_id', 'depreciation', 'liability', 'equity', 'cash_flow',
        'invoice_number', 'payment_date', 'ledger_code', 'fiscal_year'
    ],
    'inventory': [
        'item_id', 'sku', 'product_name', 'category', 'warehouse_id', 'location', 
        'bin_number', 'quantity_on_hand', 'reorder_point', 'safety_stock', 'supplier_name', 
        'unit_cost', 'unit_price', 'lead_time', 'batch_number', 'expiry_date', 'stock_status',
        'inventory_value', 'supplier_contact', 'reorder_quantity'
    ],
    'marketing': [
        'campaign_id', 'campaign_name', 'start_date', 'end_date', 'channel', 'impressions', 
        'clicks', 'conversions', 'ctr', 'spend', 'budget', 'revenue', 'roi', 'target_audience', 
        'reach', 'cpc', 'cpm', 'acquisition_cost', 'email_opens', 'bounce_rate'
    ],
    'insurance': [
        'policy_id', 'customer_id', 'age', 'gender', 'premium', 'coverage_limit', 'deductible', 
        'claim_id', 'claim_amount', 'claim_date', 'claim_status', 'disease', 'vehicle_model', 
        'engine_capacity', 'incident_type', 'policy_type', 'risk_score', 'expiry_date'
    ],
    'retail': [
        'transaction_id', 'store_id', 'cashier_id', 'customer_id', 'timestamp', 'total_amount', 
        'payment_method', 'item_count', 'loyalty_card', 'discount_applied', 'tax_amount', 
        'store_location', 'receipt_number', 'register_number', 'return_status'
    ],
    'supply_chain': [
        'shipment_id', 'carrier_name', 'origin', 'destination', 'departure_date', 'arrival_date', 
        'status', 'weight', 'volume', 'shipping_cost', 'delay_reason', 'temperature_logs', 
        'driver_id', 'vehicle_type', 'route_id', 'tracking_number', 'delivery_time'
    ],
    'crm': [
        'lead_id', 'contact_name', 'company', 'email', 'phone', 'stage', 'value', 'close_date', 
        'owner_id', 'activity_count', 'last_contact_date', 'lead_source', 'conversion_time',
        'deal_size', 'industry', 'next_step', 'probability_pct'
    ],
    'ecommerce': [
        'cart_id', 'user_id', 'session_id', 'device_type', 'ip_address', 'product_sku', 
        'quantity', 'item_price', 'total_price', 'coupon_code', 'payment_gateway', 
        'shipping_address', 'order_status', 'page_views', 'time_spent_seconds'
    ],
    'manufacturing': [
        'machine_id', 'operator_id', 'timestamp', 'temperature', 'pressure', 'vibration_level', 
        'status', 'fault_code', 'units_produced', 'scrap_count', 'cycle_time', 'maintenance_due',
        'efficiency_pct', 'downtime_minutes', 'calibration_date'
    ],
    'generic': [
        'id', 'x', 'y', 'val1', 'val2', 'col1', 'col2', 'col3', 'test_col', 'data_field', 
        'created_at', 'updated_at', 'status', 'name', 'type', 'description', 'notes',
        'value', 'score', 'count', 'date', 'flag', 'category_name', 'weight_kg'
    ]
}

DOMAIN_LABELS = {
    'hr': 'Employee Dataset',
    'sales': 'Sales Dataset',
    'customer': 'Customer Dataset',
    'finance': 'Finance Dataset',
    'inventory': 'Inventory Dataset',
    'marketing': 'Marketing Dataset',
    'insurance': 'Insurance Dataset',
    'retail': 'Retail Dataset',
    'supply_chain': 'Supply Chain Dataset',
    'crm': 'CRM Dataset',
    'ecommerce': 'E-commerce Dataset',
    'manufacturing': 'Manufacturing Dataset',
    'generic': 'Generic Dataset'
}

def generate_classification_samples(num_samples: int = 500) -> Tuple[List[str], List[str]]:
    texts = []
    labels = []
    
    # We want balanced classes
    for domain, cols in DOMAIN_COLUMNS.items():
        label = DOMAIN_LABELS[domain]
        for _ in range(num_samples):
            # Select random number of columns from this domain
            num_cols = random.randint(4, min(12, len(cols)))
            chosen_cols = random.sample(cols, num_cols)
            
            # Add some generic columns as noise (except for generic itself)
            if domain != 'generic' and random.random() > 0.4:
                num_noise = random.randint(1, 3)
                noise_cols = random.sample(DOMAIN_COLUMNS['generic'], num_noise)
                chosen_cols.extend(noise_cols)
            
            # Shuffle columns to remove order bias
            random.shuffle(chosen_cols)
            
            # Apply some minor noise/typos or uppercase variations
            final_cols = []
            for col in chosen_cols:
                r = random.random()
                if r < 0.15:
                    final_cols.append(col.upper())
                elif r < 0.30:
                    final_cols.append(col.replace('_', ' ').title())
                elif r < 0.40:
                    final_cols.append(col.replace('_', ''))
                else:
                    final_cols.append(col)
            
            # Construct feature string
            cols_str = " ".join(final_cols)
            
            # Add metadata hints
            row_count = random.choice([50, 100, 500, 1000, 5000, 10000, 50000])
            col_count = len(final_cols)
            feature_text = f"cols: {cols_str} | rows: {row_count} | columns_count: {col_count}"
            
            texts.append(feature_text)
            labels.append(label)
            
    return texts, labels
