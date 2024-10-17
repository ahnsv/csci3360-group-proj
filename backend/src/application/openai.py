from typing import Annotated
from fastapi import Depends
from openai import AsyncOpenAI
from src.settings import settings


async def aclient():
    return AsyncOpenAI(api_key=settings.openai_api_key)

async def chat_with_schedule_agent(aclient: AsyncOpenAI, message: str) -> str:
    response = await aclient.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that can help with scheduling tasks."},
            {"role": "user", "content": message}
        ],
        # tools=[],
        # tool_choice="auto",
    )
    return response.choices[0].message.content



OpenAIAClient = Annotated[AsyncOpenAI, Depends(aclient)]