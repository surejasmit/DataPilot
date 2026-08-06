import os
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
import numpy as np

class CommandUnderstanderModel:
    def __init__(self):
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 3), max_features=10000, lowercase=True)),
            ('clf', LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced'))
        ])

    def fit(self, texts, labels):
        self.pipeline.fit(texts, labels)
        
    def predict(self, command_text: str, available_columns: list):
        cmd_lower = str(command_text).lower()
        
        # Predict intent
        probs = self.pipeline.predict_proba([cmd_lower])[0]
        classes = self.pipeline.classes_
        
        max_idx = np.argmax(probs)
        intent = classes[max_idx]
        confidence = float(probs[max_idx])
        
        params = {}
        
        # Rule-based entity/slot extraction using available_columns
        # Let's find columns mentioned in the command
        matched_cols = []
        for col in available_columns:
            # Escape regex chars
            col_esc = re.escape(str(col))
            # Match word boundary or exact match
            pattern = rf"\b{col_esc}\b"
            if re.search(pattern, cmd_lower):
                matched_cols.append(col)
                
        # Sort matched_cols by length descending to prevent matching substrings of columns first
        matched_cols.sort(key=len, reverse=True)
        
        if intent == 'REMOVE_COLUMNS':
            # e.g., "remove name, email, phone"
            params['columns'] = matched_cols if matched_cols else []
            
        elif intent == 'FILTER':
            # e.g., "show only sales department" or "filter salary greater than 50000"
            if matched_cols:
                col = matched_cols[0]
                params['column'] = col
                
                # Check for operators
                operator = 'equals'
                operator_symbol = '=='
                if any(x in cmd_lower for x in ['greater than', 'above', 'more than', '>', 'larger than', 'older than']):
                    operator = 'greater_than'
                    operator_symbol = '>'
                elif any(x in cmd_lower for x in ['less than', 'below', 'under', '<', 'smaller than', 'younger than']):
                    operator = 'less_than'
                    operator_symbol = '<'
                elif any(x in cmd_lower for x in ['not equal', 'different from', '!=', 'not']):
                    operator = 'not_equals'
                    operator_symbol = '!='
                    
                params['operator'] = operator
                params['operator_symbol'] = operator_symbol
                
                # Extract value
                # Find column name in text and look for what comes after it / operator
                col_idx = cmd_lower.find(col.lower())
                after_col = cmd_lower[col_idx + len(col):].strip()
                
                # Strip operator keywords
                for kw in ['greater than', 'less than', 'above', 'below', 'under', 'equals', 'is', 'not equal', '!=', '==', '>', '<']:
                    if after_col.startswith(kw):
                        after_col = after_col[len(kw):].strip()
                
                # Remove common ending words
                val = after_col.replace('department', '').replace('region', '').replace('columns', '').replace('column', '').strip()
                # Remove leading/trailing quotes
                val = val.strip('\'" ')
                
                params['value'] = val
            else:
                params['column'] = None
                params['value'] = None
                
        elif intent == 'SORT':
            # e.g., "sort by revenue descending"
            if matched_cols:
                params['column'] = matched_cols[0]
            else:
                params['column'] = None
            
            ascending = True
            if any(x in cmd_lower for x in ['descending', 'desc', 'high to low', 'reverse', 'descending order']):
                ascending = False
            params['ascending'] = ascending
            
        elif intent == 'GROUP_BY':
            # e.g., "group by department"
            if matched_cols:
                params['column'] = matched_cols[0]
            else:
                params['column'] = None
                
        elif intent == 'RENAME_COLUMN':
            # e.g., "rename MonthlyIncome to Salary" or "change name of category to product category"
            # Look for "to" or "as"
            parts = []
            if ' to ' in cmd_lower:
                parts = cmd_lower.split(' to ')
            elif ' as ' in cmd_lower:
                parts = cmd_lower.split(' as ')
                
            if len(parts) >= 2:
                # Part 1 should contain old column name
                old_col = None
                for col in available_columns:
                    if col.lower() in parts[0]:
                        old_col = col
                        break
                # Part 2 should contain new name
                new_col = parts[1].strip().replace('column', '').replace('header', '').replace('"', '').replace("'", "").strip()
                params['column'] = old_col
                params['new_column_name'] = new_col.title()
            else:
                params['column'] = matched_cols[0] if matched_cols else None
                params['new_column_name'] = None
                
        elif intent == 'AGGREGATE':
            # e.g., "calculate average salary"
            if matched_cols:
                params['column'] = matched_cols[0]
            else:
                params['column'] = None
                
            agg_type = 'mean'
            if any(x in cmd_lower for x in ['sum', 'total', 'add']):
                agg_type = 'sum'
            elif any(x in cmd_lower for x in ['max', 'maximum', 'highest', 'top']):
                agg_type = 'max'
            elif any(x in cmd_lower for x in ['min', 'minimum', 'lowest', 'bottom']):
                agg_type = 'min'
            elif any(x in cmd_lower for x in ['median']):
                agg_type = 'median'
            elif any(x in cmd_lower for x in ['std', 'standard deviation']):
                agg_type = 'std'
                
            params['type'] = agg_type
            
        elif intent == 'CONVERT_TYPE':
            # e.g., "convert age to number"
            if matched_cols:
                params['column'] = matched_cols[0]
            else:
                params['column'] = None
                
            target_type = 'string'
            if any(x in cmd_lower for x in ['number', 'integer', 'float', 'numeric', 'int', 'double']):
                target_type = 'number'
            elif any(x in cmd_lower for x in ['date', 'time', 'datetime', 'timestamp']):
                target_type = 'date'
            elif any(x in cmd_lower for x in ['boolean', 'bool', 'true/false']):
                target_type = 'boolean'
                
            params['target_type'] = target_type
            
        elif intent == 'FILL_MISSING':
            # e.g., "replace nulls in salary with mean"
            if matched_cols:
                params['column'] = matched_cols[0]
            else:
                params['column'] = None
                
            method = 'mode'
            if 'mean' in cmd_lower:
                method = 'mean'
            elif 'median' in cmd_lower:
                method = 'median'
            elif 'zero' in cmd_lower or '0' in cmd_lower:
                method = 'zero'
                
            params['method'] = method
            
        elif intent == 'REMOVE_MISSING':
            if matched_cols:
                params['column'] = matched_cols[0]
            else:
                params['column'] = None

        return {
            "intent": intent,
            "params": params,
            "confidence": round(confidence, 4)
        }

    def evaluate(self, texts, labels):
        X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.2, random_state=42)
        eval_pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 3), max_features=10000, lowercase=True)),
            ('clf', LogisticRegression(C=1.0, max_iter=1000, class_weight='balanced'))
        ])
        eval_pipeline.fit(X_train, y_train)
        accuracy = eval_pipeline.score(X_test, y_test)
        return accuracy
