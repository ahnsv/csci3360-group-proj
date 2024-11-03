from typing import Optional

from pydantic import BaseModel

from src.database.models import TASK_TYPE


class User(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    access_token: str

class TaskIn(BaseModel):
    name: str
    description: Optional[str]
    start_at: Optional[str]
    end_at: Optional[str]
    due_at: Optional[str]
    link: Optional[str]
    type: TASK_TYPE