from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.router import auth, chat, task

app = FastAPI()
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(task.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
