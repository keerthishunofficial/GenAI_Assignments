import json
from .groq_api import call_groq

def generate_prompts(num_prompts: int = 10) -> list:
    system_prompt = f"""You are an expert customer support engineer. Your task is to generate a JSON array of prompt templates.
Generate EXACTLY {num_prompts} high-quality, distinct prompt templates covering scenarios such as:
- Order status inquiries
- Troubleshooting guides
- Refund requests
- Account management
- General FAQ

Return pure JSON, no markdown blocks enclosing it. The output MUST be a JSON array of objects.
Each object must have the following structure:
{{
    "scenario": "A short descriptive name of the scenario",
    "system_prompt": "The system prompt setting the behavior of the AI assistant for this specific scenario.",
    "user_prompt_example": "An example of a user input testing this scenario."
}}"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "Generate the JSON array of prompt templates now."}
    ]
    
    try:
        content = call_groq(messages, model="llama-3.3-70b-versatile", json_format=True)
        data = json.loads(content)
        
        if isinstance(data, dict):
            for v in data.values():
                if isinstance(v, list):
                    return v
            return [data]
        elif isinstance(data, list):
            return data
        return []
    except Exception as e:
        print(f"Error generating prompts: {e}")
        return []
