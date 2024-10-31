# client to interact with google calendar
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import Resource, build
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from supabase_auth import AsyncGoTrueClient, User

from src.settings import Settings, settings


class ExternalApiError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message

    def __str__(self):
        return f"{self.status_code} {self.message}"

    def __repr__(self):
        return f"{self.__class__.__name__}(status_code={self.status_code}, message={self.message})"


class CanvasApiError(ExternalApiError):
    ...


class GoogleCalendarClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.flow = get_flow()
        self.client: Resource | None = None

    def authenticate(self, code: str):
        self.flow.fetch_token(code=code)
        credentials = self.flow.credentials

        service = build('calendar', 'v3', credentials=credentials)
        if service is None:
            raise ExternalApiError(401, "Unauthorized")
        self.client = service

        return credentials

    async def get_calendar_events(self, calendar_id: str = "primary", time_min: datetime = None,
                                  time_max: datetime = None) -> list[dict[str, Any]]:
        if self.client is None:
            raise ExternalApiError(401, "Unauthorized")
        event_list = self.client.events().list(calendarId=calendar_id, timeMin=time_min, timeMax=time_max).execute()
        if event_list is None:
            raise ExternalApiError(401, "Unauthorized")
        return event_list.get("items", [])


# client to interact with canvas api
class CanvasClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = httpx.AsyncClient(base_url=settings.canvas_api_url,
                                        headers={"Authorization": f"Bearer {settings.canvas_api_token}"})

    async def update_api_token(self, token: str):
        self.client.headers["Authorization"] = f"Bearer {token}"

    async def list_registered_courses(self) -> list[dict[str, Any]]:
        if self.client.headers.get("Authorization") is None:
            raise CanvasApiError(401, "Unauthorized")
        response = await self.client.get("/api/v1/courses?enrollment_type[]=student&enrollment_state[]=active")
        return response.json()

    async def get_upcoming_tasks(self, n_days: int = 7, start_date: datetime = None, end_date: datetime = None) -> list[
        dict[str, Any]]:
        if start_date is None:
            start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=timezone.utc)
        if end_date is None:
            end_date = (datetime.now() + timedelta(days=n_days)).replace(hour=23, minute=59, second=59,
                                                                         microsecond=999999).replace(
                tzinfo=timezone.utc)

        try:
            start_date_str = start_date.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            end_date_str = end_date.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        except ValueError as e:
            raise ValueError(f"Error formatting dates: {str(e)}")
        response = await self.client.get(f"/api/v1/planner/items?start_date={start_date_str}&end_date={end_date_str}")
        if response.status_code != 200:
            raise CanvasApiError(response.status_code, response.text)
        return response.json()




# dependency injection container
class Container:
    def __init__(self, settings: Settings):
        self.google_calendar_client = GoogleCalendarClient(settings)
        self.canvas_client = CanvasClient(settings=settings)
        # self.openai_client = OpenAIClient()


ApplicationContainer = Annotated[Container, Depends(lambda: Container(settings))]


def get_flow():
    return Flow.from_client_secrets_file(
        settings.client_secrets_file,
        scopes=settings.scopes,
        redirect_uri=settings.redirect_uri
    )


GoogleCalendarFlow = Annotated[Flow, Depends(get_flow)]

engine = create_async_engine(settings.database_url)


async def get_session():
    async_session = async_sessionmaker(bind=engine)
    async with async_session() as session:
        yield session


AsyncDBSession = Annotated[AsyncSession, Depends(get_session)]

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="please login by supabase-js to get token"
)
AccessTokenDep = Annotated[str, Depends(reusable_oauth2)]

gotrue_client = AsyncGoTrueClient(url=settings.gotrue_url, headers={"Authorization": f"Bearer {settings.gotrue_anon_key}", "apikey": settings.gotrue_anon_key})


async def get_current_user(access_token: AccessTokenDep) -> User:
    """get current user from access_token and validate same time"""
    if not gotrue_client:
        raise HTTPException(status_code=500, detail="Super client not initialized")

    if not access_token:
        raise HTTPException(status_code=401, detail="Access token not found")

    user_rsp = await gotrue_client.get_user(jwt=access_token)
    if not user_rsp:
        # logging.error("User not found")
        raise HTTPException(status_code=404, detail="User not found")
    return user_rsp.user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def main():
    # from src.application.usecase import list_upcoming_tasks

    # container = Container(settings)
    # assignments = await list_upcoming_tasks(n_days=7, canvas_client=container.canvas_client)
    # print(assignments)
    ...


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
