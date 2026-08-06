from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os
import tempfile

from app.services.report.pdf_generator import generate_report
from app.services.analysis.dataset_reader import read_dataset, resolve_file_path
from app.services.analysis.profile import generate_profile, get_column_data_types
from app.services.analysis.statistics import generate_statistics_summary
from app.services.analysis.insights import generate_insights
from app.services.analysis.charts import recommend_charts
from app.services.analysis.quality import detect_quality_issues
from app.services.analysis.business_validation import detect_business_domain

router = APIRouter(prefix="/api/v1", tags=["report"])


class ReportRequest(BaseModel):
    file_path: str
    file_name: str
    project_name: str = 'Dataset Analysis'
    dataset_name: str = ''


@router.post("/generate-report")
async def generate_report_endpoint(request: ReportRequest):
    try:
        resolved_path = resolve_file_path(request.file_path)
        if not os.path.exists(resolved_path):
            raise HTTPException(status_code=404, detail=f"File not found: {request.file_name}")

        import time
        start_time = time.time()

        df = read_dataset(resolved_path, request.file_name)
        column_types = get_column_data_types(df)

        profile_result = generate_profile(df, os.path.getsize(resolved_path), int((time.time() - start_time) * 1000))
        profile = profile_result['profile']
        column_stats = profile_result['column_stats']

        statistics = generate_statistics_summary(df, column_types)
        chart_recommendations = recommend_charts(df, column_types, column_stats)
        insights = generate_insights(df, column_types, column_stats)
        quality = detect_quality_issues(df)
        validation = detect_business_domain(df)

        column_analysis = []
        for cs in column_stats:
            column_analysis.append({
                'columnName': cs.get('column_name', cs.get('columnName', '')),
                'dataType': cs.get('dataType', 'string'),
                'isNumeric': cs.get('isNumeric', False),
                'isCategorical': cs.get('isCategorical', False),
                'missingCount': cs.get('missingCount', 0),
                'missingPercentage': cs.get('missingPercentage', 0),
                'uniqueCount': cs.get('uniqueCount', 0),
            })

        data_quality = {
            'totalRows': profile.get('totalRows', 0),
            'missingValues': profile.get('missingValuesTotal', 0),
            'missingPercentage': float(profile.get('missingPercentage', 0) or 0),
            'duplicateRows': profile.get('duplicateRows', 0),
            'duplicatePercentage': float(profile.get('duplicatePercentage', 0) or 0),
            'numericColumns': profile.get('numericColumns', []),
            'categoricalColumns': profile.get('categoricalColumns', []),
            'dateColumns': profile.get('datetimeColumns', []),
        }

        dataset_summary = {
            'datasetName': request.dataset_name or request.file_name,
            'fileType': request.file_name.split('.')[-1] if '.' in request.file_name else 'unknown',
            'datasetSize': os.path.getsize(resolved_path),
            'totalRows': profile.get('totalRows', 0),
            'totalColumns': profile.get('totalColumns', 0),
            'uploadDate': str(time.time()),
        }

        # Extract sample numeric series for accurate histogram chart generation
        raw_numeric_data = {}
        for col_name, dtype in column_types.items():
            if dtype == 'number':
                try:
                    vals = df[col_name].dropna().head(1000).astype(float).tolist()
                    if vals:
                        raw_numeric_data[col_name] = vals
                except Exception:
                    pass

        analysis_data = {
            'datasetSummary': dataset_summary,
            'columnAnalysis': column_analysis,
            'dataQuality': data_quality,
            'statistics': statistics,
            'chartRecommendations': chart_recommendations,
            'aiInsights': insights,
            'issues': quality.get('issues', []) if quality else [],
            'rawNumericData': raw_numeric_data,
            'businessDomain': validation.get('domain', 'unknown'),
            'isBusiness': validation.get('is_business', False),
            'businessConfidence': validation.get('confidence', 0.0),
        }

        pdf_path = generate_report(
            analysis_data,
            project_name=request.project_name,
            dataset_name=request.dataset_name or request.file_name
        )

        return FileResponse(
            path=pdf_path,
            filename=f"{request.project_name}_report.pdf",
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{request.project_name}_report.pdf"'}
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
