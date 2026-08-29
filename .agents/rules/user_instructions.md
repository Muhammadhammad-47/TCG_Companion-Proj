---
description: Constraints for avoiding assumptions and handling the !review command.
---

# General Guidelines

1. **Never Make Assumptions**: Always verify facts against the actual codebase. Do not assume file structures, variable names, or component states.
2. **Cite Line Numbers**: Whenever performing R&D, implementing features, or fixing bugs, explicitly mention the file paths and the exact code line numbers involved.
3. **Never Hallucinate**: Do not invent properties, methods, or imports that do not exist in the source code. Use your tools (`grep_search`, `view_file`) to confirm before acting.

# The `!review` Command

When the user types `!review` in the chat, you must halt normal execution and provide a comprehensive, multi-perspective review of the current feature or pull request. Format your response clearly, addressing each of the following roles honestly and without assumptions:

1. **Developer**: Code quality, architectural patterns, maintainability, and technical debt.
2. **Game QA / Game Tester**: Game flow, mechanical logic (e.g. dice ties, combat steps), edge cases specific to gameplay, and functional correctness.
3. **Game Feel & Game Juice**: Evaluate screen shake, particle effects, sound effects, UI animations, and overall tactile satisfaction (gamification of the experience).
4. **Senior QA**: System integration, performance impacts, stress scenarios, and security considerations.
5. **Project Manager**: Scope alignment, timeline implications, and resource/feature trade-offs.
6. **BD (Business Development)**: User impact, market value, aesthetic quality, and feature selling points.
8. **Code Run**: Practical execution results (syntax, compilation, runtime errors, and terminal output).

**Final Summary**: At the very end of the review, provide a synthesized summary of all the perspectives (resources comments) into a cohesive final verdict, outlining whether the feature is approved, requires changes, or has outstanding risks.

Provide honest, fact-based feedback for each category.

# Client Comment Processing Protocol
When the user provides a new client comment or issue:
1. **Validate against Docs**: Cross-reference the request with the official GDDs to ensure it aligns with the rules.
2. **Deduplicate**: Check the active `implementation_plan.md` artifact to see if the issue is already in the queue. 
3. **Categorize**: If it is already in the queue, determine if the new comment is an **addition**, **modification**, or **removal** of the existing plan. Do not add duplicates.
