import json
from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.application.agent import (
    ToolInvocation,
    get_or_create_agent,
    invalidate_agent_cache,
)
from src.database.models import Chat, Chatroom, ChatroomMember, ChatroomType, Profiles
from src.deps import (
    ApplicationContainer,
    AsyncDBSession,
    CurrentUser,
    get_current_user,
    get_session,
)
from src.router.chat import ChatResponse

router = APIRouter(prefix="/chatrooms", tags=["chatrooms"])


class ChatroomCreate(BaseModel):
    name: Optional[str] = None
    type: ChatroomType
    course_id: Optional[int] = None
    member_ids: List[UUID]

    model_config = ConfigDict(from_attributes=True)


class ChatroomResponse(BaseModel):
    id: int
    name: Optional[str]
    type: ChatroomType
    course_id: Optional[int]
    members: List["ChatroomMemberResponse"]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatroomMemberResponse(BaseModel):
    user_id: UUID
    is_admin: bool
    # first_name: Optional[str]
    # last_name: Optional[str]
    # email: Optional[str]

    model_config = ConfigDict(from_attributes=True)


ChatroomResponse.model_rebuild()


@router.post("", response_model=ChatroomResponse)
async def create_chatroom(
    chatroom: ChatroomCreate,
    current_user: Profiles = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Create chatroom
    new_chatroom = Chatroom(
        name=chatroom.name,
        type=chatroom.type,
        course_id=chatroom.course_id,
    )
    session.add(new_chatroom)
    await session.flush()

    # Add members
    members = []
    for user_id in chatroom.member_ids:
        member = ChatroomMember(
            chatroom_id=new_chatroom.id,
            user_id=user_id,
            is_admin=str(user_id) == str(current_user.id),
        )
        members.append(member)

    session.add_all(members)
    await session.commit()
    await session.refresh(new_chatroom, ["members"])

    return new_chatroom


@router.get("", response_model=List[ChatroomResponse])
async def list_chatrooms(
    current_user: Profiles = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(Chatroom)
        .join(ChatroomMember)
        .options(joinedload(Chatroom.members))
        .where(ChatroomMember.user_id == current_user.id)
    )
    result = await session.execute(query)
    chatrooms = result.scalars().unique().all()
    return chatrooms


@router.get("/{chatroom_id}", response_model=ChatroomResponse)
async def get_chatroom(
    chatroom_id: int,
    current_user: Profiles = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    query = (
        select(Chatroom)
        .join(ChatroomMember)
        .where(
            and_(Chatroom.id == chatroom_id, ChatroomMember.user_id == current_user.id)
        )
    )
    result = await session.execute(query)
    chatroom = result.scalar_one_or_none()

    if not chatroom:
        raise HTTPException(status_code=404, detail="Chatroom not found")

    return chatroom


@router.delete("/{chatroom_id}", status_code=204)
async def delete_chatroom(
    chatroom_id: int,
    current_user: Profiles = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Check if user is admin
    query = select(ChatroomMember).where(
        and_(
            ChatroomMember.chatroom_id == chatroom_id,
            ChatroomMember.user_id == current_user.id,
            ChatroomMember.is_admin == True,
        )
    )
    result = await session.execute(query)
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=403, detail="You don't have permission to delete this chatroom"
        )

    # Delete chatroom
    chatroom = (
        select(Chatroom)
        .where(Chatroom.id == chatroom_id)
        .with_for_update()
    )
    result = await session.execute(query)
    chatroom = result.scalar_one_or_none()

    if not chatroom:
        raise HTTPException(status_code=404, detail="Chatroom not found")

    await session.delete(chatroom)
    await session.commit()

    return {"message": "Chatroom deleted successfully"}


@router.patch("/{chatroom_id}")
async def update_chatroom(
    chatroom_id: int,
    name: str,
    current_user: Profiles = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    # Check if user is admin
    query = select(ChatroomMember).where(
        and_(
            ChatroomMember.chatroom_id == chatroom_id,
            ChatroomMember.user_id == current_user.id,
            ChatroomMember.is_admin == True,
        )
    )
    result = await session.execute(query)
    member = result.scalar_one_or_none()

    if not member:
        raise HTTPException(
            status_code=403, detail="You don't have permission to update this chatroom"
        )

    # Update chatroom
    member.chatroom.name = name
    await session.commit()

    return {"message": "Chatroom updated successfully"}


@router.get("/{chatroom_id}/chats", response_model=List[ChatResponse])
async def get_chatroom_chats(chatroom_id: int, session: AsyncDBSession):
    query = (
        select(Chat).where(Chat.chatroom_id == chatroom_id).order_by(Chat.created_at)
    )
    result = await session.execute(query)
    chats = result.scalars().all()
    return [
        ChatResponse(author=chat.author, message=chat.content, sent_at=chat.created_at)
        for chat in chats
    ]


class HandleMessageRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None


class HandleMessageResponse(BaseModel):
    message: str
    actions: Optional[List[dict[str, Any]]] = Field(default_factory=list)
    tool_invocations: List[ToolInvocation]
    sent_at: datetime = Field(default_factory=datetime.now)
    author: str = Field(default="agent")


@router.post("/{chatroom_id}/messages", response_model=HandleMessageResponse)
async def handle_message(
    chatroom_id: int,
    request: HandleMessageRequest,
    current_user: CurrentUser,
    container: ApplicationContainer,
):
    db_session = container.db_session
    human_message = Chat(
        author="user",
        content=request.message,
        user_id=current_user.id,
        chatroom_id=chatroom_id,
    )
    db_session.add(human_message)

    try:
        agent = get_or_create_agent(container, str(current_user.id))
        config = {"configurable": {"thread_id": request.thread_id or "default"}}

        response = await agent.ainvoke(
            {
                "messages": [
                    SystemMessage(
                        content="""
                              You are a helpful assistant that can help the user with their tasks.

                              You can use the following tools to help the user:
                              - get_study_progress_tool: Get the user's study progress.
                              - sync_calendar_tool: Synchronize tasks with Google Calendar.
                              - list_courses_tool: List all Canvas courses.
                              - get_upcoming_assignments_and_quizzes_tool: Get upcoming assignments and quizzes.

                              By using the tools, you can get information about the user's existing schedules, assignments, and quizzes. 
                              With this information, you can help the user find available time slots for studying.

                              If you cannot find any available time slots, you can suggest the user to create a new task.
                              """
                    ),
                    HumanMessage(content=request.message),
                ]
            },
            config=config,
        )

        last_message = response["messages"][-1]
        output = "No response"
        tool_invocations = []

        for message in response["messages"]:
            if isinstance(message, ToolMessage):
                if message.name == "material_documents_retriever":
                    tool_invocations.append(
                        ToolInvocation(
                            name=message.name,
                            result=message.content,
                            state="result",
                        )
                    )
                    continue
                try:
                    json_loadable_content = json.loads(message.content)
                    tool_invocations.append(
                        ToolInvocation(
                            name=message.name,
                            result=json_loadable_content,
                            state="result",
                        )
                    )
                except json.JSONDecodeError:
                    tool_invocations.append(
                        ToolInvocation(
                            name=message.name, result=message.content, state="failure"
                        )
                    )

        if isinstance(last_message, AIMessage):
            output = last_message.content

        response = HandleMessageResponse(
            message=output,
            tool_invocations=tool_invocations,
        )

        db_session.add(
            Chat(
                author="agent",
                content=output,
                user_id=current_user.id,
                chatroom_id=chatroom_id,
            )
        )

        return response
    except Exception as e:
        invalidate_agent_cache(str(current_user.id))

        raise HTTPException(
            status_code=500, detail={"message": f"Agent error: {str(e)}"}
        )
    finally:
        await db_session.commit()
