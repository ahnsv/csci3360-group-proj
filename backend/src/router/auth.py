from fastapi import HTTPException, APIRouter
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

router = APIRouter(prefix="/auth", tags=["auth"])

# Set up OAuth 2.0 flow
CLIENT_SECRETS_FILE = "path/to/your/client_secrets.json"
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
REDIRECT_URI = "http://localhost:8000/oauth2callback"

flow = Flow.from_client_secrets_file(
    CLIENT_SECRETS_FILE,
    scopes=SCOPES,
    redirect_uri=REDIRECT_URI
)


@router.get("/google/authorize")
async def authorize():
    authorization_url, _ = flow.authorization_url(prompt="consent")
    return RedirectResponse(authorization_url)


@router.get("/google/oauth2callback")
async def oauth2callback(code: str):
    flow.fetch_token(code=code)
    credentials = flow.credentials

    try:
        build('calendar', 'v3', credentials=credentials)
        # You can now use the 'service' object to interact with the Google Calendar API
        return {"message": "Authentication successful"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
