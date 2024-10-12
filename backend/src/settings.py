from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    canvas_api_url: str

    model_config = SettingsConfigDict(env_file=(".env", ".env.local"), env_prefix="hai_")
        


    

settings = Settings()