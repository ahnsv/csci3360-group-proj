from datetime import datetime
from fastapi import APIRouter
from openai import AsyncOpenAI
from pydantic import BaseModel

from src.application.openai import chat_with_schedule_agent, OpenAIAClient


router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    author: str # TODO: enum
    message: str
    sent_at: datetime

class ChatResponse(BaseModel):
    author: str # TODO: enum
    message: str
    sent_at: datetime

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, aclient: OpenAIAClient):
    message = await chat_with_schedule_agent(aclient, request.message)
    return {"message": message, "author": request.author, "sent_at": request.sent_at}
