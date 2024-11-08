from fastapi import APIRouter

from src.application import usecase_v2
from src.deps import AsyncDBSession, CurrentUser
from src.schema import TaskIn, TaskOut

router = APIRouter(prefix="/task", tags=["task"])

@router.post("/", response_model=TaskOut)
async def create_task(request: TaskIn, current_user: CurrentUser, session: AsyncDBSession):
    return await usecase_v2.create_task(session, current_user.id, request)

@router.get("/", response_model=list[TaskOut])
async def list_tasks(current_user: CurrentUser, session: AsyncDBSession):
    return await usecase_v2.list_tasks(session, current_user.id)

@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: int, current_user: CurrentUser, session: AsyncDBSession):
    return await usecase_v2.get_task(session, current_user.id, task_id)
