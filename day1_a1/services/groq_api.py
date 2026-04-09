import os
import json
from groq import Groq


def _load_env():
    """Load .env from the project root into os.environ."""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    try:
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ.setdefault(key.strip(), val.strip())
    except FileNotFoundError:
        pass


def call_groq(
    messages: list,
    model: str = "llama-3.1-8b-instant",
    temperature: float = 0.7,
    json_format: bool = False,
    max_tokens: int = 1024,
) -> str:
    """Call Groq API using the official SDK and return the response text."""
    _load_env()
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in .env or environment variables.")

    client = Groq(api_key=api_key)

    kwargs = dict(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    if json_format:
        kwargs["response_format"] = {"type": "json_object"}

    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content
