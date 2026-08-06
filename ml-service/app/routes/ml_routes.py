from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.ml.registry import registry

router = APIRouter(prefix="/api/v1/ml", tags=["ml"])

class ClassifyRequest(BaseModel):
    column_names: List[str]
    dtypes: Optional[List[str]] = []
    n_rows: Optional[int] = 100
    n_cols: Optional[int] = 5

class CommandRequest(BaseModel):
    command_text: str
    available_columns: List[str]

class SchemaRequest(BaseModel):
    column_names: List[str]

# Simple training helper
def run_training_task():
    from app.ml.train import (
        train_dataset_classifier,
        train_schema_understander,
        train_insight_recommender,
        train_command_understander,
        train_chart_recommender
    )
    try:
        train_dataset_classifier()
        train_schema_understander()
        train_insight_recommender()
        train_command_understander()
        train_chart_recommender()
        print("[ML Training] Successfully trained all models in background task.")
    except Exception as e:
        print(f"[ML Training] Error in background training task: {e}")

@router.post("/train")
async def trigger_training(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_training_task)
    return {"message": "Model training triggered in background successfully.", "status": "processing"}

@router.get("/status")
async def get_ml_status():
    try:
        registry.load_models()
        return registry.get_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/classify")
async def predict_classify(request: ClassifyRequest):
    model = registry.get_model("dataset_classifier")
    if model is None:
        raise HTTPException(status_code=400, detail="dataset_classifier model is not trained/available.")
    try:
        res = model.predict(request.column_names, request.dtypes, request.n_rows, request.n_cols)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/command")
async def predict_command(request: CommandRequest):
    model = registry.get_model("command_understander")
    if model is None:
        raise HTTPException(status_code=400, detail="command_understander model is not trained/available.")
    try:
        res = model.predict(request.command_text, request.available_columns)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict/schema")
async def predict_schema(request: SchemaRequest):
    model = registry.get_model("schema_understander")
    if model is None:
        raise HTTPException(status_code=400, detail="schema_understander model is not trained/available.")
    try:
        res = model.predict_batch(request.column_names)
        return {"predictions": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
