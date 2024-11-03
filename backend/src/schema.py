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