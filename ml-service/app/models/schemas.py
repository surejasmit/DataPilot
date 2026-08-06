from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from enum import Enum


class DataType(str, Enum):
    NUMBER = "number"
    STRING = "string"
    DATE = "date"
    BOOLEAN = "boolean"


class FileType(str, Enum):
    CSV = "csv"
    EXCEL = "excel"
    JSON = "json"
    PARQUET = "parquet"


class ColumnProfile(BaseModel):
    column_name: str
    data_type: DataType
    position: int
    missing_count: int
    missing_percentage: float
    unique_count: int
    min_value: Optional[Union[float, str]] = None
    max_value: Optional[Union[float, str]] = None
    mean_value: Optional[float] = None
    median_value: Optional[float] = None
    mode_value: Optional[Union[float, str]] = None
    std_dev: Optional[float] = None
    variance: Optional[float] = None
    q1: Optional[float] = None
    q3: Optional[float] = None
    iqr: Optional[float] = None
    range_value: Optional[float] = None
    is_numeric: bool = False
    is_categorical: bool = False
    is_datetime: bool = False
    is_boolean: bool = False


class DatasetProfile(BaseModel):
    total_rows: int
    total_columns: int
    missing_values_total: int
    missing_percentage: float
    duplicate_rows: int
    duplicate_percentage: float
    empty_columns: int
    numeric_columns: int
    categorical_columns: int
    datetime_columns: int
    boolean_columns: int
    memory_usage_bytes: int
    dataset_size_bytes: int
    dataset_shape: str
    file_encoding: str = "UTF-8"
    processing_time_ms: int
    status: str = "completed"


class StatisticsColumn(BaseModel):
    column_name: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    mean_value: Optional[float] = None
    median_value: Optional[float] = None
    mode_value: Optional[Union[float, str]] = None
    std_dev: Optional[float] = None
    variance: Optional[float] = None
    q1: Optional[float] = None
    q3: Optional[float] = None
    iqr: Optional[float] = None
    range_value: Optional[float] = None
    missing_count: int = 0
    missing_percentage: float = 0.0
    unique_count: int = 0


class ChartRecommendation(BaseModel):
    type: str
    title: str
    columns: List[str]
    reason: str


class Insight(BaseModel):
    type: str
    title: str
    description: str
    details: Dict[str, Any] = {}
    severity: str = "info"
    confidence: int = 0


class QualityIssue(BaseModel):
    type: str
    column: Optional[str] = None
    severity: str
    message: str


class QualityReport(BaseModel):
    total_rows: int
    missing_values: int
    missing_percentage: float
    duplicate_rows: int
    duplicate_percentage: float
    empty_columns: List[str] = []
    constant_columns: List[str] = []
    mixed_type_columns: List[str] = []
    outlier_columns: List[str] = []
    high_cardinality_columns: List[str] = []
    date_columns: List[str] = []
    categorical_columns: List[str] = []
    numeric_columns: List[str] = []
    issues: List[QualityIssue] = []


class AnalysisRequest(BaseModel):
    file_path: str
    file_name: str
    dataset_id: Optional[int] = None
    project_id: Optional[int] = None
    user_id: Optional[int] = None


class AnalysisResponse(BaseModel):
    profile: DatasetProfile
    column_stats: List[ColumnProfile]
    statistics: List[StatisticsColumn]
    chart_recommendations: List[ChartRecommendation]
    insights: List[Insight]
    quality_report: QualityReport
    preview_rows: List[Dict[str, Any]] = []
    processing_time_ms: int
    domain: Optional[str] = None
    is_business: Optional[bool] = None
    business_confidence: Optional[float] = None


class CleaningRequest(BaseModel):
    file_path: str
    file_name: str
    operation: str
    params: Dict[str, Any] = {}


class CleaningOperation(str, Enum):
    REMOVE_MISSING = "remove_missing"
    FILL_MISSING = "fill_missing"
    REMOVE_DUPLICATES = "remove_duplicates"
    TRIM_SPACES = "trim_spaces"
    CONVERT_TYPES = "convert_types"
    NORMALIZE = "normalize"
    STANDARDIZE = "standardize"


class CleaningResponse(BaseModel):
    cleaned_rows: List[Dict[str, Any]]
    columns: List[str]
    removed: int = 0
    fill_value: Optional[Any] = None


class QuestionRequest(BaseModel):
    file_path: str
    file_name: str
    question: str
    dataset_id: Optional[int] = None
    project_id: Optional[int] = None
    user_id: Optional[int] = None


class QuestionResponse(BaseModel):
    answer: str
    confidence: float
    details: Dict[str, Any] = {}
    sources: List[str] = []


class BusinessValidationResponse(BaseModel):
    is_business: bool
    domain: str
    confidence: float
    detected_columns: List[str] = []
    message: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str