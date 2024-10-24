FROM python:3.12-alpine

WORKDIR /app

ENV PORT=10000

RUN pip install poetry
COPY poetry.lock .
COPY pyproject.toml .
RUN poetry install

COPY . .

CMD ["poetry", "run", "uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "${PORT}"]
