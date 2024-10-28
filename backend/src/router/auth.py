from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from googleapiclient.discovery import build
from pydantic import BaseModel
from starlette.requests import Request

from src.database.models import Integration
from src.deps import ApplicationContainer, AsyncDBSession, CurrentUser, GoogleCalendarFlow, get_flow

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google/authorize")
async def authorize(container: ApplicationContainer, _: CurrentUser, redirect_uri: str = Query(...)):
    calendar_client = container.google_calendar_client
    flow = calendar_client.flow
    authorization_url, _ = flow.authorization_url(prompt="consent")
    return RedirectResponse(url=f"{authorization_url}&redirect_uri={redirect_uri}")


@router.get("/google/oauth2callback")
async def oauth2callback(request: Request, container: ApplicationContainer, code: str, current_user: CurrentUser,
                         session: AsyncDBSession, redirect_uri: str = Query(None)):
    calendar_client = container.google_calendar_client
    credentials = calendar_client.authenticate(code)

    integration = Integration(
        type="google",
        token=credentials.token,
        expire_at=credentials.expiry,
        user_id=current_user.id
    )
    session.add(integration)
    await session.commit()

    return RedirectResponse(url=f"{request.url.path}?success=true")


# Add a new endpoint to check the connection status
@router.get("/google/status")
async def google_status(current_user: CurrentUser):
    if current_user.email is not None:
        return {"connected": True}
    return {"connected": False}


class CanvasConnectIn(BaseModel):
    token: str


class CanvasConnectOut(BaseModel):
    success: bool
    message: str


@router.post("/canvas/connect", response_model=CanvasConnectOut)
async def canvas_connect(request: CanvasConnectIn, container: ApplicationContainer, current_user: CurrentUser,
                         session: AsyncDBSession):
    canvas_client = container.canvas_client
    canvas_client.update_api_token(request.token)

    try:
        await canvas_client.list_registered_courses()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    integration = Integration(
        type="canvas",
        token=request.token,
        expire_at=None,
        user_id=current_user.id
    )
    session.add(integration)
    await session.commit()

    return CanvasConnectOut(success=True, message="Connected to Canvas API")
