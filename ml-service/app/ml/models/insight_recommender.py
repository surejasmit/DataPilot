import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multioutput import MultiOutputClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
import numpy as np

class InsightRecommenderModel:
    def __init__(self, classes=None):
        self.classes = classes or []
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, lowercase=True)),
            ('clf', MultiOutputClassifier(LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced')))
        ])

    def fit(self, texts, labels_binary_matrix, classes=None):
        if classes:
            self.classes = classes
        self.pipeline.fit(texts, np.array(labels_binary_matrix))
        
    def predict(self, domain: str, column_names: list, column_types: dict = None):
        cols_str = " ".join(str(c) for c in column_names)
        feature_text = f"domain: {domain} | columns: {cols_str}"
        
        # Predict probability for each output label
        probs_matrix = self.pipeline.predict_proba([feature_text])
        
        recommendations = []
        for idx, cls_name in enumerate(self.classes):
            # For each classifier, probs_matrix[idx] is a 2D array of shape (1, 2)
            # representing [P(class=0), P(class=1)]
            prob_active = float(probs_matrix[idx][0][1])
            recommendations.append({
                "insight": cls_name,
                "confidence": round(prob_active, 4)
            })
            
        # Sort recommendations by confidence descending
        recommendations.sort(key=lambda x: x['confidence'], reverse=True)
        return recommendations

    def evaluate(self, texts, labels_binary_matrix):
        X_train, X_test, y_train, y_test = train_test_split(texts, np.array(labels_binary_matrix), test_size=0.2, random_state=42)
        eval_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, lowercase=True)),
            ('clf', MultiOutputClassifier(LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced')))
        ])
        eval_pipeline.fit(X_train, y_train)
        predictions = eval_pipeline.predict(X_test)
        
        # Hamming loss or exact match accuracy
        exact_match = np.all(predictions == y_test, axis=1).mean()
        hamming_acc = 1.0 - (predictions != y_test).mean()
        return exact_match, hamming_acc
