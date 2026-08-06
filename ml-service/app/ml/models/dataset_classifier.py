import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
import numpy as np

class DatasetClassifierModel:
    def __init__(self):
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=10000, lowercase=True)),
            ('clf', LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced'))
        ])

    def fit(self, texts, labels):
        self.pipeline.fit(texts, labels)
        
    def predict(self, column_names, dtypes, n_rows=100, n_cols=5):
        # Format text representation of input
        cols_str = " ".join(str(c) for c in column_names)
        feature_text = f"cols: {cols_str} | rows: {n_rows} | columns_count: {n_cols}"
        
        probs = self.pipeline.predict_proba([feature_text])[0]
        classes = self.pipeline.classes_
        
        max_idx = np.argmax(probs)
        pred_label = classes[max_idx]
        confidence = float(probs[max_idx])
        
        return {
            "dataset_type": pred_label,
            "confidence": round(confidence, 4)
        }

    def evaluate(self, texts, labels):
        X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.2, random_state=42)
        eval_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=10000, lowercase=True)),
            ('clf', LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced'))
        ])
        eval_pipeline.fit(X_train, y_train)
        accuracy = eval_pipeline.score(X_test, y_test)
        return accuracy
