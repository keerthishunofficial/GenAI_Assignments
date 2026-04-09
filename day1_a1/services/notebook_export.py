import json


def _escape_for_notebook_str(text: str) -> str:
    """Escape text so it's safe to embed as a Python string literal inside a notebook code cell."""
    return text.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n").replace("\r", "")


def construct_notebook(evaluated_prompts: list, output_path: str = "prompt_library.ipynb"):
    cells = []

    # ── Title cell ────────────────────────────────────────────────────────────
    cells.append({
        "cell_type": "markdown",
        "metadata": {},
        "source": [
            "# Customer Support Prompt Library\n",
            "\n",
            "Auto-generated via Groq API. Contains system & user prompt templates for customer support,\n",
            "plus automated LLM-as-a-Judge evaluation scores (Clarity · Accuracy · Conciseness).\n",
        ]
    })

    # ── Summary table cell ────────────────────────────────────────────────────
    table_rows = ["| # | Scenario | Clarity | Accuracy | Conciseness |\n",
                  "|---|----------|---------|----------|-------------|\n"]
    for idx, item in enumerate(evaluated_prompts):
        ev = item.get("evaluation", {})
        table_rows.append(
            f"| {idx+1} | {item.get('scenario', '?')} "
            f"| {ev.get('clarity', '?')}/5 "
            f"| {ev.get('accuracy', '?')}/5 "
            f"| {ev.get('conciseness', '?')}/5 |\n"
        )

    cells.append({
        "cell_type": "markdown",
        "metadata": {},
        "source": ["## Evaluation Summary\n", "\n"] + table_rows
    })

    # ── One section per prompt ────────────────────────────────────────────────
    for idx, item in enumerate(evaluated_prompts):
        scenario    = item.get("scenario", f"Scenario {idx+1}")
        sys_prompt  = item.get("system_prompt", "")
        user_prompt = item.get("user_prompt_example", "")
        test_output = item.get("test_output", "")
        evaluation  = item.get("evaluation", {})

        # Markdown header cell
        cells.append({
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                f"---\n",
                f"## {idx+1}. {scenario}\n",
                f"\n",
                f"**System Prompt:** {sys_prompt}\n",
                f"\n",
                f"**Example User Message:** {user_prompt}\n",
            ]
        })

        # Code cell holding the data and a quick print
        sys_esc  = _escape_for_notebook_str(sys_prompt)
        user_esc = _escape_for_notebook_str(user_prompt)
        out_esc  = _escape_for_notebook_str(str(test_output))
        eval_str = json.dumps(evaluation, ensure_ascii=False)

        var = f"p{idx+1}"
        code_lines = [
            f'{var}_system  = "{sys_esc}"\n',
            f'{var}_user    = "{user_esc}"\n',
            f'{var}_output  = "{out_esc}"\n',
            f'{var}_eval    = {eval_str}\n',
            "\n",
            f'print("=== {scenario} ===")\n',
            f'print(f\'Clarity:     {{{var}_eval.get(\"clarity\")}}/5\')\n',
            f'print(f\'Accuracy:    {{{var}_eval.get(\"accuracy\")}}/5\')\n',
            f'print(f\'Conciseness: {{{var}_eval.get(\"conciseness\")}}/5\')\n',
            f'print(f\'Feedback:    {{{var}_eval.get(\"feedback\")}}\')\n',
        ]

        cells.append({
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": code_lines
        })

    notebook = {
        "cells": cells,
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "name": "python",
                "version": "3.10.0"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 5
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(notebook, f, indent=2, ensure_ascii=False)

    return output_path
