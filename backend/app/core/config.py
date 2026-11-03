from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "MarketLens AI"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./marketlens.db"
    SYNC_DATABASE_URL: str = "sqlite:///./marketlens.db"
    
    # Cache settings
    CACHE_EXPIRATION_SECONDS: int = 300  # 5 minutes for live intraday data
    HISTORICAL_CACHE_EXPIRATION_SECONDS: int = 86400  # 24 hours for closed history
    
    # AI / LLM configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")  # "gemini", "openai", or "offline"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Mandatory Disclaimer
    LEGAL_DISCLAIMER: str = (
        "MarketLens AI is an educational and analytical tool only, NOT financial advice. "
        "All calculations, trend signals, and forecasts are probabilistic models based on historical data "
        "and do not guarantee future returns. Always perform your own due diligence."
    )

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

