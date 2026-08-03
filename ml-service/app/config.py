from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_WORKERS: int = 1
    
    NODE_API_URL: str = "http://localhost:5000/api"
    NODE_API_KEY: Optional[str] = None
    
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    MAX_ROWS_FOR_ANALYSIS: int = 100000
    SAMPLE_SIZE: int = 10000
    
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()