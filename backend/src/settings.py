from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    canvas_api_url: str

    # openai
    openai_api_key: str = Field(default="", env="OPENAI_API_KEY")

    # google calendar
    client_secrets_file: str = Field(default="client_secrets.json", env="GCAL_CLIENT_SECRETS_FILE")
    scopes: list[str] = Field(default=["https://www.googleapis.com/auth/calendar.readonly"], env="GCAL_SCOPES")
    redirect_uri: str = Field(default="http://localhost:8000/oauth2callback", env="GCAL_REDIRECT_URI")

    model_config = SettingsConfigDict(env_file=(".env", ".env.local"), env_prefix="hai_")
        


    

settings = Settings()