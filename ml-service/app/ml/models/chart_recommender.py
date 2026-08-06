import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
import numpy as np

class ChartRecommenderModel:
    def __init__(self):
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, lowercase=True)),
            ('clf', LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced'))
        ])

    def fit(self, texts, labels):
        self.pipeline.fit(texts, labels)
        
    def predict(self, columns: list, column_types: dict, domain: str = 'generic'):
        # Construct feature text
        col_names = " ".join(str(c) for c in columns)
        types_list = []
        for col in columns:
            types_list.append(column_types.get(col, 'string'))
        types_str = " ".join(types_list)
        
        feature_text = f"cols: {col_names} | types: {types_str} | domain: {domain}"
        
        probs = self.pipeline.predict_proba([feature_text])[0]
        classes = self.pipeline.classes_
        
        # Get ranked recommendations
        ranked_indices = np.argsort(probs)[::-1]
        
        recommendations = []
        for idx in ranked_indices:
            cls_name = classes[idx]
            prob = float(probs[idx])
            
            # Simple reason mapping
            reason = f"Recommended chart for {domain} domain with {len(columns)} columns of type {types_str}"
            if cls_name == 'line':
                reason = f"Line charts are optimal for tracking trends over time for {col_names}."
            elif cls_name == 'bar':
                reason = f"Bar charts compare values of {columns[1] if len(columns) > 1 else columns[0]} across {columns[0]}."
            elif cls_name == 'pie':
                reason = f"Pie charts display the proportion of categories in {columns[0]}."
            elif cls_name == 'histogram':
                reason = f"Histograms show the distribution of numeric values in {columns[0]}."
            elif cls_name == 'scatter':
                reason = f"Scatter plots visualize the correlation and relationship between {columns[0]} and {columns[1]}."
            elif cls_name == 'boxplot':
                reason = f"Boxplots show the spread, median, and outliers of the numeric columns."
            elif cls_name == 'violin':
                reason = f"Violin plots show the probability density of the data at different values."
            elif cls_name == 'heatmap':
                reason = f"Heatmaps represent correlation strength between numeric columns."
            elif cls_name == 'grouped_bar':
                reason = f"Grouped bars show comparisons of {columns[2]} across {columns[0]} subdivided by {columns[1]}."
                
            recommendations.append({
                "type": cls_name,
                "confidence": round(prob, 4),
                "reason": reason
            })
            
        return recommendations

    def evaluate(self, texts, labels):
        X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.2, random_state=42)
        eval_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, lowercase=True)),
            ('clf', LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced'))
        ])
        eval_pipeline.fit(X_train, y_train)
        accuracy = eval_pipeline.score(X_test, y_test)
        return accuracy
