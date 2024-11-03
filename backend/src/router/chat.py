from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from src.application.openai import OpenAIClient, chat_with_schedule_agent
from src.database.models import Chat
from src.deps import ApplicationContainer, AsyncDBSession, CanvasApiError, CurrentUser

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    author: str # TODO: enum
    message: str
    sent_at: datetime

class ChatResponse(BaseModel):
    author: str # TODO: enum
    message: str
    sent_at: datetime

@router.get("/", response_model=list[ChatResponse])
async def get_chats(current_user: CurrentUser, session: AsyncDBSession):
    chats = await session.execute(select(Chat).where(Chat.user_id == current_user.id))
    # get last 100 messages
    chats = chats.scalars().all()[-100:]
    return [ChatResponse(author=chat.author, message=chat.content, sent_at=chat.created_at) for chat in chats]

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, client: OpenAIClient, container: ApplicationContainer, current_user: CurrentUser, session: AsyncDBSession):
    user_message = Chat(
        user_id=current_user.id,
        author=request.author,
        content=request.message,
        created_at=request.sent_at,
        updated_at=request.sent_at,
    )
    session.add(user_message)

    try:
        output = await chat_with_schedule_agent(client, request.message, container, current_user.id)
    except CanvasApiError as e:
        raise HTTPException(status_code=500, detail={"scope": "canvas", "message": e.message})
    finally:
        await session.commit()

    agent_message = Chat(
        user_id=current_user.id,
        author='agent',
        content=output.message,
        created_at=output.sent_at,
        updated_at=output.sent_at,
    )
    session.add(agent_message)
    await session.commit()

    return {"message": output.message or "No response", "author": 'agent', "sent_at": datetime.now()}
