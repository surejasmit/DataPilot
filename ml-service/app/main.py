from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routes import analysis
from app.routes import report


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting {settings.API_HOST}:{settings.API_PORT}")
    yield
    print("Shutting down")


app = FastAPI(
    title="DataPilot ML Analysis Service",
    description="Python FastAPI service for dataset analysis, profiling, insights, and ML",
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


@app.get("/")
@app.get("/health")
@app.get("/api/v1/health")
async def root():
    return {
        "service": "DataPilot ML Analysis Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
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