from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.application import agent
from src.router import auth, chat, courses, health, subtask, task

app = FastAPI()
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(task.router)
app.include_router(health.router)
app.include_router(courses.router)
app.include_router(agent.router)
app.include_router(subtask.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
