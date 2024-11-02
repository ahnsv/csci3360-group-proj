from typing import Any  # noqa

from canvasapi import Canvas
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def fetch_canvas_courses(canvas_api_url: str, canvas_api_key: str, **kwargs):
    """
    Fetches all courses from user's Canvas.

    Args:
        canvas_api_url (str): API URL of Canvas instance
        canvas_api_key (str): User's Canvas API key
        **kwargs: Additional keyword arguments

    Returns:
        list[dict[str, Any]]: List of course dictionaries containing id, name, and created_at
    """
    if not kwargs:
        kwargs = {"enrollment_state": "active", "enrollment_type": "student"}
    canvas = Canvas(canvas_api_url, canvas_api_key)
    courses = canvas.get_courses(**kwargs)
    return [
        {
            "id": course.id,
            "name": course.name,
            "created_at": course.created_at,
            # "start_at": course.start_at,
            # "end_at": course.end_at,
        }
        for course in courses
    ]



def fetch_canvas_events_by_course(
    canvas_api_url: str, canvas_api_key: str, course_id: str
):
    """
    Fetches assignments and exam schedules from user's Canvas.

    Args:
        canvas_api_url (str): API URL of Canvas instance
        canvas_api_key (str): User's Canvas API key
        course_id (str): Course ID

    Returns:
        list[dict[str, str]]: List of event dictionaries containing title, description, due_at, and html_url
    """
    canvas = Canvas(canvas_api_url, canvas_api_key)
    course = canvas.get_course(course_id)
    assignments = course.get_assignments()
    events = []
    for assignment in assignments:
        events.append(
            {
                "title": assignment.name,
                "description": assignment.description,
                "due_at": assignment.due_at,
                "html_url": assignment.html_url,
            }
        )
    return events


def fetch_canvas_events(
    canvas_api_url: str, canvas_api_key: str, start_date: str, end_date: str
):
    """
    Fetches all assignments and exam schedules from user's Canvas.

    Args:
        canvas_api_url (str): API URL of Canvas instance
        canvas_api_key (str): User's Canvas API key
        start_date (str): Start date (RFC3339 format)
        end_date (str): End date (RFC3339 format)

    Returns:
        dict[str, list[dict[str, Any]]]: Dictionary containing 'assignments' and 'quizzes' lists
            Each list contains dictionaries with title, due_at, course_name, course_id, and html_url
    """
    import requests

    url = f"{canvas_api_url}/api/v1/planner/items?start_date={start_date}&end_date={end_date}"
    headers = {"Authorization": f"Bearer {canvas_api_key}"}
    response = requests.get(url, headers=headers)
    planner_items = response.json()
    assignments = []
    quizzes = []
    for item in planner_items:
        if item["plannable_type"] == "assignment":
            assignments.append(
                {
                    "title": item["plannable"]["title"],
                    "due_at": item["plannable"]["due_at"],
                    "course_name": item["context_name"],
                    "course_id": item["course_id"],
                    "html_url": item["html_url"],
                }
            )
        elif item["plannable_type"] == "quiz":
            quizzes.append(
                {
                    "title": item["plannable"]["title"],
                    "due_at": item["plannable"]["due_at"],
                    "course_name": item["context_name"],
                    "course_id": item["course_id"],
                    "html_url": item["html_url"],
                    "type": "quiz",
                }
            )
        else:
            print(f"Unknown plannable type: {item['plannable_type']}")
    return {"assignments": assignments, "quizzes": quizzes}

def fetch_canvas_modules_or_files(
    canvas_api_url: str, canvas_api_key: str, course_id: str, **kwargs
):
    """
    Fetches modules or files from user's Canvas.

    Parameters:
    - canvas_api_url: API URL of Canvas instance
    - canvas_api_key: User's Canvas API key
    - course_id: Course ID
    - kwargs: Additional keyword arguments

    Returns:
    - modules: List of modules
    - files: List of files
    """
    canvas = Canvas(canvas_api_url, canvas_api_key)
    course = canvas.get_course(course_id)
    files = course.get_files(course_id=course_id, **kwargs)
    if not files:
        modules = course.get_modules(course_id=course_id, **kwargs)
        module_items = course.get_module_items(module_id=modules[0].id, **kwargs) # TODO: handle multiple modules
        return module_items
    else:
        return files


def list_google_calendars(google_credentials: Credentials):
    """
    Lists all available Google Calendars for the authenticated user.

    Parameters:
    - google_credentials: User's Google OAuth2 credentials

    Returns:
    - list: List of dictionaries containing calendar name and ID
    """
    service = build("calendar", "v3", credentials=google_credentials)
    calendar_list = service.calendarList().list().execute()
    calendars = []

    for calendar in calendar_list.get("items", []):
        calendars.append({"name": calendar["summary"], "id": calendar["id"]})

    return calendars


def add_study_schedule_to_google_calendar(
    google_credentials: Credentials,
    calendar_id: str,
    title: str,
    description: str,
    start_time: str,
    end_time: str,
):
    """
    Adds personal study schedule to Google Calendar.

    Parameters:
    - google_credentials: User's Google OAuth2 credentials
    - title: Event title
    - description: Event description
    - start_time: Start time (RFC3339 format)
    - end_time: End time (RFC3339 format)

    Returns:
    - event: Created event information
    """
    service = build("calendar", "v3", credentials=google_credentials)
    event = {
        "summary": title,
        "description": description,
        "start": {"dateTime": start_time, "timeZone": "America/New_York"}, # TODO: change to user's timezone
        "end": {"dateTime": end_time, "timeZone": "America/New_York"}, # TODO: change to user's timezone
    }
    created_event = (
        service.events().insert(calendarId=calendar_id, body=event).execute()
    )
    return {
        "id": created_event["id"],
        "html_link": created_event["htmlLink"],
        "start": created_event["start"],
        "end": created_event["end"],
    }

def list_google_calendar_events(
    google_credentials: Credentials,
    calendar_id: str,
    start_date: str,
    end_date: str,
    **kwargs,
):
    """
    Lists all events from a specific Google Calendar.

    Parameters:
    - google_credentials: User's Google OAuth2 credentials
    - calendar_id: Calendar ID
    - start_date: Start date (RFC3339 format)
    - end_date: End date (RFC3339 format)
    - kwargs: Additional keyword arguments

    Returns:
    - events: List of events
    """
    if not kwargs:  
        kwargs = {"timeMin": start_date, "timeMax": end_date}
    service = build("calendar", "v3", credentials=google_credentials)
    events = service.events().list(calendarId=calendar_id, **kwargs).execute()
    return events

def get_google_calendar_event(
    google_credentials: Credentials,
    calendar_id: str,
    event_id: str,
    **kwargs,
):
    service = build("calendar", "v3", credentials=google_credentials)
    event = service.events().get(calendarId=calendar_id, eventId=event_id, **kwargs).execute()
    return event    


def set_event_reminder(
    google_credentials: Credentials,
    calendar_id: str,
    event_id: str,
    reminder_minutes: int,
):
    """
    Sets a reminder for Google Calendar event.

    Parameters:
    - google_credentials: User's Google OAuth2 credentials
    - event_id: Event ID
    - reminder_minutes: Reminder time (in minutes)

    Returns:
    - updated_event: Updated event information
    """
    service = build("calendar", "v3", credentials=google_credentials)
    event = service.events().get(calendarId=calendar_id, eventId=event_id).execute()
    event["reminders"] = {
        "useDefault": False,
        "overrides": [{"method": "popup", "minutes": reminder_minutes}],
    }
    updated_event = (
        service.events()
        .update(calendarId=calendar_id, eventId=event_id, body=event)
        .execute()
    )
    return {
        "id": updated_event["id"],
        "html_link": updated_event["htmlLink"],
        "reminders": updated_event["reminders"],
    }


def fetch_study_progress(
    canvas_api_url: str, canvas_api_key: str, course_id: str, user_id: str
):
    """
    Fetches user's learning progress and performance from Canvas.

    Parameters:
    - canvas_api_url: API URL of Canvas instance
    - canvas_api_key: User's Canvas API key
    - course_id: Course ID
    - user_id: User ID

    Returns:
    - progress: Learning progress and performance information
    """
    canvas = Canvas(canvas_api_url, canvas_api_key)
    course = canvas.get_course(course_id)
    user = canvas.get_user(user_id)
    enrollments = user.get_enrollments(course_id=course.id)
    progress = []
    for enrollment in enrollments:
        progress.append(
            {
                "course_name": course.name,
                "current_score": enrollment.grades["current_score"],
                "final_score": enrollment.grades["final_score"],
            }
        )
    return progress

