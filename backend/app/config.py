from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DB_TYPE: Literal["mysql", "sqlite"] = "sqlite"
    DB_USER: str = ''
    DB_PASSWORD: str = ''
    DB_HOST: str = ''
    DB_PORT: int = 0
    DB_NAME: str = ''
    DB_POOL_SIZE: int = 100
    DB_POOL_OVERFLOW: int = 100

    TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    SECRET_KEY: str = "oijahowa6"
    DEFAULT_ADMIN_NAME: str = "Administrator"
    DEFAULT_ADMIN_LOGIN: str = "admin"
    DEFAULT_ADMIN_PASSWORD: str = "admin12345"

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost", "http://localhost:8000"]

    model_config = SettingsConfigDict(env_file='.env')

settings = Settings() # type: ignore