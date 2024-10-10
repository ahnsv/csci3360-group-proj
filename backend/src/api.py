from fastapi import FastAPI

from src.router import auth

app = FastAPI()
app.include_router(auth.router)
