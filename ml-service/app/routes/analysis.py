from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import json

from app.models.schemas import AnalysisRequest, AnalysisResponse, QuestionRequest, QuestionResponse, CleaningRequest, CleaningResponse
from app.services.analysis.dataset_reader import read_dataset, get_preview_rows, get_columns_info, infer_data_type, resolve_file_path
from app.services.analysis.profile import generate_profile, get_column_data_types
from app.services.analysis.statistics import compute_column_statistics, generate_statistics_summary, compute_distribution_analysis, compute_correlation_matrix
from app.services.analysis.insights import generate_insights
from app.services.analysis.charts import recommend_charts, get_chart_data
from app.services.analysis.question_answer import answer_question, generate_suggested_questions, clean_dataset
from app.services.analysis.quality import detect_quality_issues

router = APIRouter(prefix="/api/v1", tags=["analysis"])


def _analyze_dataset(file_path: str, file_name: str, max_rows: int = None) -> Dict[str, Any]:
    import os
    import time
    
    file_path = resolve_file_path(file_path)
    start_time = time.time()
    
    df = read_dataset(file_path, file_name)
    if max_rows and len(df) > max_rows:
        df = df.head(max_rows)
    
    column_types = get_column_data_types(df)
    
    profile_result = generate_profile(df, os.path.getsize(file_path), int((time.time() - start_time) * 1000))
    profile = profile_result['profile']
    column_stats = profile_result['column_stats']
    
    statistics = generate_statistics_summary(df, column_types)
    
    chart_recommendations = recommend_charts(df, column_types, column_stats)
    
    insights = generate_insights(df, column_types, column_stats)
    
    quality = detect_quality_issues(df)
    
    preview_rows = get_preview_rows(df, limit=100)
    
    processing_time = int((time.time() - start_time) * 1000)
    
    return {
        'profile': profile,
        'column_stats': column_stats,
        'statistics': statistics,
        'chart_recommendations': chart_recommendations,
        'insights': insights,
        'quality_report': quality,
        'preview_rows': preview_rows,
        'processing_time_ms': processing_time
    }


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_dataset_endpoint(request: AnalysisRequest):
    try:
        result = _analyze_dataset(request.file_path, request.file_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/upload")
async def analyze_upload_endpoint(
    file: str,
    file_name: str,
    dataset_id: int = None,
    project_id: int = None,
    user_id: int = None
):
    try:
        result = _analyze_dataset(file, file_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clean", response_model=CleaningResponse)
async def clean_dataset_endpoint(request: CleaningRequest):
    try:
        result = clean_dataset(request.file_path, request.file_name, request.operation, request.params)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/question", response_model=QuestionResponse)
async def ask_question_endpoint(request: QuestionRequest):
    try:
        result = answer_question(request.file_path, request.file_name, request.question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest-questions")
async def suggest_questions_endpoint(request: AnalysisRequest):
    try:
        df = read_dataset(request.file_path, request.file_name)
        column_types = {col: infer_data_type(df[col]) for col in df.columns}
        questions = generate_suggested_questions(df, column_types)
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chart")
async def get_chart_endpoint(
    file_path: str,
    file_name: str,
    chart_type: str,
    columns: str
):
    try:
        col_list = json.loads(columns)
        result = get_chart_data(file_path, file_name, chart_type, col_list)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile")
async def get_profile_endpoint(file_path: str, file_name: str):
    try:
        df = read_dataset(file_path, file_name)
        column_types = get_column_data_types(df)
        import os
        import time
        profile_result = generate_profile(df, os.path.getsize(file_path), int(time.time() * 1000))
        return profile_result['profile']
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics")
async def get_statistics_endpoint(file_path: str, file_name: str):
    try:
        df = read_dataset(file_path, file_name)
        column_types = get_column_data_types(df)
        stats = generate_statistics_summary(df, column_types)
        return {"statistics": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights")
async def get_insights_endpoint(file_path: str, file_name: str):
    try:
        df = read_dataset(file_path, file_name)
        column_types = get_column_data_types(df)
        column_stats = []
        for col in df.columns:
            stats = compute_column_statistics(df[col], column_types[col])
            stats['column_name'] = col
            column_stats.append(stats)
        insights = generate_insights(df, column_types, column_stats)
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/quality")
async def get_quality_endpoint(file_path: str, file_name: str):
    try:
        df = read_dataset(file_path, file_name)
        quality = detect_quality_issues(df)
        return quality
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/preview")
async def get_preview_endpoint(file_path: str, file_name: str, limit: int = 100):
    try:
        df = read_dataset(file_path, file_name)
        preview = get_preview_rows(df, limit=limit)
        return {"rows": preview}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/columns")
async def get_columns_endpoint(file_path: str, file_name: str):
    try:
        df = read_dataset(file_path, file_name)
        columns = get_columns_info(df)
        return {"columns": columns}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/charts/recommendations")
async def get_chart_recommendations_endpoint(file_path: str, file_name: str):
    try:
        df = read_dataset(file_path, file_name)
        column_types = get_column_data_types(df)
        column_stats = []
        for col in df.columns:
            stats = compute_column_statistics(df[col], column_types[col])
            stats['column_name'] = col
            column_stats.append(stats)
        recommendations = recommend_charts(df, column_types, column_stats)
        return {"recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/correlation")
async def get_correlation_endpoint(file_path: str, file_name: str):
    try:
        df = read_dataset(file_path, file_name)
        column_types = get_column_data_types(df)
        numeric_cols = [c for c, t in column_types.items() if t == 'number']
        from app.services.analysis.correlation import compute_pearson_correlation, compute_spearman_correlation, compute_correlation_matrix
        pearson = compute_pearson_correlation(df, numeric_cols)
        spearman = compute_spearman_correlation(df, numeric_cols)
        matrix = compute_correlation_matrix(df, numeric_cols)
        return {
            "pearson": pearson,
            "spearman": spearman,
            "matrix": matrix
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))