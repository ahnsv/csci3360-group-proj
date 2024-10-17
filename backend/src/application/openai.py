from functools import partial
from typing import Annotated
from fastapi import Depends
from openai import AsyncOpenAI

from src.deps import Container
from src.application.usecase import list_upcoming_tasks
from src.application.openai_utils import function_to_schema
from src.settings import settings


async def aclient():
    return AsyncOpenAI(api_key=settings.openai_api_key)

async def chat_with_schedule_agent(aclient: AsyncOpenAI, message: str, container: Container) -> str:
    response = await aclient.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that can help with scheduling tasks."},
            {"role": "user", "content": message}
        ],
        tools=[
            function_to_schema(partial(list_upcoming_tasks, canvas_client=container.canvas_client))
        ],
        tool_choice="auto",
    )
    return response.choices[0].message.content



OpenAIAClient = Annotated[AsyncOpenAI, Depends(aclient)]