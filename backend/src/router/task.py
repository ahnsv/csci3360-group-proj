from fastapi import APIRouter

from src.database.models import Task
from src.deps import AsyncDBSession, CurrentUser
from src.schema import TaskIn

router = APIRouter(prefix="/task", tags=["task"])

@router.post("/", response_model=Task)
async def create_task(request: TaskIn, current_user: CurrentUser, session: AsyncDBSession):
    return await create_task(session, current_user.id, request)

@router.get("/", response_model=list[Task])
async def list_tasks(current_user: CurrentUser, session: AsyncDBSession):
    return await list_tasks(session, current_user.id)

@router.get("/{task_id}", response_model=Task)
async def get_task(task_id: int, current_user: CurrentUser, session: AsyncDBSession):
    return await get_task(session, current_user.id, task_id)
