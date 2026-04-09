import json
from .groq_api import call_groq

def evaluate_prompts(prompts: list) -> list:
    results = []
    for p in prompts:
        if "system_prompt" not in p or "user_prompt_example" not in p:
            continue
            
        scenario = p.get("scenario", "Unknown Scenario")
        system_prompt = p["system_prompt"]
        user_prompt = p["user_prompt_example"]
        
        try:
            test_output = call_groq([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ], model="llama-3.1-8b-instant", max_tokens=512)
        except Exception as e:
            test_output = f"Error generating output: {e}"

        judge_prompt = f"""You are a strict Prompt Evaluator.
Scenario: {scenario}
User Asked: {user_prompt}
AI Output: {test_output}

Evaluate the AI Output strictly on a scale of 1 to 5 for:
- Clarity: How clear and easy to understand is it?
- Accuracy: Does it correctly address the user's inquiry?
- Conciseness: Is it brief and to the point?

Return ONLY a JSON object exactly like this:
{{
    "clarity": 5,
    "accuracy": 4,
    "conciseness": 5,
    "feedback": "Short text feedback explaining the scores."
}}"""

        try:
            eval_content = call_groq([
                {"role": "user", "content": judge_prompt}
            ], model="llama-3.3-70b-versatile", temperature=0.0, json_format=True)
            eval_data = json.loads(eval_content)
        except Exception as e:
            eval_data = {"clarity": 0, "accuracy": 0, "conciseness": 0, "feedback": f"Evaluation failed: {e}"}

        enriched_p = p.copy()
        enriched_p["test_output"] = test_output
        enriched_p["evaluation"] = eval_data
        results.append(enriched_p)
        
    return results
