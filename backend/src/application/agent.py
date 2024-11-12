from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from langchain_openai.chat_models import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph.graph import CompiledGraph
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel

from src.application.usecase_v2 import (
    create_task_from_dict,
    get_study_progress,
    get_task,
    get_upcoming_tasks,
    list_canvas_courses,
    list_tasks,
    sync_to_google_calendar,
)
from src.deps import ApplicationContainer, CurrentUser

# Agent cache to store initialized agents
_agent_cache: Dict[str, CompiledGraph] = {}


# Define tools with container injection
def create_tools(container: ApplicationContainer, user_id: str):
    @tool
    async def get_study_progress_tool() -> str:
        """Get the user's study progress."""
        return await get_study_progress(session=container.db_session, user_id=user_id)
    
    @tool
    async def sync_calendar_tool() -> str:
        """Synchronize tasks with Google Calendar."""
        return await sync_to_google_calendar(session=container.db_session, user_id=user_id)
    
    @tool
    async def list_courses_tool() -> str:
        """List all Canvas courses."""
        return await list_canvas_courses(session=container.db_session, user_id=user_id)
    
    @tool
    async def get_upcoming_tasks_tool() -> str:
        """Get upcoming tasks."""
        return await get_upcoming_tasks(session=container.db_session, user_id=user_id)
    
    @tool
    async def list_tasks_tool() -> str:
        """List all tasks."""
        return await list_tasks(session=container.db_session, user_id=user_id)
    
    @tool
    async def get_task_tool(task_id: str) -> str:
        """Get a specific task by ID."""
        return await get_task(session=container.db_session, user_id=user_id, task_id=task_id)
    
    @tool
    async def create_task_tool(task_data: dict) -> str:
        """Create a new task."""
        return await create_task_from_dict(session=container.db_session, user_id=user_id, task_data=task_data)
    
    return [
        get_study_progress_tool,
        sync_calendar_tool,
        list_courses_tool,
        get_upcoming_tasks_tool,
        list_tasks_tool,
        get_task_tool,
        create_task_tool,
    ]


def get_or_create_agent(container: ApplicationContainer, user_id: str) -> CompiledGraph:
    """Get an existing agent from cache or create a new one."""
    if user_id not in _agent_cache:
        model = ChatOpenAI(model="gpt-4o-mini", api_key=container.settings.openai_api_key)
        tools = create_tools(container, user_id)
        memory = MemorySaver()
        _agent_cache[user_id] = create_react_agent(model, tools, checkpointer=memory)
    return _agent_cache[user_id]


def invalidate_agent_cache(user_id: str) -> None:
    """Remove a specific agent from the cache."""
    if user_id in _agent_cache:
        del _agent_cache[user_id]


# FastAPI Router and Models
router = APIRouter(prefix="/agent", tags=["agent"])


class AgentRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None


class AgentResponse(BaseModel):
    message: str
    actions: Optional[List[Dict[str, Any]]] = None


@router.post("/", response_model=AgentResponse)
async def chat_with_agent(
    request: AgentRequest,
    container: ApplicationContainer,
    current_user: CurrentUser,
):
    """Chat with the AI agent."""
    try:
        agent = get_or_create_agent(container, str(current_user.id))
        config = {"configurable": {"thread_id": request.thread_id or "default"}}
        
        response = await agent.ainvoke(
            {"messages": [HumanMessage(content=request.message)]}, 
            config=config
        )

        print(response)
        
        return AgentResponse(
            message=response.get("output", "No response"),
            actions=response.get("actions")
        )
        
    except Exception as e:
        # Invalidate cache in case of error
        invalidate_agent_cache(str(current_user.id))
        raise HTTPException(
            status_code=500,
            detail={"message": f"Agent error: {str(e)}"}
        )
