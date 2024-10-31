from datetime import datetime
import openai

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.application.openai import OpenAIAClient, chat_with_schedule_agent
from src.deps import ApplicationContainer, CanvasApiError

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
async def chat(request: ChatRequest, aclient: OpenAIAClient, container: ApplicationContainer):
    try:
        output = await chat_with_schedule_agent(aclient, request.message, container)
    except CanvasApiError as e:
        raise HTTPException(status_code=500, detail={"scope": "canvas", "message": e.message})
    return {"message": output.message or "No response", "author": 'agent', "sent_at": datetime.now()}
