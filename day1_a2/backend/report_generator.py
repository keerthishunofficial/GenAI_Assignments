from datetime import datetime
from typing import List
from .models import ImproveResult

def generate_markdown_report(results: List[ImproveResult]) -> str:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    report = f"""# Prompt Debugging & Evaluation Report
**Generated on**: {timestamp}

## Overview
This report contains a structured evaluation of 5 poorly performing prompts and their improved versions generated using the Groq API.

---

"""
    
    for res in results:
        report += f"""## Prompt {res.index} Evaluation

### ❌ Original Prompt (Weak)
> {res.original}

### ✅ Improved Prompt (Optimized)
```text
{res.improved}
```

### 💡 Why this is better
{res.explanation}

---
"""

    report += """
## Prompt Engineering Best Practices Used
| Technique | Description |
| :--- | :--- |
| **Role Assignment** | Assigning an expert persona to the LLM. |
| **Specificity** | Reducing ambiguity by being explicit about the task. |
| **Output Constraints** | Defining format, tone, and length limitations. |
| **Structured Thinking** | Encouraging step-by-step reasoning for complex tasks. |

---
**End of Report**
"""
    return report
