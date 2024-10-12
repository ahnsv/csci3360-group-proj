# client to interact with google calendar
from datetime import datetime, timezone, timedelta  
from typing import Annotated, Any
from fastapi import Depends
from google.oauth2 import service_account
import httpx
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
    ...

# client to interact with canvas api
class CanvasClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = httpx.AsyncClient(base_url=settings.canvas_api_url)

    async def update_api_token(self, token: str):
        self.client.headers["Authorization"] = f"Bearer {token}"

    async def list_registered_courses(self) -> list[dict[str, Any]]:
        response = await self.client.get("/api/v1/courses?enrollment_type[]=student&enrollment_state[]=active")
        return response.json()


    async def get_upcoming_assignments(self, n_days: int = 7, start_date: datetime = None, end_date: datetime = None) -> list[dict[str, Any]]:
        if start_date is None:
            start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=timezone.utc)
        if end_date is None:
            end_date = (datetime.now() + timedelta(days=n_days)).replace(hour=23, minute=59, second=59, microsecond=999999).replace(tzinfo=timezone.utc)

        try:
            start_date_str = start_date.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            end_date_str = end_date.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        except ValueError as e:
            raise ValueError(f"Error formatting dates: {str(e)}")
        response = await self.client.get(f"/api/v1/planner/items?start_date={start_date_str}&end_date={end_date_str}")
        if response.status_code != 200:
            raise CanvasApiError(response.status_code, response.text)
        return response.json()

# client to interact with openai api
class OpenAIClient:
    ...

# dependency injection container
class Container:
    def __init__(self, settings: Settings):
        self.google_calendar_client = GoogleCalendarClient()
        self.canvas_client = CanvasClient(settings=settings)
        self.openai_client = OpenAIClient()


container = Annotated[Container, Depends(lambda: Container(settings))]


# async def main():
#     container = Container(settings)
#     await container.canvas_client.update_api_token("")
#     assignments = await container.canvas_client.get_upcoming_assignments()
#     print(assignments)

# if __name__ == "__main__":
#     import asyncio
#     asyncio.run(main())