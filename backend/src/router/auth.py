from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from pydantic import BaseModel
from starlette.requests import Request

from src.deps import ApplicationContainer, get_flow

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/google/authorize")
async def authorize(flow: Flow = Depends(get_flow), redirect_uri: str = Query(...)):
    flow.redirect_uri = redirect_uri
    authorization_url, _ = flow.authorization_url(prompt="consent")
    return RedirectResponse(authorization_url)

@router.get("/google/oauth2callback")
async def oauth2callback(request: Request, code: str, flow: Flow = Depends(get_flow)):
    flow.fetch_token(code=code)
    credentials = flow.credentials

    try:
        build('calendar', 'v3', credentials=credentials)
        # Store the credentials or a token in the user's session or database
        # For this example, we'll use a simple success parameter
        return RedirectResponse(url=f"{request.url.path}?success=true")
    except Exception as e:
        # Redirect with an error parameter
        return RedirectResponse(url=f"{request.url.path}?error=true")

# Add a new endpoint to check the connection status
@router.get("/google/status")
async def google_status():
    # In a real application, you would check if the user has valid Google credentials
    # For this example, we'll just return a mock status
    return {"connected": True}

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