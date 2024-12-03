import json
import uuid
from datetime import datetime, timedelta
from typing import Any, Literal, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from openai import AsyncOpenAI
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.application import external_usecase
from src.database.models import Integration, Preference, Task
from src.schema import CourseInfo, GenerateSubtasksOut, SubTaskOut, TaskIn, TaskOut
from src.settings import settings


class TokenNotFoundError(Exception):
    """Exception raised when an integration token is not found."""

    pass


# Dictionary to store cached tokens
_token_cache = {}


def get_cached_token(
    user_id: str, integration_name: str
) -> Optional[tuple[str, str | None]]:
    """Retrieve an integration token from the in-memory cache.

    Args:
        user_id (str): The unique identifier of the user.
        integration_name (str): The name of the integration (e.g., "canvas", "google").

    Returns:
        Optional[tuple[str, str | None]]: Tuple of (token, refresh_token) if found, None otherwise.
    """
    cache_key = (user_id, integration_name)
    return _token_cache.get(cache_key)


def invalidate_token_cache(user_id: str, integration_name: str) -> None:
    """Remove a specific token from the cache.

    Args:
        user_id (str): The unique identifier of the user.
        integration_name (str): The name of the integration to invalidate.
    """
    cache_key = (user_id, integration_name)
    if cache_key in _token_cache:
        del _token_cache[cache_key]


async def get_integration_token(
    session: AsyncSession, user_id: str, integration_name: Literal["canvas", "google"]
) -> tuple[str, str | None]:
    """Retrieve an integration token from cache or database.

    Args:
        session (AsyncSession): The database session.
        user_id (str): The unique identifier of the user.
        integration_name (Literal["canvas", "google"]): The name of the integration.

    Returns:
        tuple[str, str | None]: Tuple containing the integration token and refresh token.

    Raises:
        TokenNotFoundError: If no token is found for the specified integration.
    """
    cached_tokens = get_cached_token(user_id, integration_name)
    if cached_tokens:
        return cached_tokens

    uuid_user_id = uuid.UUID(user_id)
    query = select(Integration).where(
        Integration.user_id == uuid_user_id, Integration.type == integration_name
    )
    result = await session.execute(query)
    token = result.scalar_one_or_none()

    if not token:
        raise TokenNotFoundError(f"No token found for {integration_name}")

    # Cache both tokens
    cache_key = (user_id, integration_name)
    _token_cache[cache_key] = (token.token, token.refresh_token)

    return token.token, token.refresh_token


class CanvasCourse(BaseModel):
    id: int
    name: str
    created_at: str


async def list_canvas_courses(
    session: AsyncSession,
    user_id: str,
) -> list[CanvasCourse]:
    """Retrieve a list of Canvas courses for a user.

    Args:
        session (AsyncSession): The database session.
        user_id (str): The unique identifier of the user.

    Returns:
        list[CanvasCourse]: A list of courses with their details.

    Raises:
        TokenNotFoundError: If no Canvas token is found for the user.
    """
    canvas_token, _ = await get_integration_token(session, user_id, "canvas")
    courses = external_usecase.fetch_canvas_courses(
        canvas_api_url=settings.canvas_api_url, canvas_api_key=canvas_token
    )
    return [CanvasCourse.model_validate(course) for course in courses]


async def get_upcoming_assignments_and_quizzes(
    session: AsyncSession,
    user_id: str,
    n_days: int = 7,
    start_date: str = None,
    end_date: str = None,
    course_id: str = None,
) -> dict[str, list[dict[str, Any]]]:
    """Retrieve upcoming Canvas assignments and quizzes.

    Args:
        session (AsyncSession): The database session.
        user_id (str): The unique identifier of the user.
        n_days (int, optional): Number of days to look ahead. Defaults to 7.
        start_date (str, optional): Start date for the search range. Defaults to None.
        end_date (str, optional): End date for the search range. Defaults to None.

    Returns:
        dict[str, list[dict[str, Any]]]: A dictionary containing lists of upcoming assignments and quizzes.

    Raises:
        TokenNotFoundError: If no Canvas token is found for the user.
    """
    canvas_token, _ = await get_integration_token(session, user_id, "canvas")

    if not start_date:
        start_date_dt = datetime.now()
    else:
        start_date_dt = datetime.strptime(start_date, "%Y-%m-%d")
    if not end_date:
        end_date_dt = start_date_dt + timedelta(days=n_days)
    else:
        end_date_dt = datetime.strptime(end_date, "%Y-%m-%d")

    return external_usecase.fetch_canvas_events(
        canvas_api_url=settings.canvas_api_url,
        canvas_api_key=canvas_token,
        start_date=start_date_dt.isoformat(),
        end_date=end_date_dt.isoformat(),
        course_id=course_id,
    )


class EventIn(BaseModel):
    title: str
    start_time: str
    end_time: str
    description: Optional[str]


class GoogleCalendarEvent(BaseModel):
    id: str
    title: str
    start: datetime
    end: datetime
    description: Optional[str]


class SyncToGoogleCalendarOutput(BaseModel):
    created_events: list[GoogleCalendarEvent]


async def sync_to_google_calendar(
    session: AsyncSession, user_id: str, calendar_id: str, events: str
) -> SyncToGoogleCalendarOutput:
    """Synchronize Canvas events to Google Calendar.

    Args:
        session (AsyncSession): The database session.
        user_id (str): The unique identifier of the user.
        calendar_id (str): The ID of the Google Calendar to sync to.
        events (str): Json String of a list of Canvas events to sync. e.g., '[{"title": "Event 1", "start_time": "2024-11-01T00:00:00Z", "end_time": "2024-11-01T01:00:00Z", "description": "Description of Event 1"}]'

    Returns:
        SyncToGoogleCalendarOutput: List of created Google Calendar events.

    Raises:
        TokenNotFoundError: If no Google token is found for the user.
    """
    google_token_data, refresh_token = await get_integration_token(
        session, user_id, "google"
    )

    credentials = Credentials(
        token=google_token_data,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.gcal_client_id,
        client_secret=settings.gcal_client_secret,
        refresh_token=refresh_token,
    )

    if credentials.expired:
        credentials.refresh(Request())
        await session.execute(
            update(Integration)
            .where(
                Integration.user_id == uuid.UUID(user_id), Integration.type == "google"
            )
            .values(token=credentials.token, refresh_token=credentials.refresh_token)
        )

    created_events = []
    events_dict = json.loads(events)
    events_parsed = [EventIn.model_validate(event) for event in events_dict]
    for event in events_parsed:
        created_event = external_usecase.add_study_schedule_to_google_calendar(
            google_credentials=credentials,
            calendar_id=calendar_id,
            title=event.title,
            description=event.description,
            start_time=event.start_time,
            end_time=event.end_time,
        )
        created_events.append(created_event)

    return SyncToGoogleCalendarOutput.model_validate(
        {"created_events": created_events}
    )


async def get_study_progress(
    session: AsyncSession, user_id: str, course_id: str
) -> list[dict[str, Any]]:
    """Retrieve study progress for a specific course.

    Args:
        session (AsyncSession): The database session.
        user_id (str): The unique identifier of the user.
        course_id (str): The ID of the course to get progress for.

    Returns:
        list[dict[str, Any]]: List of progress data for the specified course.

    Raises:
        TokenNotFoundError: If no Canvas token is found for the user.
    """
    canvas_token, _ = await get_integration_token(session, user_id, "canvas")

    return external_usecase.fetch_study_progress(
        canvas_api_url=settings.canvas_api_url,
        canvas_api_key=canvas_token,
        course_id=course_id,
        user_id=user_id,
    )


async def create_task_from_dict(
    session: AsyncSession, user_id: str, task_dict_str: str
) -> dict[str, Any]:
    """Create a new task from a dictionary.

    Args:
        session (AsyncSession): The database session.
        user_id (str): The unique identifier of the user.
        task_dict_str (str): The task data as a JSON string. (e.g., '{"name": "Task 1", "description": "Description of Task 1", "start_at": "2024-11-01T00:00:00Z", "end_at": "2024-11-01T01:00:00Z", "due_at": "2024-11-01T02:00:00Z", "link": "https://example.com", "type": "ASSIGNMENT"}')

    type: TASK_TYPE (e.g., "ASSIGNMENT", "STUDY", "SOCIAL", "CHORE")

    Returns:
        dict[str, Any]: The created task.
    """
    return await create_task(
        session, user_id, TaskIn.model_validate_json(task_dict_str)
    )


async def create_task(
    session: AsyncSession, user_id: str, task: TaskIn
) -> dict[str, Any]:
    """Create a new task.

    Args:
        session (AsyncSession): The database session.
        user_id (str): The unique identifier of the user.
        task (TaskIn): The task to create.

    Returns:
        dict[str, Any]: The created task.
    """
    task = Task(
        name=task.name,
        description=task.description,
        user_id=user_id,
        start_at=task.start_at,
        end_at=task.end_at,
        due_at=task.due_at,
        link=task.link,
        type=task.type,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return TaskOut.model_validate(task).model_dump(mode="json")


async def list_tasks(
    session: AsyncSession,
    user_id: str,
) -> list[dict[str, Any]]:
    """Retrieve a list of tasks for a user.

    Args:
        session (AsyncSession): The database session.
        user_id (str): The unique identifier of the user.

    Returns:
        list[dict[str, Any]]: List of tasks.
    """
    query = select(Task).where(Task.user_id == uuid.UUID(user_id))
    result = await session.execute(query)
    return [
        TaskOut.model_validate(task).model_dump(mode="json")
        for task in result.scalars().all()
    ]


async def get_task(session: AsyncSession, user_id: str, task_id: int) -> dict[str, Any]:
    """Retrieve a task by its ID.

    Args:
        session (AsyncSession): The database session.
        user_id (str): The unique identifier of the user.
        task_id (int): The ID of the task to retrieve.

    Returns:
        dict[str, Any]: The task.
    """
    query = select(Task).where(Task.user_id == uuid.UUID(user_id), Task.id == task_id)
    result = await session.execute(query)
    return TaskOut.model_validate(result.scalar_one_or_none()).model_dump(mode="json")


async def generate_subtasks(
    openai: AsyncOpenAI,
    session: AsyncSession,
    user_id: str,
    task_name: str,
    course_name: str,
) -> list[SubTaskOut]:
    messages = [
        {
            "role": "system",
            "content": "You are a helpful assistant that breaks down tasks into subtasks. Return a JSON array of subtasks with title, description, and estimated_time fields. Estimated time should be in minutes. Make sure to exclude obvious tasks like 'Read the textbook', 'Submit an assignment', 'Take notes', 'Review for exam', etc. Limit your response upto 5 subtasks.",
        },
        {
            "role": "user",
            "content": f"Break down this task into subtasks: {task_name}"
            + (f" for the course {course_name}" if course_name else ""),
        },
    ]

    response = await openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.7,
    )

    subtasks_data = json.loads(response.choices[0].message.content)

    subtasks = []
    for subtask in subtasks_data["subtasks"]:
        task_out = SubTaskOut(
            title=subtask["title"],
            description=subtask.get("description"),
            estimated_time=subtask.get("estimated_time"),
        )
        subtasks.append(task_out)

    return [task.model_dump(mode="json") for task in subtasks]


async def get_events_on_date(
    session: AsyncSession, user_id: str, date: datetime
) -> list[dict[str, Any]]:
    google_token_data, refresh_token = await get_integration_token(
        session, user_id, "google"
    )
    preference_result = await session.execute(
        select(Preference).where(Preference.user_id == uuid.UUID(user_id))
    )
    preference = preference_result.scalar_one_or_none()
    google_calendar_id = None
    if preference:
        google_calendar_id = preference.primary_calendar

    credentials = Credentials(
        token=google_token_data,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.gcal_client_id,
        client_secret=settings.gcal_client_secret,
        refresh_token=refresh_token,
    )
    start_date = (
        date.replace(hour=0, minute=0, second=0, microsecond=0).isoformat() + "Z"
    )
    end_date = (date + timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    ).isoformat() + "Z"
    return external_usecase.list_google_calendar_events(
        google_credentials=credentials,
        calendar_id="primary",
        start_date=start_date,
        end_date=end_date,
    )
