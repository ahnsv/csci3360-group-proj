import json
from functools import partial
from typing import Annotated

from fastapi import Depends
from openai import AsyncOpenAI, OpenAI
from pydantic import BaseModel, Field

from src.application.openai_utils import function_to_schema
from src.application.usecase_v2 import get_study_progress, get_upcoming_tasks, list_canvas_courses, sync_to_google_calendar
from src.deps import Container
from src.settings import settings


async def aclient():
    return AsyncOpenAI(api_key=settings.openai_api_key)

def client():
    return OpenAI(api_key=settings.openai_api_key)

inmemory_chat_history = [
    {
        "role": "system",
        "content": "You are a helpful assistant that can help with scheduling tasks."
    }
]

class ScheduleAgentChatOutput(BaseModel):
    message: str
    actions: list[dict] | None = Field(default_factory=list)

async def chat_with_schedule_agent(client: OpenAI, message: str, container: Container, user_id: str) -> ScheduleAgentChatOutput:
    functions_to_call = {
        "get_study_progress": partial(get_study_progress, session=container.db_session, user_id=user_id),
        "sync_to_google_calendar": partial(sync_to_google_calendar, session=container.db_session, user_id=user_id),
        "list_canvas_courses": partial(list_canvas_courses, session=container.db_session, user_id=user_id),
        "get_upcoming_tasks": partial(get_upcoming_tasks, session=container.db_session, user_id=user_id),
    }
    # TODO: add chat history from database
    inmemory_chat_history.append({"role": "user", "content": message})
    response = client.chat.completions.create(
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

    second_response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
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
OpenAIClient = Annotated[OpenAI, Depends(client)]
