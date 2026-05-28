from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DocxRedline Worker"
    artifact_ttl_seconds: int = Field(default=900, ge=60)
    max_upload_mb: int = Field(default=25, ge=1)

    model_config = SettingsConfigDict(env_prefix="DOCX_REDLINE_", extra="ignore")


settings = Settings()
