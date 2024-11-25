
from fastapi import APIRouter

from src.application import usecase_v2
from src.application.openai import OpenAIAClient
from src.deps import AsyncDBSession, CurrentUser
from src.schema import GenerateSubtasksRequest, SubTaskOut, TaskOut

router = APIRouter(prefix="/subtask", tags=["subtask"])


@router.post("/", response_model=list[SubTaskOut])
async def generate_subtasks(
    request: GenerateSubtasksRequest, current_user: CurrentUser, session: AsyncDBSession, openai: OpenAIAClient
):
    return await usecase_v2.generate_subtasks(
        openai, session, current_user.id, request.task_name, request.course_name
    )
