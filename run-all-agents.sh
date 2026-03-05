#!/bin/bash
# Run all agents through the benchmark models + ollama
# Usage: bash run-all-agents.sh [--judge]

MODELS="ollama/llama3.2:latest,openai/gpt-5-nano,anthropic/claude-haiku-4-5,qwen/qwen3.5-27b"
AGENTS_DIR=~
CASES_DIR="$(dirname "$0")/cases"
DO_JUDGE=${1:-""}

AGENTS=(
  "skippy-agent"
  "melvin-agent"
  "mando-agent"
  "walle-agent"
  "doc-brown-agent"
  "caption-writer-agent"
)

RESULTS=()

for agent in "${AGENTS[@]}"; do
  AGENT_PATH="$AGENTS_DIR/$agent"
  CASES_FILE="$CASES_DIR/$agent.json"

  if [ ! -f "$AGENT_PATH/SOUL.md" ]; then
    echo "⚠ Skipping $agent — no SOUL.md"
    continue
  fi
  if [ ! -f "$CASES_FILE" ]; then
    echo "⚠ Skipping $agent — no cases file at $CASES_FILE"
    continue
  fi

  echo ""
  echo "████████████████████████████████████"
  echo "  AGENT: $agent"
  echo "████████████████████████████████████"

  RESULT=$(node "$(dirname "$0")/run.mjs" \
    --agent "$AGENT_PATH" \
    --cases "$CASES_FILE" \
    --models "$MODELS" \
    --concurrency 2 2>&1)

  echo "$RESULT"

  # Extract results file path
  RESULT_FILE=$(echo "$RESULT" | grep "Results saved to:" | sed 's/.*Results saved to: //')
  RESULTS+=("$RESULT_FILE")
done

echo ""
echo "════════════════════════════════════"
echo "  ALL RUNS COMPLETE"
echo "════════════════════════════════════"
echo "Result files:"
for f in "${RESULTS[@]}"; do echo "  $f"; done

if [ "$DO_JUDGE" = "--judge" ]; then
  echo ""
  echo "Running judge on all results..."
  for f in "${RESULTS[@]}"; do
    if [ -f "$f" ]; then
      echo "Judging: $f"
      node "$(dirname "$0")/judge.mjs" --results "$f" --judge "anthropic/claude-haiku-4-5"
    fi
  done
fi
