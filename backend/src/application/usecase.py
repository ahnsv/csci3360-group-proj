from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from src.deps import CanvasClient, GoogleCalendarClient

class Course(BaseModel):
    name: str
    canvas_id: int
    course_code: str

class Assignment(BaseModel):
    name: str
    due_date: datetime
    course_id: int

class Quiz(BaseModel):
    name: str
    due_date: datetime
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

async def list_upcoming_tasks(n_days: int, canvas_client: CanvasClient) -> AcademicTasks:
    tasks_raw = await canvas_client.get_upcoming_tasks(n_days)
    assignments = []
    quizzes = []

    for task in tasks_raw:
        if task["plannable_type"] == "assignment":
            if task["submissions"]["submitted"] == True:
                continue
            assignments.append(Assignment(name=task["plannable"]["title"], due_date=task["plannable"]["due_at"], course_id=task["course_id"]))
        elif task["plannable_type"] == "quiz":
            quizzes.append(Quiz(name=task["plannable"]["title"], due_date=task["plannable"]["due_at"], course_id=task["course_id"]))
        else:
            ...

    return AcademicTasks(assignments=assignments, quizzes=quizzes)


def get_class_schedule(calendar_client: GoogleCalendarClient) -> list[ClassSchedule]:
    ...


def suggest_timeslots(availability: list[ClassSchedule], task: Assignment) -> list[ClassSchedule]:
    ...


def add_to_calendar(timeslot: TimeSlot, calendar: GoogleCalendarClient):
    ...


def modify_schedule(timeslot: TimeSlot, calendar: GoogleCalendarClient):
    ...
