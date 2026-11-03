import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.db.database import init_db
from backend.app.api.v1.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("marketlens")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing MarketLens AI database tables...")
    await init_db()
    logger.info("MarketLens AI backend initialized successfully.")
    yield
    logger.info("MarketLens AI backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "MarketLens AI Backend Engine: Quantitative stock analysis, trend classification, "
        "reproducible ML forecasting, and grounded analytical insights. "
        "Strictly educational and analytical tool, not financial advice."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach API Router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.get("/", tags=["Health & Status"])
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "api_docs": "/docs",
        "version": "1.0.0",
        "disclaimer": settings.LEGAL_DISCLAIMER
    }

@app.get("/health", tags=["Health & Status"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": "ok"
    }

