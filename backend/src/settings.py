from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    canvas_api_url: str
    canvas_api_token: str

    # gotrue
    gotrue_url: str
    gotrue_anon_key: str

    # database
    database_url: str

    # openai
    openai_api_key: str

    # google calendar
    client_secrets_file: str = Field(
        default="client_secrets.json", alias="GCAL_CLIENT_SECRETS_FILE"
    )
    gcal_client_id: str = Field(alias="GCAL_CLIENT_ID")
    gcal_client_secret: str = Field(alias="GCAL_CLIENT_SECRET")
    scopes: list[str] = Field(
        default=[
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/calendar.readonly",
            "openid",
        ],
        alias="GCAL_SCOPES",
    )
    redirect_uri: str = Field(
        default="http://localhost:8000/auth/google/oauth2callback",
        alias="GCAL_REDIRECT_URI",
    )

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"), env_prefix="hai_"
    )


settings = Settings()
