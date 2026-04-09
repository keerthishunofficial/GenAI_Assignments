def generate_report(evaluated_prompts: list, output_path: str = "evaluation_report.md"):
    """
    Creates a markdown summary report from the evaluated prompts.
    """
    total_clarity = 0
    total_accuracy = 0
    total_conciseness = 0
    total_prompts = len(evaluated_prompts)

    if total_prompts == 0:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("# Evaluation Report\n\nNo prompts were generated or evaluated.")
        return output_path

    for p in evaluated_prompts:
        eval_scores = p.get("evaluation", {})
        total_clarity += float(eval_scores.get("clarity", 0) or 0)
        total_accuracy += float(eval_scores.get("accuracy", 0) or 0)
        total_conciseness += float(eval_scores.get("conciseness", 0) or 0)

    avg_clarity = total_clarity / total_prompts
    avg_accuracy = total_accuracy / total_prompts
    avg_conciseness = total_conciseness / total_prompts

    lines = [
        "# Prompt Library Evaluation Summary\n",
        "## Overall Metrics\n",
        f"- **Average Clarity**: {avg_clarity:.2f} / 5.0",
        f"- **Average Accuracy**: {avg_accuracy:.2f} / 5.0",
        f"- **Average Conciseness**: {avg_conciseness:.2f} / 5.0\n",
        "---\n",
        "## Detailed Breakdown\n",
    ]

    for idx, item in enumerate(evaluated_prompts):
        scenario = item.get("scenario", f"Scenario {idx + 1}")
        eval_data = item.get("evaluation", {})
        user_prompt = item.get("user_prompt_example", "")
        test_output = item.get("test_output", "")

        lines.append(f"### {idx + 1}. {scenario}\n")
        lines.append(f"**User Prompt Example:** `{user_prompt}`\n")
        lines.append(f"**AI Output Excerpt:** {str(test_output)[:200]}...\n")
        lines.append(f"| Metric | Score |")
        lines.append(f"|--------|-------|")
        lines.append(f"| Clarity | {eval_data.get('clarity', 'N/A')} / 5 |")
        lines.append(f"| Accuracy | {eval_data.get('accuracy', 'N/A')} / 5 |")
        lines.append(f"| Conciseness | {eval_data.get('conciseness', 'N/A')} / 5 |")
        lines.append(f"\n**Judge Feedback:** *{eval_data.get('feedback', 'No feedback provided.')}*\n")
        lines.append("---\n")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    return output_path
