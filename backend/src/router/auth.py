from src.deps import get_flow
from src.settings import settings

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/google/authorize")
async def authorize(flow: Flow = Depends(get_flow)):
    authorization_url, _ = flow.authorization_url(prompt="consent")
    return RedirectResponse(authorization_url)

@router.get("/google/oauth2callback")
async def oauth2callback(code: str, flow: Flow = Depends(get_flow)):
    flow.fetch_token(code=code)
    credentials = flow.credentials

    try:
        build('calendar', 'v3', credentials=credentials)
        # You can now use the 'service' object to interact with the Google Calendar API
        return {"message": "Authentication successful"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
