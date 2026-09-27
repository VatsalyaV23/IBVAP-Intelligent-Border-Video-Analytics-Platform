import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "IBVAP"
    PROJECT_TITLE: str = "IBVAP - C4ISR Border Intelligence Command Center"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR}/ibvap.db"

    # Storage
    STORAGE_DIR: str = str(BASE_DIR / "storage")
    EVIDENCE_DIR: str = str(BASE_DIR / "storage" / "evidence")

    # Security
    JWT_SECRET: str = "ibvap_border_surveillance_c4isr_secret_key_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # AI Configuration
    AI_DEVICE: str = "auto"
    CONFIDENCE_THRESHOLD: float = 0.50
    FACE_MATCHING_ENABLED: bool = False
    PRIVACY_MODE: bool = True

    # Blockchain
    BLOCKCHAIN_MODE: str = "LOCAL_LEDGER"
    BLOCKCHAIN_ENDPOINT: str = ""

    # Retention
    DEFAULT_RETENTION_DAYS: int = 90
    EVIDENCE_RETENTION_DAYS: int = 365
    AUDIT_RETENTION_DAYS: int = 365

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()

# Ensure storage directories exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(settings.EVIDENCE_DIR, exist_ok=True)
