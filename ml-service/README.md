# DataPilot ML Analysis Service

Python FastAPI service for dataset analysis, profiling, statistics, insights, and ML recommendations.

## Features

- **Dataset Reading**: CSV, Excel (.xlsx, .xls), JSON
- **Dataset Profiling**: Column types, missing values, duplicates, statistics
- **Statistical Analysis**: Mean, median, mode, std dev, quartiles, correlations
- **Insight Generation**: Automatic insights about data patterns, distributions, quality issues
- **Chart Recommendations**: Intelligent chart type suggestions based on data types
- **Data Cleaning**: Missing value handling, duplicate removal, type conversion, normalization
- **Question Answering**: Natural language questions about the dataset
- **Quality Reports**: Comprehensive data quality assessment

## API Endpoints

### Analysis
- `POST /api/v1/analyze` - Full dataset analysis
- `POST /api/v1/analyze/upload` - Upload and analyze file
- `GET /api/v1/profile` - Get dataset profile
- `GET /api/v1/statistics` - Get column statistics
- `GET /api/v1/insights` - Get generated insights
- `GET /api/v1/quality` - Get quality report
- `GET /api/v1/preview` - Get data preview
- `GET /api/v1/columns` - Get column information
- `GET /api/v1/charts/recommendations` - Get chart recommendations
- `GET /api/v1/correlation` - Get correlation analysis

### Cleaning
- `POST /api/v1/clean` - Perform cleaning operation

### Question Answering
- `POST /api/v1/question` - Ask question about dataset
- `POST /api/v1/suggest-questions` - Get suggested questions

### Health
- `GET /health` - Health check
- `GET /` - Service info

## Request/Response Examples

### Analyze Dataset
```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "/path/to/dataset.csv",
    "file_name": "dataset.csv",
    "dataset_id": 1,
    "project_id": 1,
    "user_id": 1
  }'
```

### Ask Question
```bash
curl -X POST "http://localhost:8000/api/v1/question" \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "/path/to/dataset.csv",
    "file_name": "dataset.csv",
    "question": "What is the average of sales?",
    "dataset_id": 1
  }'
```

### Clean Data
```bash
curl -X POST "http://localhost:8000/api/v1/clean" \
  -H "Content-Type: application/json" \
  -d '{
    "file_path": "/path/to/dataset.csv",
    "file_name": "dataset.csv",
    "operation": "fill_missing",
    "params": {"method": "mean"}
  }'
```

## Running Locally

### Prerequisites
- Python 3.11+
- pip

### Installation
```bash
cd ml-service
pip install -r requirements.txt
```

### Environment Variables
Copy `.env.example` to `.env` and configure:
```
API_HOST=0.0.0.0
API_PORT=8000
NODE_API_URL=http://localhost:5000/api
MAX_FILE_SIZE=104857600
MAX_ROWS_FOR_ANALYSIS=100000
LOG_LEVEL=INFO
```

### Run
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Or simply:
```bash
python -m app.main
```

## Running with Docker

```bash
docker-compose up -d
```

## Architecture

```
ml-service/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration settings
│   ├── models/
│   │   └── schemas.py          # Pydantic models
│   ├── routes/
│   │   └── analysis.py         # API routes
│   ├── services/
│   │   └── analysis/
│   │       ├── __init__.py     # Main analysis orchestrator
│   │       ├── dataset_reader.py   # File reading (CSV, Excel, JSON)
│   │       ├── profile.py          # Dataset profiling
│   │       ├── statistics.py       # Statistical computations
│   │       ├── insights.py         # Insight generation
│   │       ├── charts.py           # Chart recommendations
│   │       ├── cleaning.py         # Data cleaning operations
│   │       ├── correlation.py      # Correlation analysis
│   │       ├── quality.py          # Quality reporting
│   │       └── question_answer.py  # Question answering
│   └── utils/
└── requirements.txt
```

## Single Responsibility Principle

Each module has a single responsibility:
- `dataset_reader.py` - Only reads datasets
- `profile.py` - Only generates dataset profiles
- `statistics.py` - Only calculates statistics
- `insights.py` - Only generates insights
- `charts.py` - Only recommends charts
- `cleaning.py` - Only performs cleaning operations
- `correlation.py` - Only computes correlations
- `quality.py` - Only detects quality issues
- `question_answer.py` - Only answers questions

## Integration with Node.js Backend

The Node.js backend calls this service via HTTP:
- Base URL: `http://localhost:8000/api/v1` (or `http://ml-service:8000/api/v1` in Docker)
- Timeout: 5 minutes for large datasets
- Authentication: None (internal service communication)

## Future Extensions

- ML model training and inference
- RAG (Retrieval-Augmented Generation) for dataset QA
- Time series forecasting
- Anomaly detection
- Feature engineering pipelines