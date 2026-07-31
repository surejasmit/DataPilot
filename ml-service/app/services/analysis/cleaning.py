import pandas as pd
import numpy as np
from typing import Dict, Any, List
from app.services.analysis.dataset_reader import infer_data_type


class DataCleaner:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self.columns = df.columns.tolist()
        self.operations_log = []
    
    def remove_missing_values(self) -> Dict[str, Any]:
        original_len = len(self.df)
        self.df = self.df.dropna()
        removed = original_len - len(self.df)
        self.operations_log.append({'operation': 'remove_missing', 'removed': removed})
        return {'cleaned': self.df.to_dict(orient='records'), 'removed': removed}
    
    def fill_missing_values(self, method: str = 'mode') -> Dict[str, Any]:
        fill_values = {}
        for col in self.columns:
            series = self.df[col]
            non_null = series.dropna()
            if len(non_null) == 0:
                continue
            
            numeric_vals = pd.to_numeric(non_null, errors='coerce').dropna()
            
            if method == 'mean' and len(numeric_vals) > 0:
                fill_val = numeric_vals.mean()
            elif method == 'median' and len(numeric_vals) > 0:
                fill_val = numeric_vals.median()
            else:
                mode_val = non_null.mode()
                fill_val = mode_val.iloc[0] if len(mode_val) > 0 else ''
            
            self.df[col] = series.fillna(fill_val)
            fill_values[col] = fill_val
        
        self.operations_log.append({'operation': 'fill_missing', 'method': method, 'fill_values': fill_values})
        return {'cleaned': self.df.to_dict(orient='records'), 'fill_values': fill_values}
    
    def remove_duplicate_rows(self) -> Dict[str, Any]:
        original_len = len(self.df)
        self.df = self.df.drop_duplicates()
        removed = original_len - len(self.df)
        self.operations_log.append({'operation': 'remove_duplicates', 'removed': removed})
        return {'cleaned': self.df.to_dict(orient='records'), 'removed': removed}
    
    def trim_spaces(self) -> Dict[str, Any]:
        for col in self.columns:
            if self.df[col].dtype == 'object':
                self.df[col] = self.df[col].astype(str).str.strip()
        self.operations_log.append({'operation': 'trim_spaces'})
        return {'cleaned': self.df.to_dict(orient='records')}
    
    def convert_data_types(self, column_types: Dict[str, str]) -> Dict[str, Any]:
        converted = {}
        for col, target_type in column_types.items():
            if col not in self.columns:
                continue
            if target_type == 'number':
                self.df[col] = pd.to_numeric(self.df[col], errors='coerce')
            elif target_type == 'string':
                self.df[col] = self.df[col].astype(str)
            elif target_type == 'date':
                self.df[col] = pd.to_datetime(self.df[col], errors='coerce')
            elif target_type == 'boolean':
                self.df[col] = self.df[col].astype(bool)
            converted[col] = target_type
        
        self.operations_log.append({'operation': 'convert_types', 'converted': converted})
        return {'cleaned': self.df.to_dict(orient='records'), 'converted': converted}
    
    def normalize_data(self, columns: List[str]) -> Dict[str, Any]:
        normalized = {}
        for col in columns:
            if col not in self.columns:
                continue
            vals = pd.to_numeric(self.df[col], errors='coerce').dropna()
            if len(vals) == 0:
                continue
            min_val = vals.min()
            max_val = vals.max()
            range_val = max_val - min_val
            if range_val == 0:
                continue
            self.df[col] = pd.to_numeric(self.df[col], errors='coerce').apply(
                lambda x: (x - min_val) / range_val if pd.notna(x) else x
            )
            normalized[col] = {'min': min_val, 'max': max_val}
        
        self.operations_log.append({'operation': 'normalize', 'normalized': normalized})
        return {'cleaned': self.df.to_dict(orient='records'), 'normalized': normalized}
    
    def standardize_data(self, columns: List[str]) -> Dict[str, Any]:
        standardized = {}
        for col in columns:
            if col not in self.columns:
                continue
            vals = pd.to_numeric(self.df[col], errors='coerce').dropna()
            if len(vals) == 0:
                continue
            mean = vals.mean()
            std = vals.std()
            if std == 0:
                continue
            self.df[col] = pd.to_numeric(self.df[col], errors='coerce').apply(
                lambda x: (x - mean) / std if pd.notna(x) else x
            )
            standardized[col] = {'mean': mean, 'std': std}
        
        self.operations_log.append({'operation': 'standardize', 'standardized': standardized})
        return {'cleaned': self.df.to_dict(orient='records'), 'standardized': standardized}
    
    def get_cleaned_data(self) -> pd.DataFrame:
        return self.df


def perform_cleaning(df: pd.DataFrame, operation: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
    cleaner = DataCleaner(df)
    
    if params is None:
        params = {}
    
    if operation == 'remove_missing':
        return cleaner.remove_missing_values()
    elif operation == 'fill_missing':
        return cleaner.fill_missing_values(params.get('method', 'mode'))
    elif operation == 'remove_duplicates':
        return cleaner.remove_duplicate_rows()
    elif operation == 'trim_spaces':
        return cleaner.trim_spaces()
    elif operation == 'convert_types':
        return cleaner.convert_data_types(params.get('column_types', {}))
    elif operation == 'normalize':
        return cleaner.normalize_data(params.get('columns', []))
    elif operation == 'standardize':
        return cleaner.standardize_data(params.get('columns', []))
    else:
        raise ValueError(f"Unknown cleaning operation: {operation}")