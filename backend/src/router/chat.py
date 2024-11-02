from datetime import datetime
import openai

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.application.openai import OpenAIClient, chat_with_schedule_agent
from src.deps import ApplicationContainer, CanvasApiError, CurrentUser

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
async def chat(request: ChatRequest, client: OpenAIClient, container: ApplicationContainer, current_user: CurrentUser):
    try:
        output = await chat_with_schedule_agent(client, request.message, container, current_user.id)
    except CanvasApiError as e:
        raise HTTPException(status_code=500, detail={"scope": "canvas", "message": e.message})
    return {"message": output.message or "No response", "author": 'agent', "sent_at": datetime.now()}
