import os
import json
from groq import Groq
from typing import List, Dict

class EvaluationService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.client = None
        if self.api_key:
            try:
                self.client = Groq(api_key=self.api_key)
            except Exception:
                pass

    def is_available(self) -> bool:
        return self.client is not None

    def _get_score(self, prompt: str) -> float:
        if not self.is_available():
            return 0.5  # Neutral fallback
        
        try:
            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                temperature=0.1,
            )
            content = response.choices[0].message.content.strip()
            # Try to extract the first number found
            import re
            match = re.search(r"(\d+\.?\d*)", content)
            if match:
                score = float(match.group(1))
                return min(max(score, 0.0), 1.0)
            return 0.5
        except Exception:
            return 0.5

    def evaluate_relevance(self, query: str, context: List[str]) -> float:
        """Evaluates how relevant the retrieved context is to the query (Scale 0-1)."""
        context_str = "\n---\n".join(context)
        prompt = f"""
        Rate the RELEVANCE of the provided context to the user query.
        Query: {query}
        Context:
        {context_str}
        
        Guidelines:
        - 1.0: Context contains direct, complete information to answer the query.
        - 0.5: Context is tangentially related or contains partial information.
        - 0.0: Context is completely unrelated.
        
        Respond ONLY with a number between 0.0 and 1.0.
        """
        return self._get_score(prompt)

    def evaluate_faithfulness(self, query: str, context: List[str], answer: str) -> float:
        """Evaluates if the answer is grounded strictly in the context (Scale 0-1)."""
        context_str = "\n---\n".join(context)
        prompt = f"""
        Rate the FAITHFULNESS of the answer relative to the provided context.
        Query: {query}
        Context:
        {context_str}
        Answer: {answer}
        
        Guidelines:
        - 1.0: Every claim in the answer is supported by the context.
        - 0.0: The answer contains claims not present in the context (hallucinations).
        
        Respond ONLY with a number between 0.0 and 1.0.
        """
        return self._get_score(prompt)

    def run_benchmark(self, queries: List[str], rag_function) -> Dict:
        """Runs a benchmark for a specific RAG strategy."""
        results = {"relevance": [], "faithfulness": []}
        for q in queries:
            try:
                context, answer = rag_function(q)
                results["relevance"].append(self.evaluate_relevance(q, context))
                results["faithfulness"].append(self.evaluate_faithfulness(q, context, answer))
            except Exception:
                results["relevance"].append(0.0)
                results["faithfulness"].append(0.0)
        
        count = len(results["relevance"])
        return {
            "avg_relevance": sum(results["relevance"]) / count if count > 0 else 0,
            "avg_faithfulness": sum(results["faithfulness"]) / count if count > 0 else 0
        }
