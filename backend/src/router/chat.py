from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from openai import BadRequestError

from src.application import openai
from src.application.openai import OpenAIClient, chat_with_schedule_agent
from src.database.models import Chat
from src.deps import ApplicationContainer, AsyncDBSession, CanvasApiError, CurrentUser

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    author: str  # TODO: enum
    message: str
    sent_at: datetime


class ChatResponse(BaseModel):
    author: str  # TODO: enum
    message: str
    sent_at: datetime
    actions: list[dict] | None = None


@router.get("/", response_model=list[ChatResponse])
async def get_chats(current_user: CurrentUser, session: AsyncDBSession):
    chats = await session.execute(select(Chat).where(Chat.user_id == current_user.id).order_by(Chat.created_at))
    # get last 100 messages
    chats = chats.scalars().all()[-100:]
    return [
        ChatResponse(author=chat.author, message=chat.content, sent_at=chat.created_at)
        for chat in chats
    ]


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    client: OpenAIClient,
    container: ApplicationContainer,
    current_user: CurrentUser,
    session: AsyncDBSession,
):
    user_message = Chat(
        user_id=current_user.id,
        author=request.author,
        content=request.message,
        created_at=request.sent_at,
        updated_at=request.sent_at,
    )
    session.add(user_message)

    try:
        output = await chat_with_schedule_agent(
            client, request.message, container, current_user.id
        )
    except CanvasApiError as e:
        raise HTTPException(
            status_code=500, detail={"scope": "canvas", "message": e.message}
        )
    except BadRequestError as e:
        raise HTTPException(
            status_code=400, detail={"scope": "openai", "message": e.message}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail={"scope": "unknown", "message": str(e)}
        )
    finally:
        await session.commit()

    agent_message = Chat(
        user_id=current_user.id,
        author="agent",
        content=output.message,
        created_at=datetime.now(),  # TODO: ensure output.sent_at is up to date with the latest time
        updated_at=datetime.now(),  
    )
    session.add(agent_message)
    await session.commit()

    return ChatResponse(
        message=output.message or "No response",
        author="agent",
        sent_at=datetime.now(),
        actions=output.actions,
    )
