from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.database.models import Chat, Chatroom, ChatroomMember, ChatroomType, Profiles
from src.deps import AsyncDBSession, get_current_user, get_session
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
            is_admin=user_id == current_user.id,
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


@router.delete("/{chatroom_id}")
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
    await session.execute(
        select(Chatroom).where(Chatroom.id == chatroom_id).with_for_update()
    )
    await session.delete(member.chatroom)
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
    return result.scalars().all()
