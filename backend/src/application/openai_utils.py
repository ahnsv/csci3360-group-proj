import inspect
from typing import Any, Callable
from functools import partial

def function_to_schema(func: Callable[..., Any]) -> dict:
    type_map = {
        str: "string",
        int: "integer",
        float: "number",
        bool: "boolean",
        list: "array",
        dict: "object",
        type(None): "null",
    }

    if isinstance(func, partial):
        original_func = func.func
        partial_args = func.keywords
    else:
        original_func = func
        partial_args = {}

    try:
        signature = inspect.signature(original_func)
    except ValueError as e:
        raise ValueError(
            f"Failed to get signature for function {original_func.__name__}: {str(e)}"
        )

    parameters = {}
    for param_name, param in signature.parameters.items():
        if param_name not in partial_args:
            try:
                param_type = type_map.get(param.annotation, "string")
            except KeyError as e:
                raise KeyError(
                    f"Unknown type annotation {param.annotation} for parameter {param.name}: {str(e)}"
                )
            parameters[param_name] = {"type": param_type}

    required = [
        param_name
        for param_name, param in signature.parameters.items()
        if param.default == inspect._empty and param_name not in partial_args
    ]

    return {
        "type": "function",
        "function": {
            "name": original_func.__name__,
            "description": (original_func.__doc__ or "").strip(),
            "parameters": {
                "type": "object",
                "properties": parameters,
                "required": required,
            },
        },
    }