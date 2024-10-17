from functools import partial
from src.application.openai_utils import function_to_schema

def test_function_to_schema():
    def func(a: int, b: int) -> int:
        """
        This function adds two numbers.
        """
        return a + b

    schema = function_to_schema(func)
    assert schema == {
        "type": "function",
        "function": {
            "name": "func",
            "description": "This function adds two numbers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "a": {"type": "integer"},
                    "b": {"type": "integer"},
                },
                "required": ["a", "b"],
            },
        },
    }


def test_function_to_schema_with_optional_parameters():
    def func(a: int, b: int = 1) -> int:
        """
        This function adds two numbers.
        """
        return a + b

    schema = function_to_schema(func)
    assert schema == {
        "type": "function",
        "function": {
            "name": "func",
            "description": "This function adds two numbers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "a": {"type": "integer"},
                    "b": {"type": "integer"},
                },
                "required": ["a"],
            },
        },
    }

def test_function_to_schema_with_partial():
    def func(a: int, b: int) -> int:
        """
        This function adds two numbers.
        """
        return a + b

    schema = function_to_schema(partial(func, b=1))
    assert schema == {
        "type": "function",
        "function": {
            "name": "func",
            "description": "This function adds two numbers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "a": {"type": "integer"},
                },
                "required": ["a"],
            },
        },
    }
