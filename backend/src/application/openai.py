import json
from datetime import datetime
from functools import partial
from typing import Annotated

from fastapi import Depends
from openai import AsyncOpenAI, OpenAI
from pydantic import BaseModel, Field

from src.application.openai_utils import function_to_schema
from src.application.usecase_v2 import (
    create_task_from_dict,
    get_study_progress,
    get_task,
    get_upcoming_assignments_and_quizzes,
    list_canvas_courses,
    list_tasks,
    sync_to_google_calendar,
)
from src.deps import Container
from src.settings import settings


async def aclient():
    return AsyncOpenAI(api_key=settings.openai_api_key)

def client():
    return OpenAI(api_key=settings.openai_api_key)

# Dictionary to store chat history for each user
user_chat_histories = {}

class ScheduleAgentChatOutput(BaseModel):
    message: str
    actions: list[dict] | None = Field(default_factory=list)
    sent_at: str = Field(default_factory=lambda: datetime.now().isoformat(), description="ISO 8601 formatted datetime string")

async def chat_with_schedule_agent(client: OpenAI, message: str, container: Container, user_id: str) -> ScheduleAgentChatOutput:
    # Initialize chat history for new users
    if user_id not in user_chat_histories:
        user_chat_histories[user_id] = [
            {
                "role": "system",
                "content": "You are a helpful assistant that can help with scheduling tasks."
            }
        ]
    
    functions_to_call = {
        "get_study_progress": partial(get_study_progress, session=container.db_session, user_id=user_id),
        "sync_to_google_calendar": partial(sync_to_google_calendar, session=container.db_session, user_id=user_id),
        "list_canvas_courses": partial(list_canvas_courses, session=container.db_session, user_id=user_id),
        "get_upcoming_assignments_and_quizzes": partial(get_upcoming_assignments_and_quizzes, session=container.db_session, user_id=user_id),
        "create_task_from_dict": partial(create_task_from_dict, session=container.db_session, user_id=user_id),
        "list_tasks": partial(list_tasks, session=container.db_session, user_id=user_id),
        "get_task": partial(get_task, session=container.db_session, user_id=user_id),
    }
    # TODO: add chat history from database
    user_chat_histories[user_id].append({"role": "user", "content": message})
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=user_chat_histories[user_id],
        tools=list([function_to_schema(f) for f in functions_to_call.values()]),
        tool_choice="auto",
    )
    if response.choices[0].message.content is not None:
        ...

    # if not function call
    if not response.choices[0].message.tool_calls:  # Changed condition
        user_chat_histories[user_id].append({
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
    
    try:
        function_call_result = await functions_to_call[function_name](**function_args)
    except Exception as e:
        error_message = f"Error executing {function_name}: {str(e)}"
        function_call_result = {"error": error_message}
        raise

    user_chat_histories[user_id].append(response.choices[0].message)
    user_chat_histories[user_id].append({
        "role": "tool",
        "content": json.dumps(function_call_result),
        "tool_call_id": function_call.id,
    })

    second_response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=user_chat_histories[user_id],
        temperature=0.0,
        response_format=ScheduleAgentChatOutput,
    )
    user_chat_histories[user_id].append(
        {
            'role': 'assistant',
            'content': second_response.choices[0].message.content,
        }
    )

    return second_response.choices[0].message.parsed


OpenAIAClient = Annotated[AsyncOpenAI, Depends(aclient)]
OpenAIClient = Annotated[OpenAI, Depends(client)]
