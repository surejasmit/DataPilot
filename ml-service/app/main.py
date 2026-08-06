from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routes import analysis
from app.routes import report
from app.routes import ml_routes
from app.ml.registry import registry


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting {settings.API_HOST}:{settings.API_PORT}")
    try:
        # Load ML models on startup
        registry.load_models()
        print("[Lifespan] Loaded available ML models.")
    except Exception as e:
        print(f"[Lifespan] Error loading ML models: {e}")
    yield
    print("Shutting down")


app = FastAPI(
    title="DataPilot AI - Business Analytics Platform",
    description="Python FastAPI service for business data analysis, profiling, domain-specific insights, and ML-powered business analytics",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router)
app.include_router(report.router)
app.include_router(ml_routes.router)


@app.get("/")
@app.get("/health")
@app.get("/api/v1/health")
async def root():
    return {
        "service": "DataPilot AI - Business Analytics Platform",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "capabilities": ["business_validation", "domain_insights", "kpi_analysis", "pdf_reports"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        workers=settings.API_WORKERS,
        log_level=settings.LOG_LEVEL.lower()
    )