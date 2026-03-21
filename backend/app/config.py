from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DB_USER: str = 'eyecatchers'
    DB_PASSWORD: str = 'eyecatchers'
    DB_HOST: str = 'eyecatchers'
    DB_PORT: int = 3306
    DB_NAME: str = 'eyecatchers'
    DB_POOL_SIZE: int = 100
    DB_POOL_OVERFLOW: int = 100

    TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    SECRET_KEY: str = "oijahowa6"
    DEFAULT_ADMIN_NAME: str = "Administrator"
    DEFAULT_ADMIN_LOGIN: str = "admin"
    DEFAULT_ADMIN_PASSWORD: str = "admin12345"

    model_config = SettingsConfigDict(env_file='.env')

settings = Settings() # type: ignore