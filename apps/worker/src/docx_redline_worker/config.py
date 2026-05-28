from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DocxRedline Worker"
    artifact_ttl_seconds: int = Field(default=900, ge=60)
    max_upload_mb: int = Field(default=25, ge=1)
    cors_allow_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )
    cors_allow_origin_regex: str = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

    model_config = SettingsConfigDict(env_prefix="DOCX_REDLINE_", extra="ignore")


settings = Settings()
