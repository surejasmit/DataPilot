import random
from typing import List, Tuple

CHART_CLASSES = [
    'bar', 'line', 'pie', 'histogram', 'scatter', 'heatmap', 'boxplot', 'violin', 'grouped_bar'
]

def generate_chart_samples(num_samples: int = 500) -> Tuple[List[str], List[str]]:
    texts = []
    labels = []
    
    # We will generate features for pairs/lists of columns that map to specific recommended charts.
    domains = ['hr', 'sales', 'customer', 'finance', 'inventory', 'marketing', 'generic']
    
    # Rule 1: Revenue/Sales + Date -> line chart
    for _ in range(num_samples):
        domain = random.choice(['sales', 'finance', 'retail', 'ecommerce'])
        col1 = random.choice(['Revenue', 'Sales', 'Total_Amount', 'profit', 'spend'])
        col2 = random.choice(['Date', 'order_date', 'Month', 'Year', 'timestamp'])
        feature = f"cols: {col1} {col2} | types: number date | domain: {domain}"
        texts.append(feature)
        labels.append('line')
        
    # Rule 2: Numeric + Categorical with low cardinality -> bar chart
    for _ in range(num_samples):
        domain = random.choice(domains)
        col1 = random.choice(['Salary', 'Revenue', 'Sales', 'Quantity', 'Rating', 'spent'])
        col2 = random.choice(['Department', 'Region', 'Category', 'Country', 'gender', 'segment'])
        feature = f"cols: {col2} {col1} | types: string number | domain: {domain}"
        texts.append(feature)
        labels.append('bar')
        
    # Rule 3: Single numeric column -> histogram or boxplot
    for _ in range(num_samples):
        domain = random.choice(domains)
        col1 = random.choice(['Salary', 'Revenue', 'Sales', 'Age', 'Quantity', 'LTV', 'temperature'])
        feature = f"cols: {col1} | types: number | domain: {domain}"
        texts.append(feature)
        # 70% histogram, 30% boxplot/violin
        labels.append(random.choice(['histogram', 'boxplot', 'violin']))
        
    # Rule 4: Two numeric columns -> scatter plot
    for _ in range(num_samples):
        domain = random.choice(domains)
        col1 = random.choice(['Age', 'Salary', 'experience', 'Rating', 'cost', 'spend', 'Revenue', 'vibration_level'])
        col2 = random.choice(['tenure', 'income', 'performance', 'satisfaction', 'price', 'profit', 'pressure'])
        feature = f"cols: {col1} {col2} | types: number number | domain: {domain}"
        texts.append(feature)
        labels.append('scatter')
        
    # Rule 5: Multiple numeric columns (>= 3) -> heatmap (for correlation)
    for _ in range(num_samples):
        domain = random.choice(domains)
        col1 = random.choice(['Age', 'Salary', 'experience', 'Rating', 'cost', 'spend', 'Revenue'])
        col2 = random.choice(['tenure', 'income', 'performance', 'satisfaction', 'price', 'profit'])
        col3 = random.choice(['sales', 'units', 'clicks', 'impressions', 'margin'])
        feature = f"cols: {col1} {col2} {col3} | types: number number number | domain: {domain}"
        texts.append(feature)
        labels.append('heatmap')
        
    # Rule 6: Single categorical column with low cardinality -> pie chart
    for _ in range(num_samples):
        domain = random.choice(domains)
        col1 = random.choice(['Segment', 'gender', 'Tier', 'customer_type', 'payment_method', 'status', 'attrition'])
        feature = f"cols: {col1} | types: string | domain: {domain}"
        texts.append(feature)
        labels.append('pie')
        
    # Rule 7: Two categorical columns + one numeric -> grouped_bar
    for _ in range(num_samples):
        domain = random.choice(domains)
        col1 = random.choice(['Department', 'Region', 'Category', 'Country'])
        col2 = random.choice(['gender', 'Segment', 'Tier', 'status'])
        col3 = random.choice(['Salary', 'Revenue', 'Sales', 'Quantity', 'spent'])
        feature = f"cols: {col1} {col2} {col3} | types: string string number | domain: {domain}"
        texts.append(feature)
        labels.append('grouped_bar')
        
    return texts, labels
