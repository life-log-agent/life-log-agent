from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str
    supabase_storage_bucket: str = "life-log-images"

    # Database
    database_url: str  # postgresql+asyncpg://...

    # Clova Studio
    clova_api_key: str
    clova_api_secret: str
    clova_api_url: str = "https://clovastudio.stream.ntruss.com"
    clova_api_path_prefix: str = "/v3"

    # App
    backend_cors_origins: str = "http://localhost:5173"
    embedding_dim: int = 1024

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.backend_cors_origins.split(",")]

    @property
    def clova_base_url(self) -> str:
        return self.clova_api_url.rstrip("/") + self.clova_api_path_prefix


settings = Settings()  # type: ignore[call-arg]
