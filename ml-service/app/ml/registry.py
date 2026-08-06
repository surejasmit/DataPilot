import os
import joblib
from typing import Dict, Any, Optional

class ModelRegistry:
    _instance = None
    _models: Dict[str, Any] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelRegistry, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        # Prevent re-initialization
        if not hasattr(self, "_initialized"):
            self._initialized = True
            self.load_models()

    def get_trained_dir(self) -> str:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        trained_dir = os.path.join(base_dir, "trained")
        os.makedirs(trained_dir, exist_ok=True)
        return trained_dir

    def load_models(self):
        trained_dir = self.get_trained_dir()
        model_names = [
            "dataset_classifier",
            "schema_understander",
            "insight_recommender",
            "command_understander",
            "chart_recommender"
        ]
        
        for name in model_names:
            model_path = os.path.join(trained_dir, f"{name}.joblib")
            if os.path.exists(model_path):
                try:
                    self._models[name] = joblib.load(model_path)
                    print(f"[ML Registry] Successfully loaded {name} from {model_path}")
                except Exception as e:
                    print(f"[ML Registry] Failed to load model {name}: {e}")
                    self._models[name] = None
            else:
                self._models[name] = None

    def get_model(self, name: str) -> Optional[Any]:
        return self._models.get(name)

    def register_model(self, name: str, model: Any):
        self._models[name] = model
        trained_dir = self.get_trained_dir()
        model_path = os.path.join(trained_dir, f"{name}.joblib")
        try:
            joblib.dump(model, model_path)
            print(f"[ML Registry] Successfully saved and registered {name} to {model_path}")
        except Exception as e:
            print(f"[ML Registry] Failed to save model {name}: {e}")

    def get_status(self) -> Dict[str, Dict[str, Any]]:
        status = {}
        for name, model in self._models.items():
            status[name] = {
                "trained": model is not None,
                "type": type(model).__name__ if model is not None else None
            }
        return status

# Singleton instance
registry = ModelRegistry()
