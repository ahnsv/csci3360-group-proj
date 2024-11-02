import uuid
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Any, Literal, Optional

from google.oauth2.credentials import Credentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.application import external_usecase
from src.database.models import Integration
from src.settings import settings


class TokenNotFoundError(Exception):
    pass

@lru_cache(maxsize=100)
def get_cached_token(user_id: str, integration_name: str) -> Optional[str]:
    """In-memory cache for integration tokens"""
    return None

def invalidate_token_cache(user_id: str, integration_name: str) -> None:
    """Invalidate specific token from cache"""
    cache_key = (user_id, integration_name)
    if cache_key in get_cached_token.cache_info():
        get_cached_token.cache_delete(cache_key)

async def get_integration_token(
    session: AsyncSession, 
    user_id: str, 
    integration_name: Literal["canvas", "google"]
) -> str:
    """Get integration token from cache or database"""
    # Try cache first
    cached_token = get_cached_token(user_id, integration_name)
    if cached_token:
        return cached_token
    
    # Query database if not in cache
    uuid_user_id = uuid.UUID(user_id)
    query = select(Integration).where(
        Integration.user_id == uuid_user_id,
        Integration.type == integration_name
    )
    result = await session.execute(query)
    token = result.scalar_one_or_none()
    
    if not token:
        raise TokenNotFoundError(f"No token found for {integration_name}")
    
    # Update cache
    get_cached_token.cache_clear()  # Clear old entries
    get_cached_token(user_id, integration_name, token.token)
    
    return token.token

async def list_canvas_courses(
    session: AsyncSession,
    user_id: str,
) -> list[dict[str, Any]]:
    """List user's Canvas courses"""
    canvas_token = await get_integration_token(session, user_id, "canvas")
    return external_usecase.fetch_canvas_courses(
        canvas_api_url=settings.canvas_api_url,
        canvas_api_key=canvas_token
    )

async def get_upcoming_tasks(
    session: AsyncSession,
    user_id: str,
    n_days: int = 7,
    start_date: str = None,
    end_date: str = None,
) -> dict[str, list[dict[str, Any]]]:
    """Get upcoming Canvas assignments and quizzes"""
    canvas_token = await get_integration_token(session, user_id, "canvas")
    
    if not start_date:
        start_date = datetime.now()
    if not end_date:
        end_date = start_date + timedelta(days=n_days)
    
    return external_usecase.fetch_canvas_events(
        canvas_api_url=settings.canvas_api_url,
        canvas_api_key=canvas_token,
        start_date=start_date.isoformat(),
        end_date=end_date.isoformat()
    )

async def sync_to_google_calendar(
    session: AsyncSession,
    user_id: str,
    calendar_id: str,
    events: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Sync Canvas events to Google Calendar"""
    google_token_data = await get_integration_token(session, user_id, "google")
    
    # TODO: add to settings
    credentials = Credentials(
        token=google_token_data,
        token_uri="https://oauth2.googleapis.com/token",
        client_id="460439433284-vq7se4q0innu4lg4vvs075a2o0o8juds.apps.googleusercontent.com",
        client_secret="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",
    )
    
    created_events = []
    for event in events:
        created_event = external_usecase.add_study_schedule_to_google_calendar(
            google_credentials=credentials,
            calendar_id=calendar_id,
            title=event["title"],
            description=event.get("description", ""),
            start_time=event["due_at"],  # Assuming due_at is in RFC3339 format
            end_time=event["due_at"],    # You might want to add duration
        )
        created_events.append(created_event)
    
    return created_events

async def get_study_progress(
    session: AsyncSession,
    user_id: str,
    course_id: str
) -> list[dict[str, Any]]:
    """Get user's study progress for a specific course"""
    canvas_token = await get_integration_token(session, user_id, "canvas")
    
    return external_usecase.fetch_study_progress(
        canvas_api_url=settings.canvas_api_url,
        canvas_api_key=canvas_token,
        course_id=course_id,
        user_id=user_id
    ) 