import os
import json
from groq import Groq
from dotenv import load_dotenv
from .models import ImproveResult

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def build_meta_prompt(original: str) -> str:
    return f"""
You are a prompt engineering specialist, conversational AI evaluator, and developer tooling architect. 
Your goal is to transform a weak prompt into a high-quality, professional, and effective prompt using industry best practices.

Apply these principles:
1. **Role Assignment**: Assign a specific expert persona.
2. **Clarity & Context**: Explicitly define the goal and background information.
3. **Structured Steps**: Provide a step-by-step workflow for the LLM.
4. **Constraints & Format**: Define output format, tone, audience, and scope limitations.
5. **Reasoning**: Encourage step-by-step thinking.

Weak prompt: "{original}"

Return ONLY a JSON object with this exact structure:
{{
  "improved": "the rewritten prompt",
  "explanation": "a concise technical explanation of why this version is better (mention role assignment, specificity, structure, etc.)"
}}
"""

def improve_prompt(index: int, original: str) -> ImproveResult:
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": build_meta_prompt(original)}],
            temperature=0.3,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        data = json.loads(content)
        return ImproveResult(
            index=index,
            original=original,
            improved=data.get("improved", original),
            explanation=data.get("explanation", "Improved for clarity and structure.")
        )
    except Exception as e:
        return ImproveResult(
            index=index,
            original=original,
            improved=original,
            explanation=f"Error during improvement: {str(e)}"
        )
