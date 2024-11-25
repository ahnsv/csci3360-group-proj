from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from src.database.models import TaskType


class User(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    access_token: str

class TaskIn(BaseModel):
    name: str
    description: Optional[str]
    start_at: Optional[datetime]
    end_at: Optional[datetime]
    due_at: Optional[datetime]
    link: Optional[str] = Field(default=None)
    type: TaskType

class TaskOut(TaskIn):
    id: int

    model_config = ConfigDict(from_attributes=True)

class CourseInfo(BaseModel):
    course_name: str
    course_id: str


class GenerateSubtasksRequest(BaseModel):
    task_name: str
    course_name: str

class GenerateSubtasksOut(BaseModel):
    subtasks: list[TaskOut]

class SubTaskOut(BaseModel):
    title: str
    description: Optional[str]
    estimated_time: Optional[int]

