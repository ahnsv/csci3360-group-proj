import pytest
from pytest import fixture

from src.deps import CanvasApiError, CanvasClient
from src.settings import Settings


@fixture
def settings_in_test():
    return Settings(
        canvas_api_url="https://canvas.instructure.com",
    )

@fixture
def canvas_client(settings_in_test: Settings):
    return CanvasClient(settings_in_test)


@pytest.mark.asyncio
async def test_get_upcoming_tasks(canvas_client: CanvasClient, mocker):
    # mock api response
    mock_api_response = [
        {
            "plannable_type": "assignment",
            "plannable": {
                "title": "Assignment 1",
                "due_at": "2024-01-01T00:00:00Z",
                "course_id": "1",
                "submissions": {"submitted": False}
            }
        },
        {
            "plannable_type": "quiz",
            "plannable": {
                "title": "Quiz 1",
                "due_at": "2024-01-01T00:00:00Z",
                "course_id": "1",
            }
        }
    ]
    mocker.patch.object(canvas_client, "get_upcoming_tasks", return_value=mock_api_response)

    tasks = await canvas_client.get_upcoming_tasks()
    assert len(tasks) == 2
    assert tasks[0]["plannable_type"] == "assignment"
    assert tasks[1]["plannable_type"] == "quiz"

@pytest.mark.asyncio
async def test_get_upcoming_tasks_with_invalid_token(canvas_client: CanvasClient, mocker):
    mocker.patch.object(canvas_client, "get_upcoming_tasks", side_effect=CanvasApiError(401, "Unauthorized"))
    with pytest.raises(CanvasApiError):
        await canvas_client.get_upcoming_tasks()


@pytest.mark.asyncio
async def test_get_upcoming_tasks_with_invalid_response(canvas_client: CanvasClient, mocker):
    mocker.patch.object(canvas_client, "get_upcoming_tasks", side_effect=CanvasApiError(400, "Bad Request"))
    with pytest.raises(CanvasApiError):
        await canvas_client.get_upcoming_tasks()
