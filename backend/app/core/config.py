from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    APP_NAME: str
    APP_VERSION: str
    HOST: str
    PORT: int
    DEBUG: bool
    GOOGLE_API_KEY: str

    # Supabase credentials
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        extra="ignore",
    )


settings = Settings()