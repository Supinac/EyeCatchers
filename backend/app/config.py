from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_POOL_SIZE: int = 100
    DB_POOL_OVERFLOW: int = 100

    model_config = SettingsConfigDict(env_file='.env')

settings = Settings() # type: ignore