from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from backend.src.deps import CanvasClient, GoogleCalendarClient

class Course(BaseModel):
    name: str
    canvas_id: int
    course_code: str

class Assignment(BaseModel):
    name: str
    due_date: datetime
    course: Course

class TimeSlot(BaseModel):
    name: str
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None

class ClassSchedule(TimeSlot):
    name: str
    course: Course

async def list_upcoming_assignment(n_days: int, canvas_client: CanvasClient) -> list[Assignment]:
    return await canvas_client.get_upcoming_assignments(n_days)


def get_class_schedule(calendar_client: GoogleCalendarClient) -> list[ClassSchedule]:
    ...


def suggest_timeslots(availability: list[ClassSchedule], task: Assignment) -> list[ClassSchedule]:
    ...


def add_to_calendar(timeslot: TimeSlot, calendar: GoogleCalendarClient):
    ...


def modify_schedule(timeslot: TimeSlot, calendar: GoogleCalendarClient):
    ...
