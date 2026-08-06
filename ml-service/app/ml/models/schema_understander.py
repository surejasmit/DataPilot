import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
import numpy as np

class SchemaUnderstanderModel:
    def __init__(self):
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 5), max_features=15000, lowercase=True)),
            ('clf', LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced'))
        ])

    def fit(self, texts, labels):
        self.pipeline.fit(texts, labels)
        
    def predict(self, column_name: str):
        probs = self.pipeline.predict_proba([str(column_name)])[0]
        classes = self.pipeline.classes_
        
        max_idx = np.argmax(probs)
        pred_label = classes[max_idx]
        confidence = float(probs[max_idx])
        
        return {
            "original": column_name,
            "label": pred_label,
            "confidence": round(confidence, 4)
        }

    def predict_batch(self, column_names: list):
        if not column_names:
            return []
        probs_list = self.pipeline.predict_proba([str(c) for c in column_names])
        classes = self.pipeline.classes_
        
        results = []
        for i, probs in enumerate(probs_list):
            max_idx = np.argmax(probs)
            results.append({
                "original": column_names[i],
                "label": classes[max_idx],
                "confidence": round(float(probs[max_idx]), 4)
            })
        return results

    def evaluate(self, texts, labels):
        X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.2, random_state=42)
        eval_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(analyzer='char_wb', ngram_range=(2, 5), max_features=15000, lowercase=True)),
            ('clf', LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced'))
        ])
        eval_pipeline.fit(X_train, y_train)
        accuracy = eval_pipeline.score(X_test, y_test)
        return accuracy
