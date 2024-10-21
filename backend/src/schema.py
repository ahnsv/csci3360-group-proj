from pydantic import BaseModel

class User(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    access_token: str
