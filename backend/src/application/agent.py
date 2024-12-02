import json
from functools import partial
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from langchain.tools.retriever import create_retriever_tool
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import StructuredTool, create_schema_from_function
from langchain_core.vectorstores import VectorStoreRetriever
from langchain_openai import OpenAIEmbeddings
from langchain_openai.chat_models import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph.graph import CompiledGraph
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel, Field

from src.application.openai_utils import function_to_schema
from src.application.usecase_v2 import (
    get_study_progress,
    get_upcoming_assignments_and_quizzes,
    list_canvas_courses,
    sync_to_google_calendar,
)
from src.database.models import Chat
from src.deps import ApplicationContainer, CurrentUser

# Agent cache to store initialized agents
_agent_cache: Dict[str, CompiledGraph] = {}


# Define tools with container injection
def create_tools(container: ApplicationContainer, user_id: str):
    async def get_user_study_progress():
        """Get the user's study progress and learning analytics.
        
        Returns:
            dict: Study progress data including completed materials, quiz scores, etc.
        """
        return await get_study_progress(session=container.db_session, user_id=user_id)

    async def sync_user_calendar():
        """Synchronize Canvas assignments and deadlines with Google Calendar.
        
        Returns:
            dict: Status of calendar sync operation including number of events synced.
        """
        return await sync_to_google_calendar(session=container.db_session, user_id=user_id)

    async def get_user_courses():
        """List all Canvas courses the user is enrolled in.
        
        Returns:
            list[dict]: List of courses with details like name, code, and enrollment status.
        """
        return await list_canvas_courses(session=container.db_session, user_id=user_id)

    async def get_user_upcoming_work(n_days: int = 7, start_date: str = None, end_date: str = None, course_id: str = None):
        """Get upcoming assignments and quizzes for the user.
        
        Args:
            n_days (int, optional): Number of days to look ahead. Defaults to 7.
            start_date (str, optional): Start date in YYYY-MM-DD format. Defaults to None.
            end_date (str, optional): End date in YYYY-MM-DD format. Defaults to None.
            course_id (str, optional): Filter by specific course ID. Defaults to None.

        Returns:
            dict: Dictionary containing lists of upcoming assignments and quizzes.
        """
        return await get_upcoming_assignments_and_quizzes(
            session=container.db_session,
            user_id=user_id,
            n_days=n_days,
            start_date=start_date,
            end_date=end_date,
            course_id=course_id
        )

    return [
        StructuredTool(
            name="get_study_progress",
            description="Get the user's study progress and learning analytics data",
            func=get_user_study_progress,
            coroutine=get_user_study_progress,
            args_schema=create_schema_from_function(
                "get_study_progress", get_user_study_progress
            ),
        ),
        StructuredTool(
            name="sync_calendar",
            description="Synchronize Canvas assignments and deadlines with Google Calendar",
            func=sync_user_calendar,
            coroutine=sync_user_calendar,
            args_schema=create_schema_from_function(
                "sync_calendar", sync_user_calendar
            ),
        ),
        StructuredTool(
            name="list_courses",
            description="List all Canvas courses the user is enrolled in",
            func=get_user_courses,
            coroutine=get_user_courses,
            args_schema=create_schema_from_function(
                "list_courses", get_user_courses
            ),
        ),
        StructuredTool(
            name="get_upcoming_assignments_and_quizzes",
            description="Get upcoming assignments and quizzes with optional date range and course filters",
            func=get_user_upcoming_work,
            coroutine=get_user_upcoming_work,
            args_schema=create_schema_from_function(
                "get_upcoming_assignments_and_quizzes", get_user_upcoming_work
            ),
        ),
    ]


def get_or_create_agent(container: ApplicationContainer, user_id: str) -> CompiledGraph:
    """Get an existing agent from cache or create a new one."""
    if user_id not in _agent_cache:
        model = ChatOpenAI(
            model="gpt-4o-mini", api_key=container.settings.openai_api_key
        )
        tools = create_tools(container, user_id)
        vector_store_retriever = get_supabase_vector_store_retriever(container)
        material_retriever_tool = create_retriever_tool(
            vector_store_retriever,
            name="material_documents_retriever",
            description="Retrieve material documents from the database.",
        )
        memory = MemorySaver()
        _agent_cache[user_id] = create_react_agent(
            model, tools + [material_retriever_tool], checkpointer=memory
        )
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


class ToolInvocation(BaseModel):
    name: str
    result: Optional[dict | list | str] = None
    state: str


class AgentResponse(BaseModel):
    message: str
    actions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    tool_invocations: Optional[List[ToolInvocation]] = Field(default_factory=list)


@router.post("/", response_model=AgentResponse)
async def chat_with_agent(
    request: AgentRequest,
    container: ApplicationContainer,
    current_user: CurrentUser,
):
    """Chat with the AI agent."""
    db_session = container.db_session
    human_message = Chat(
        author="user",
        content=request.message,
        user_id=current_user.id,
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
                              - material_documents_retriever: Retrieve material documents from the database.

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

        response = AgentResponse(
            message=output,
            tool_invocations=tool_invocations,
        )

        db_session.add(
            Chat(
                author="agent",
                content=output,
                user_id=current_user.id,
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


def get_supabase_vector_store_retriever(
    container: ApplicationContainer,
) -> VectorStoreRetriever:
    supabase = container.supabase
    vector_store = SupabaseVectorStore(
        client=supabase,
        table_name="material_documents",
        query_name="match_documents",
        embedding=OpenAIEmbeddings(
            model="text-embedding-ada-002",
            api_key=container.settings.openai_api_key,
        ),
    )
    return vector_store.as_retriever()
