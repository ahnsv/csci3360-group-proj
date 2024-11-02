import uuid

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from src.application import usecase_v2
from src.database.models import Base
from src.deps import async_sessionmaker
from src.settings import Settings


@pytest.fixture(scope="session")
def settings():
    return Settings(
        canvas_api_url="https://canvas.instructure.com",
        canvas_api_token="1234567890",
        database_url="sqlite+aiosqlite:///:memory:",
    )

@pytest_asyncio.fixture(scope="session")
async def db_session(settings: Settings):
    engine = create_async_engine(settings.database_url)
    async_session = async_sessionmaker(bind=engine)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.mark.asyncio
async def test_list_canvas_courses(db_session: AsyncSession, settings: Settings):
    uuid_user_id = uuid.uuid4()
    courses = await usecase_v2.list_canvas_courses(db_session, uuid_user_id.hex)
    assert courses == []