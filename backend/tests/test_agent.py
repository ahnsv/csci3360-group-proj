from datetime import datetime, timedelta
import uuid

import jwt
import pytest
from fastapi.testclient import TestClient
from pytest_mock import MockerFixture

from src.api import app
from src.schema import User

# Constants for testing
TEST_SECRET_KEY = "test_secret_key_123456789"
TEST_ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 30


@pytest.fixture
def fake_client():
    return TestClient(app)


@pytest.fixture
def fake_user():
    return {
        "id": str(uuid.uuid4()),
        "name": "John Doe",
        "email": "john.doe@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "access_token": "",
    }


@pytest.fixture
def auth_token(fake_user):
    expire = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    jwt_data = {"sub": fake_user["email"], "user_id": fake_user["id"], "exp": expire}
    token = jwt.encode(jwt_data, TEST_SECRET_KEY, algorithm=TEST_ALGORITHM)
    return f"Bearer {token}"


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": auth_token}


@pytest.fixture
def authenticated_client(fake_client, mocker: MockerFixture, fake_user):
    mock_user_response = mocker.Mock()
    mock_user_response.user = User(**fake_user)
    mocker.patch("src.deps.gotrue_client.get_user", return_value=mock_user_response)
    return fake_client


def test_agent_chat_should_return_200(authenticated_client, auth_headers):
    response = authenticated_client.post(
        "/agent/", headers=auth_headers, json={"message": "What's my study progress?"}
    )
    assert response.status_code == 200


def test_agent_chat_unauthorized_should_return_401(fake_client):
    response = fake_client.post(
        "/agent/", json={"message": "What's my study progress?"}
    )
    assert response.status_code == 401


def test_agent_chat_invalid_token_should_return_401(fake_client):
    headers = {"Authorization": "Bearer invalid_token"}
    response = fake_client.post(
        "/agent/", headers=headers, json={"message": "What's my study progress?"}
    )
    assert response.status_code == 401


def test_agent_chat_should_call_get_upcoming_assignments_and_quizzes_tool(
    authenticated_client, auth_headers
):
    response = authenticated_client.post(
        "/agent/",
        headers=auth_headers,
        json={"message": "What is This week's assignments?"},
    )
    assert response.status_code == 200
    assert response.json()["message"] is not None
    assert (
        "get_upcoming_assignments_and_quizzes_tool"
        in response.json()["tool_invocations"][0]["name"]
    )
    assert response.json()["tool_invocations"][0]["result"] is not None
    assert len(response.json()["tool_invocations"][0]["result"]) > 0
    assert response.json()["tool_invocations"][0]["state"] == "failure"

def test_agent_chat_should_return_something_when_no_tool_related_question(authenticated_client, auth_headers):
    response = authenticated_client.post(
        "/agent/",
        headers=auth_headers,
        json={"message": "What is my name?"}
    )
    assert response.status_code == 200
    assert response.json()["message"] is not None
    assert response.json()["tool_invocations"] == []

def test_agent_chat_should_find_available_time_slots(authenticated_client, auth_headers):
    task = {
        "name": "Study for the upcoming exam",
        "due_date": datetime.now() + timedelta(days=14),
        "estimated_time": 120,
    }
    existing_schedules = [
        {
            "start_time": datetime.now() + timedelta(days=1),
            "end_time": datetime.now() + timedelta(days=1) + timedelta(hours=1),
        },
        {
            "start_time": datetime.now() + timedelta(days=2),
            "end_time": datetime.now() + timedelta(days=2) + timedelta(hours=1),
        },
    ]
    default_availability = {
        "start_time": "09:00",
        "end_time": "21:00",
    }

    response = authenticated_client.post(
        "/agent/",
        headers=auth_headers,
        json={"message": "Find available time slots for study in the next 2 weeks"}
    )
    assert response.status_code == 200
    assert response.json()["message"] is not None
    assert "time_slots" in response.json()["actions"]
    assert len(response.json()["actions"]["time_slots"]) > 0
