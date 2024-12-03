import base64
from datetime import datetime
import json
import uuid

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from google.oauth2.credentials import Credentials
from pydantic import BaseModel
from sqlalchemy import select, update
from starlette.requests import Request

from src.application import usecase_v2
from src.application.external_usecase import list_google_calendars
from src.database.models import Integration
from src.deps import ApplicationContainer, AsyncDBSession, CurrentUser, gotrue_client
from src.settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google/authorize")
async def authorize(
    request: Request, container: ApplicationContainer, state: str = Query(...)
):
    try:
        calendar_client = container.google_calendar_client
        flow = calendar_client.flow

        # Pass through the state parameter which contains the access token
        # Google will return this same state parameter in the callback
        authorization_url, _ = flow.authorization_url(
            prompt="consent",
            state=state,
            access_type="offline",  # Get refresh token
            include_granted_scopes="true",
        )
        return RedirectResponse(url=authorization_url)
    except Exception as e:
        print(f"Error in authorize: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to initialize OAuth flow")


@router.get("/google/oauth2callback")
async def oauth2callback(
    request: Request,
    container: ApplicationContainer,
    code: str,
    session: AsyncDBSession,
    state: str = Query(None),
):
    try:
        # Decode the state parameter to get access token and redirect URI
        state_data = json.loads(base64.b64decode(state))
        access_token = state_data.get("access_token")
        redirect_uri = state_data.get("redirect_uri")

        if not access_token:
            raise HTTPException(status_code=400, detail="Missing access token in state")

        # Get user from Supabase using the access token
        if not gotrue_client:
            raise HTTPException(status_code=500, detail="Auth client not initialized")

        user_response = await gotrue_client.get_user(jwt=access_token)
        if not user_response:
            raise HTTPException(status_code=401, detail="Invalid access token")

        user = user_response.user

        # Get Google credentials
        calendar_client = container.google_calendar_client
        credentials = calendar_client.authenticate(code)

        # Check for existing integration
        result = await session.execute(
            select(Integration).where(
                Integration.user_id == user.id, Integration.type == "google"
            )
        )
        existing_integration = result.scalars().first()

        if existing_integration:
            # Update existing integration
            existing_integration.token = credentials.token
            existing_integration.expire_at = credentials.expiry
        else:
            # Create new integration
            integration = Integration(
                type="google",
                token=credentials.token,
                refresh_token=credentials.refresh_token,
                expire_at=credentials.expiry,
                user_id=user.id,
            )
            session.add(integration)

        await session.commit()

        # Redirect back to the original page
        return RedirectResponse(url=f"{redirect_uri}?success=true")

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in oauth2callback: {str(e)}")
        if redirect_uri:
            return RedirectResponse(url=f"{redirect_uri}?error=true")
        return RedirectResponse(url=f"{request.url.path}?error=true")


# Add a new endpoint to check the connection status
@router.get("/google/status")
async def google_status(current_user: CurrentUser, session: AsyncDBSession):
    result = await session.execute(
        select(Integration).where(
            Integration.user_id == current_user.id, Integration.type == "google"
        )
    )
    google_integration = result.scalars().first()
    if google_integration is None:
        return {"connected": False}

    return {"connected": True}


class CanvasConnectIn(BaseModel):
    token: str


class CanvasConnectOut(BaseModel):
    success: bool
    message: str


@router.post("/canvas/connect", response_model=CanvasConnectOut)
async def canvas_connect(
    request: CanvasConnectIn,
    container: ApplicationContainer,
    current_user: CurrentUser,
    session: AsyncDBSession,
):
    canvas_client = container.canvas_client
    canvas_client.update_api_token(request.token)

    try:
        await canvas_client.list_registered_courses()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    stmt = select(Integration).where(
        Integration.user_id == current_user.id, Integration.type == "canvas"
    )
    existing_integration = await session.execute(stmt)
    existing_integration = existing_integration.scalar_one_or_none()

    if existing_integration:
        existing_integration.token = request.token
        existing_integration.expire_at = None
    else:
        integration = Integration(
            type="canvas", token=request.token, expire_at=None, user_id=current_user.id
        )
        session.add(integration)
    await session.commit()

    return CanvasConnectOut(success=True, message="Connected to Canvas API")


@router.get("/required-integrations")
async def check_required_integrations(
    current_user: CurrentUser, session: AsyncDBSession
):
    stmt = select(Integration).where(
        Integration.user_id == current_user.id,
        Integration.type.in_(["google", "canvas"]),
    )
    integrations = await session.execute(stmt)
    if integrations is None:
        raise HTTPException(status_code=400, detail="Missing required integrations")
    google_integration, canvas_integration = integrations.scalars().all()

    integration_status = {
        "google": google_integration is not None,
        "canvas": canvas_integration is not None,
    }

    if not all(integration_status.values()):
        raise HTTPException(status_code=400, detail="Missing required integrations")

    return integration_status


@router.get("/google/calendars")
async def get_google_calendars(current_user: CurrentUser, session: AsyncDBSession):
    stmt = select(Integration).where(
        Integration.user_id == current_user.id, Integration.type == "google"
    )
    integration = await session.execute(stmt)
    integration = integration.scalar_one_or_none()
    if integration is None:
        raise HTTPException(status_code=400, detail="Missing Google integration")

    credentials = Credentials(
        token=integration.token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.gcal_client_id,
        client_secret=settings.gcal_client_secret,
        refresh_token=integration.refresh_token,
    )

    if credentials.expired:
        credentials.refresh(Request())
        await session.execute(
            update(Integration)
            .where(
                Integration.user_id == uuid.UUID(current_user.id),
                Integration.type == "google",
            )
            .values(token=credentials.token, refresh_token=credentials.refresh_token)
        )
    calendars = list_google_calendars(credentials)
    return calendars


@router.get("/google/events")
async def get_google_events(
    current_user: CurrentUser, session: AsyncDBSession, date: str
):
    datetime_obj = datetime.strptime(date, "%Y-%m-%d")
    events = await usecase_v2.get_events_on_date(session, current_user.id, datetime_obj)
    return events


@router.post("/google/events")
async def create_google_event(
    current_user: CurrentUser,
    session: AsyncDBSession,
    events: list[usecase_v2.EventIn],
):
    result = await usecase_v2.sync_to_google_calendar(
        session,
        current_user.id,
        "primary",
        json.dumps([event.model_dump() for event in events]),
    )
    return result.model_dump()
