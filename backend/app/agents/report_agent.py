from app.llm.factory import get_llm


class ReportAgent:

    def __init__(self):
        self.llm = get_llm()

    def run(
        self,
        state,
    ) -> dict:

        user_request = state.get(
            "user_request",
            "",
        )

        results = state.get(
            "results",
            {},
        )

        prompt = f"""
You are the reporting component of an AI Data Analyst.

Your job is to explain the results produced by the
deterministic data-processing backend.

You DO NOT perform calculations.
You DO NOT modify the dataset.
You DO NOT invent statistics.

Use ONLY the results provided below.

User request:
{user_request}

Computed results:
{results}

Write a clear, concise natural-language response.

Rules:

1. Explain the important findings from the computed results.

2. Use the actual values from the results.

3. Do not invent statistics, values, columns, or findings.

4. Do not claim that a relationship is causal just because
   there is a correlation.

5. If the results are insufficient to answer the request,
   clearly say what is missing.

6. For multiple results, organize the response logically.

7. Mention important data-quality findings when they are
   present in the computed results.

8. Keep the explanation understandable to a normal user.

9. Answer the user's request directly.

Return ONLY the natural-language report.
"""

        print(">>> REPORT LLM CALL")
        response = self.llm.invoke(prompt)
        print("<<< REPORT LLM RETURNED")

        content = response.content

        # Gemini returned plain text
        if isinstance(content, str):
            return {
                "report": content
            }

        # Gemini returned structured content blocks
        if isinstance(content, list):

            text_parts = []

            for block in content:

                if isinstance(block, dict):

                    text = block.get("text")

                    if text:
                        text_parts.append(text)

            return {
                "report": "\n".join(text_parts)
            }

        # Fallback
        return {
            "report": str(content)
        }