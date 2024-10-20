from fastapi import FastAPI

from src.router import auth, chat

app = FastAPI()
app.include_router(auth.router)
app.include_router(chat.router)
