from datetime import datetime, timedelta
from typing import Any, Optional

from pydantic import BaseModel

from src.deps import CanvasClient, GoogleCalendarClient


class Course(BaseModel):
    name: str
    canvas_id: int
    course_code: str

class Assignment(BaseModel):
    name: str
    due_date: datetime | None
    course_id: int

class Quiz(BaseModel):
    name: str
    due_date: datetime | None
    course_id: int

class AcademicTasks(BaseModel):
    assignments: list[Assignment]
    quizzes: list[Quiz]

class TimeSlot(BaseModel):
    name: str
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None

class ClassSchedule(TimeSlot):
    name: str
    course: Course

async def list_upcoming_tasks(n_days: int, canvas_client: CanvasClient) -> dict[str, list[dict]]:
    """
    List upcoming tasks from Canvas API.

    :param n_days: Number of days to look ahead for upcoming tasks.
    :param canvas_client: Canvas client.
    :return: AcademicTasks.
    """
    tasks_raw = await canvas_client.get_upcoming_tasks(n_days)
    assignments = []
    quizzes = []

    for task in tasks_raw:
        if task["plannable_type"] == "assignment":
            if task["submissions"]["submitted"] is True:
                continue
            assignments.append(Assignment(name=task["plannable"]["title"], due_date=task["plannable"]["due_at"], course_id=task["course_id"]))
        elif task["plannable_type"] == "quiz":
            quizzes.append(Quiz(name=task["plannable"]["title"], due_date=task["plannable"]["due_at"], course_id=task["course_id"]))
        else:
            ...

    tasks = AcademicTasks(assignments=assignments, quizzes=quizzes)
    return tasks.model_dump(mode="json")


async def get_schedules(calendar_client: GoogleCalendarClient, time_min: datetime = None, time_max: datetime = None) -> list[dict[str, Any]]:
    """
    Get schedules from Google Calendar.

    :param time_min: datetime = None
    :param time_max: datetime = None
    :return: list[dict[str, Any]]
    """

    if time_min is None:
        time_min = datetime.now()
    if time_max is None:
        time_max = time_min + timedelta(days=7)
    calendar_events = await calendar_client.get_calendar_events(time_min=time_min, time_max=time_max)
    return [TimeSlot(name=event["summary"], start=event["start"], end=event["end"]).model_dump(mode="json") for event in calendar_events]


def suggest_timeslots(availability: list[TimeSlot], task: Assignment) -> list[TimeSlot]:
    ...


def add_to_calendar(timeslot: TimeSlot, calendar: GoogleCalendarClient):
    ...


def modify_schedule(timeslot: TimeSlot, calendar: GoogleCalendarClient):
    ...
