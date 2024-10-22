from datetime import datetime
import json
from functools import partial
from typing import Annotated

from fastapi import Depends
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from src.application.openai_utils import function_to_schema
from src.application.usecase import get_class_schedule, list_upcoming_tasks
from src.deps import Container
from src.settings import settings


async def aclient():
    return AsyncOpenAI(api_key=settings.openai_api_key)

inmemory_chat_history = [
    {
        "role": "system",
        "content": "You are a helpful assistant that can help with scheduling tasks."
    }
]

class ScheduleAgentChatOutput(BaseModel):
    message: str
    actions: list[dict] | None = Field(default_factory=list)

async def chat_with_schedule_agent(aclient: AsyncOpenAI, message: str, container: Container) -> ScheduleAgentChatOutput:
    functions_to_call = {
        "list_upcoming_tasks": partial(list_upcoming_tasks, canvas_client=container.canvas_client),
        "get_class_schedule": partial(get_class_schedule, calendar_client=container.google_calendar_client),
    }
    # TODO: add chat history from database
    inmemory_chat_history.append({"role": "user", "content": message})
    response = await aclient.chat.completions.create(
        model="gpt-4o",
        messages=inmemory_chat_history,
        tools=list([function_to_schema(f) for f in functions_to_call.values()]),
        tool_choice="auto",
    )
    if response.choices[0].message.content is not None:
        ...

    # if not function call
    if not response.choices[0].message.tool_calls:  # Changed condition
        inmemory_chat_history.append({
            "role": "assistant",
            "content": response.choices[0].message.content,
        })
        return ScheduleAgentChatOutput(
            message=response.choices[0].message.content,
            actions=[],
        )

    function_call = response.choices[0].message.tool_calls[0]
    function_name = function_call.function.name
    function_args = json.loads(function_call.function.arguments)
    
    function_call_result = await functions_to_call[function_name](**function_args)
    inmemory_chat_history.append(response.choices[0].message)
    inmemory_chat_history.append({
        "role": "tool",
        "content": json.dumps(function_call_result),
        "tool_call_id": function_call.id,
    })

    second_response = await aclient.beta.chat.completions.parse(
        model="gpt-4o",
        messages=inmemory_chat_history,
        temperature=0.0,
        response_format=ScheduleAgentChatOutput,
    )
    inmemory_chat_history.append(
        {
            'role': 'assistant',
            'content': second_response.choices[0].message.content,
        }
    )

    return second_response.choices[0].message.parsed



OpenAIAClient = Annotated[AsyncOpenAI, Depends(aclient)]