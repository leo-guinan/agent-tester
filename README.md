# MetaSPN Agent Tester

> Run any agent's SOUL.md through multiple models. Score the outputs. Find the best model for the task.

Built to answer a real question: when you have 6 AI agents in production, which model should each one run on?

---

## Quick Start

```bash
# Run an agent against specific models
node run.mjs --agent ~/caption-writer-agent --cases cases/caption-writer.json \
  --models "anthropic/claude-haiku-4-5,openai/gpt-5.3-chat,anthropic/claude-opus-4.6"

# Run all MetaSPN agents against all model tiers
bash run-all-agents.sh

# Judge the outputs
node judge.mjs --results benchmarks/2026-03-04/run-....json

# Generate report
node report.mjs --results benchmarks/2026-03-04/run-...-scored.json --open
```

---

## What's Here

```
agent-tester/
├── run.mjs              # Test runner — sends each case to each model via OpenRouter
├── judge.mjs            # Scorer — evaluates outputs with a judge model (0-10 + breakdown)
├── report.mjs           # Report generator — ranked markdown report
├── run-all-agents.sh    # Batch runner — all agents × all models
├── models.json          # Model registry with pricing (free, openai, anthropic, google groups)
│
├── cases/               # Test cases per agent
│   ├── skippy-agent.json
│   ├── melvin-agent.json
│   ├── mando-agent.json
│   ├── walle-agent.json
│   ├── doc-brown-agent.json
│   └── caption-writer.json
│
└── benchmarks/          # All historical runs, scored and raw
    └── 2026-03-04/      # First full benchmark run
        ├── model-comparison-report.md   ← Start here for results
        └── run-*.json
```

---

## Benchmark Results

### Latest: March 4–5, 2026

**[→ Full Report](benchmarks/2026-03-04/model-comparison-report.md)**

| Rank | Model | Skippy | Melvin | Mando | WALL-E | Doc Brown | **AVG** | Cost/call | Latency |
|------|-------|--------|--------|-------|--------|-----------|---------|-----------|---------|
| 1 | GPT-5.3-chat | 9.2 | 8.7 | 8.1 | 8.5 | 8.5 | **8.6** | $0.007 | 5s |
| 1 | Opus 4.6 | 9.2 | 8.2 | 8.4 | 9.2 | 8.2 | **8.6** | $0.020 | 16s |
| 3 | Haiku 4.5 | 8.7 | 8.2 | 7.5 | 8.5 | 7.7 | **8.1** | $0.0024 | 2s |
| 4 | Sonnet 4.6 | 8.9 | 8.5 | 7.9 | 8.6 | 5.5 | **7.9** | $0.011 | 12s |
| 5 | Qwen 3.5 27B | 8.9 | 7.9 | 6.5 | 7.6 | 8.2 | **7.8** | $0.007 | 40s |
| 6 | GPT-5-nano | 7.3 | 7.9 | 5.4 | 7.0 | 2.9 | **6.1** | $0.0004 | 26s |
| 7 | Ollama Llama 3.2 | 6.0 | 2.8 | 3.2 | 2.3 | 2.7 | **3.4** | $0 | 6s |

**Key findings:**
- **Haiku 4.5 is the default.** Best quality-per-dollar. No agent scores below 7.5.
- **GPT-5.3-chat is the ceiling.** Tied with Opus at 8.6 avg, 3× cheaper, 3× faster.
- **Opus earns its cost on signal extraction only.** WALL-E 9.2 — produces lines no other model writes.
- **Sonnet 4.6 collapses on Doc Brown** (5.5). Same family as Opus, different structural constraints.
- **GPT-5-nano needs 8000 max_tokens** or it outputs nothing (reasoning burns the budget). Fix before testing.

---

## Adding a New Agent

1. Create an agent repo with `SOUL.md` (and optionally `TOOLS.md`)
2. Add test cases at `cases/{agent-name}.json`
3. Run: `node run.mjs --agent ~/your-agent --cases cases/your-agent.json`

Test case format:
```json
[
  {
    "id": "case-id",
    "name": "Human-readable name",
    "user_message": "The exact message sent to the model",
    "context": "What good looks like — used by the judge"
  }
]
```

## Adding Agent Criteria (optional)

Create `criteria.md` in the agent repo for custom scoring rubric. Default scoring: voice accuracy, format compliance, specificity, hook quality.

---

## Models

See `models.json` for full registry. Groups: `free`, `openai`, `anthropic`, `google`. Ollama models prefix with `ollama/`.

```bash
# Free models only (no spend)
node run.mjs --agent ~/my-agent --cases cases/my-agent.json --groups free

# Specific models
node run.mjs --agent ~/my-agent --cases cases/my-agent.json \
  --models "anthropic/claude-haiku-4-5,openai/gpt-5.3-chat"

# With Ollama
node run.mjs --agent ~/my-agent --cases cases/my-agent.json \
  --models "ollama/llama3.2:latest,anthropic/claude-haiku-4-5"
```

---

## Routing Decisions Made From This Benchmark

**RedshirtAI Away Team** (`redshirt.metaspn.network`) updated to:

| Endpoint | Agent | Model | Rationale |
|----------|-------|-------|-----------|
| `/melvin-ask` | Melvin | Haiku 4.5 | 8.2/10, $0.0024, 2s |
| `/walle-sort` | WALL-E | Opus 4.6 | 9.2/10 — signal compression quality |
| `/mando-find` | Mando | GPT-5.3-chat | 8.1/10 — precision acquisition |
| `/skippy-verdict` | Skippy | GPT-5.3-chat | 9.2/10 — voice + specificity |
| `/doc-brown-forecast` | Doc Brown | GPT-5.3-chat | 8.5/10 — structural discipline |
| `/away-team-mission` | All | Multi-model | Benchmark-optimal per agent |

Pass `"budget": true` in request body for 3× cheaper routing.

---

## Requirements

- Node.js 20+
- OpenRouter API key at `~/.marvin/secrets/openrouter-api-key`
- Optional: Ollama running locally at `localhost:11434`

---

*MetaSPN | [agent-tester](https://github.com/leo-guinan/agent-tester)*
