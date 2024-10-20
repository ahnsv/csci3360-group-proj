import json
from functools import partial
from typing import Annotated

from fastapi import Depends
from openai import AsyncOpenAI

from src.application.openai_utils import function_to_schema
from src.application.usecase import list_upcoming_tasks
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

async def chat_with_schedule_agent(aclient: AsyncOpenAI, message: str, container: Container) -> str:
    functions_to_call = {
        "list_upcoming_tasks": partial(list_upcoming_tasks, canvas_client=container.canvas_client)
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
      print(response.choices[0].message.content)


    # if not function call
    if response.choices[0].message.tool_calls is None:
        inmemory_chat_history.append({
            "role": "assistant",
            "content": response.choices[0].message.content,
        })
        return response.choices[0].message.content


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

    second_response = await aclient.chat.completions.create(
        model="gpt-4o",
        messages=inmemory_chat_history,
    )
    inmemory_chat_history.append(second_response.choices[0].message)

    return second_response.choices[0].message.content



OpenAIAClient = Annotated[AsyncOpenAI, Depends(aclient)]