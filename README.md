# Agent Tester

Run any agent's SOUL.md through multiple models. Find the best model for the task. Tune the prompt. Repeat.

## Quick Start

```bash
# 1. Run free models (no spend)
node run.mjs --agent ~/caption-writer-agent --cases cases/caption-writer.json --groups free

# 2. Run specific models
node run.mjs --agent ~/caption-writer-agent --cases cases/caption-writer.json \
  --models "anthropic/claude-3-haiku,openai/gpt-4.1-nano,meta-llama/llama-3.3-70b-instruct:free"

# 3. Run all groups
node run.mjs --agent ~/caption-writer-agent --cases cases/caption-writer.json \
  --groups free,openai,anthropic

# 4. Judge the results
node judge.mjs --results results/run-2026-03-04T...json

# 5. Generate report
node report.mjs --results results/run-...-scored.json --open
```

## How It Works

1. **`run.mjs`** — Loads `SOUL.md` (+ `TOOLS.md` if present) as system prompt. Sends each test case to each model via OpenRouter. Saves raw outputs.

2. **`judge.mjs`** — Sends each output to a judge model with scoring criteria. Returns score (0-10) + breakdown (voice, format, specificity, hook) + best line + worst issue.

3. **`report.mjs`** — Builds a ranked markdown report with leaderboard + per-case outputs.

## Adding Test Cases

Create a JSON file at `cases/{agent-name}.json`:
```json
[
  {
    "id": "case-id",
    "name": "Human-readable name",
    "user_message": "The exact message sent to the model",
    "context": "Context for the judge about what good looks like"
  }
]
```

## Adding Agent Criteria

Create `criteria.md` in the agent repo:
```markdown
## Scoring Criteria
- 0-2: Output violates core voice or format rules
- 3-5: Functional but generic
- 6-7: Good voice, minor issues
- 8-9: Nails the persona, specific, correct format
- 10: Would post immediately without editing
```

## Models

See `models.json` for the full list. Groups: `free`, `openai`, `anthropic`, `google`.

Free models cost $0. OpenAI/Anthropic/Google billed at OpenRouter rates.

## OpenRouter Key

Stored at `~/.marvin/secrets/openrouter-api-key`.
