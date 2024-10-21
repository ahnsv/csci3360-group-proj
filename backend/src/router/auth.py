from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from googleapiclient.discovery import build
from pydantic import BaseModel
from starlette.requests import Request

from src.database.models import Integration
from src.deps import ApplicationContainer, AsyncDBSession, CurrentUser, GoogleCalendarFlow, get_flow

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/google/authorize")
async def authorize(flow: GoogleCalendarFlow, current_user: CurrentUser, redirect_uri: str = Query(...)):
    authorization_url, _ = flow.authorization_url(prompt="consent")
    return RedirectResponse(url=f"{authorization_url}&redirect_uri={redirect_uri}")

@router.get("/google/oauth2callback")
async def oauth2callback(request: Request, code: str, current_user: CurrentUser, session: AsyncDBSession, flow: GoogleCalendarFlow, redirect_uri: str = Query(...)):
    flow.fetch_token(code=code)
    credentials = flow.credentials

    try:
        build('calendar', 'v3', credentials=credentials)
    except Exception as e:
        return RedirectResponse(url=f"{request.url.path}?error=true")
    
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
async def google_status():
    # In a real application, you would check if the user has valid Google credentials
    # For this example, we'll just return a mock status
    return {"connected": False}

class CanvasConnectIn(BaseModel):
    token: str

class CanvasConnectOut(BaseModel):
    success: bool
    message: str

@router.post("/canvas/connect", response_model=CanvasConnectOut)
async def canvas_connect(request: CanvasConnectIn, container: ApplicationContainer):
    canvas_client = container.canvas_client
    canvas_client.update_api_token(request.token)

    try:
        # Test the connection by fetching courses
        courses = await canvas_client.list_registered_courses()
        return {"success": True, "message": "Successfully connected to Canvas API"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))