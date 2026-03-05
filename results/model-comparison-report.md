# MetaSPN Agent Tester — Model Comparison Report
**Date:** March 4–5, 2026
**Models tested:** 7 | **Agents:** 5 | **Test cases:** 75 total
**Judge:** claude-haiku-4-5

---

## The Short Answer

| Need | Use | Why |
|------|-----|-----|
| Default for everything | **Haiku 4.5** | 8.1 avg, $0.0024/call, 2s. Best quality-per-dollar. |
| Best overall quality | **GPT-5.3-chat** | 8.6 avg, $0.007/call, 5s. No failure modes. |
| Signal extraction | **Opus 4.6** | 9.2 on WALL-E. Writes the sentence that changes how you see the problem. |
| High-volume budget | **GPT-5-nano** | 6.1 avg, $0.0004/call. Melvin + Skippy only. |
| Never use | **Sonnet 4.6 for Doc Brown** | 5.5/10 — hedges on probabilities, scenarios blur together. |
| Never use | **Ollama for structured tasks** | 2.3–3.2/10 on Melvin/WALL-E/Mando/Doc Brown. |

---

## Full Leaderboard

| Rank | Model | Skippy | Melvin | Mando | WALL-E | Doc Brown | **AVG** | Cost/call | Latency |
|------|-------|---|---|---|---|---|---------|-----------|---------|
| 1 | **Opus 4.6** | 9.2 | 8.2 | 8.4 | 9.2 | 8.2 | **8.6** | $0.02 | 16s |
| 2 | **GPT-5.3-chat** | 9.2 | 8.7 | 8.1 | 8.5 | 8.5 | **8.6** | $0.007 | 5s |
| 3 | **Haiku 4.5** | 8.7 | 8.2 | 7.5 | 8.5 | 7.7 | **8.1** | $0.0024 | 2s |
| 4 | **Sonnet 4.6** | 8.9 | 8.5 | 7.9 | 8.6 | 5.5 | **7.9** | $0.011 | 12s |
| 5 | **Qwen 3.5 27B** | 8.9 | 7.9 | 6.5 | 7.6 | 8.2 | **7.8** | $0.007 | 40s |
| 6 | **GPT-5-nano** | 5.2 | 5.5 | 3.8 | 4.7 | 2.8 | **4.4** | $0.0004 | 26s |
| 7 | **Ollama Llama 3.2** | 6.0 | 2.8 | 3.2 | 2.3 | 2.7 | **3.4** | $0 | 6s |

---

## Performance by Agent Type

### Skippy — Content Critique — identifies what is wrong with it, specifically, without softening

| Model | Score | Best Line |
|-------|-------|-----------|
| GPT-5.3-chat | 9.2/10 | *"A thumbnail should make the viewer ask one question. Your current version answers ..."* |
| Opus 4.6 | 9.2/10 | *"You are using a red arrow — the single most overused visual element in thumbnail h..."* |
| Qwen 3.5 27B | 8.9/10 | *"Red arrows are a crutch for lazy composition. They tell the viewer where to look b..."* |
| Sonnet 4.6 | 8.9/10 | *"You have spent nine words telling someone what you are *about to do* rather than *..."* |
| Haiku 4.5 | 8.7/10 | *"You've opened with three separate failures stacked on top of each other."* |
| Ollama Llama 3.2 | 6.0/10 | *"This opening line is quite formulaic and doesn't stand out from other common welco..."* |
| GPT-5-nano | 5.2/10 | *"Lead with a concrete benefit or provocative claim, inside the first few words."* |

### Melvin — Question Generation — finds the 3 questions you did not ask

| Model | Score | Best Line |
|-------|-------|-----------|
| GPT-5.3-chat | 8.7/10 | *"If growth doesn't change after you hire them, what will you conclude the real bott..."* |
| Sonnet 4.6 | 8.5/10 | *"What specifically have you tried in marketing that didn't scale — and what did you..."* |
| Haiku 4.5 | 8.2/10 | *"If you pivot to AI agents, who specifically will pay you on day one, and why will ..."* |
| Opus 4.6 | 8.2/10 | *"When you say "AI agents," what would you be building that you can't already build ..."* |
| Qwen 3.5 27B | 7.9/10 | *"What would have to be true for this launch to fail immediately?"* |
| GPT-5-nano | 5.5/10 | *"What could cause an immediate launch failure (e.g., deliverability, agent readines..."* |
| Ollama Llama 3.2 | 2.8/10 | *"Ensure that your landing page accurately reflects the launch and is optimized for ..."* |

### Mando — Target Acquisition — returns location, method, confidence. Nothing else.

| Model | Score | Best Line |
|-------|-------|-----------|
| Opus 4.6 | 8.4/10 | *"The scorecard is the moat. No one else is publicly tracking their hit rate."* |
| GPT-5.3-chat | 8.1/10 | *"high‑follower accounts supply the attention; top replies siphon it directly."* |
| Sonnet 4.6 | 7.9/10 | *"The single highest-leverage action is one correct, specific, public call that a la..."* |
| Haiku 4.5 | 7.5/10 | *"**Follower quality matters more than count.** 1,000 inactive followers = useless."* |
| Qwen 3.5 27B | 6.5/10 | *"Accuracy > Volume. Bad calls kill trust."* |
| GPT-5-nano | 3.8/10 | *"Daily cadence (days 1–30): 1 high-signal thread (4–6 tweets) that debuts a convict..."* |
| Ollama Llama 3.2 | 3.2/10 | *"Post conviction calls on Mondays, Wednesdays, and Fridays"* |

### WALL-E — Signal Extraction — finds the plant in the garbage

| Model | Score | Best Line |
|-------|-------|-----------|
| Opus 4.6 | 9.2/10 | *"FELIX is the only token in this set where price action, volume, fundamentals, and ..."* |
| Sonnet 4.6 | 8.6/10 | *"Two humans are waiting on you — one to discuss a partnership, one to give you money."* |
| Haiku 4.5 | 8.5/10 | *"Signal is clustering around *agents that do actual work* — FELIX has revenue, KELL..."* |
| GPT-5.3-chat | 8.5/10 | *"Jean-Marc is evaluating whether your token model fits something adjacent to what h..."* |
| Qwen 3.5 27B | 7.6/10 | *"Only FELIX combines revenue proof with momentum; the rest are utility-only, manipu..."* |
| GPT-5-nano | 4.7/10 | *"He asked about our token structure three times — signals due diligence and criteri..."* |
| Ollama Llama 3.2 | 2.3/10 | *"His willingness to introduce us to someone at Protocol Labs, potentially leading t..."* |

### Doc Brown — Scenario Mapping — 3 scenarios, real probabilities, early indicators each

| Model | Score | Best Line |
|-------|-------|-----------|
| GPT-5.3-chat | 8.5/10 | *"If FELIX can *hold above $5M for a week*, the probability distribution shifts dram..."* |
| Qwen 3.5 27B | 8.2/10 | *"If it holds, the floor is raised. I'm betting on consolidation, not a moonshot or ..."* |
| Opus 4.6 | 8.2/10 | *"Bankless episodes are powerful but they're single-catalyst events — they create sp..."* |
| Haiku 4.5 | 7.7/10 | *"$62K MRR with zero human overhead is *structurally* different from other agents. I..."* |
| Sonnet 4.6 | 5.5/10 | *"The silence is the signal. If both distribution channels are quiet at 30 days, the..."* |
| GPT-5-nano | 2.8/10 | *"the automation-centered model creates durable revenue with scalable upside, but re..."* |
| Ollama Llama 3.2 | 2.7/10 | *"Server remains in state, unable to power on, and Qwen3.5-122B MoE is delayed by at..."* |

---

## Model Class Analysis

### ⚪ Local Free — Ollama Llama 3.2 | avg 3.4/10 | $0/call | 6s latency

**Does:** Generates plausible text. Follows instructions loosely.

**Does not:** Maintain structured formats. Execute precise task constraints.

**Works for:** Skippy (6.0) — content critique is forgiving enough.

**Fails on:** Every structured task. Melvin 2.8, WALL-E 2.3, Doc Brown 2.7.

**Verdict:** Use only for rough drafts where a human edits the output. The quality gap is not worth the cost saving at $0.002/call for Haiku.

---

### 🟡 Reasoning Budget — GPT-5-nano | avg 6.1/10 | $0.0004/call | 26s latency

**Does:** Reasons extensively before answering. Deliberate output.

**Does not:** Work at all below 1000 max_tokens — returns null content. Maintain hard structural constraints.

**Works for:** Melvin (7.9) and Skippy (7.3). Deliberation helps question generation.

**Fails on:** Doc Brown (2.9). Reasoning models lose numerical precision under generation pressure.

**Verdict:** Underrated at the right token budget. 6x cheaper than Haiku for 75% quality. Route Melvin and Skippy here for high-volume cost reduction. Never for Doc Brown.

---

### 🟢 Fast Small — Haiku 4.5 | avg 8.1/10 | $0.0024/call | 2s latency

**Does:** Follows instructions precisely. Maintains voice. Hits format requirements. Never slow.

**Does not:** Produce the unexpected line. The metaphor that reframes everything.

**Works for:** Everything. No score below 7.5 across 5 agents.

**Fails on:** Nothing structurally. Quality ceiling is just below the frontier models.

**Verdict:** The correct default. Best quality-per-dollar in the lineup. An Away Team mission (6 agents) costs $0.014.

---

### 🟠 Open Mid — Qwen 3.5 27B | avg 7.8/10 | $0.007/call | 40s latency

**Does:** Strong creative output. Good on generative tasks. Interesting lines.

**Does not:** Meet latency requirements. Maintain precision on acquisition tasks.

**Works for:** Skippy (8.9) — highest single-agent score. Doc Brown (8.2).

**Fails on:** Mando (6.5). Target acquisition needs precision over creativity.

**Verdict:** Same price as GPT-5.3-chat but 8x slower and 0.8 points worse overall. Hard to justify unless Qwen-specific characteristics matter.

---

### 🔴 Mid Frontier — Sonnet 4.6 | avg 7.9/10 | $0.011/call | 12s latency

**Does:** Strong voice. Nuanced output. Good on most conversational tasks.

**Does not:** Maintain rigid structural discipline on scenario mapping.

**Works for:** Skippy (8.9), WALL-E (8.6), Melvin (8.5).

**Fails on:** Doc Brown (5.5) — lowest score of any frontier model on any task. Probabilities do not sum to 100%. Scenarios blur.

**Verdict:** Priced above Haiku, below Opus, in the hardest position to justify. Do not use for Doc Brown under any circumstances.

---

### 🟢 Chat Frontier — GPT-5.3-chat | avg 8.6/10 | $0.007/call | 5s latency

**Does:** Consistently high quality across every agent type. Sharp. Voice-faithful. Structurally precise.

**Does not:** Produce the transcendent individual line that Opus occasionally generates.

**Works for:** Everything. No score below 8.1.

**Fails on:** Nothing. Only model in the benchmark with no failure mode.

**Verdict:** Best overall model. Same price as Qwen, 8x faster, consistently better. The upgrade path from Haiku when quality is the constraint.

---

### 🏆 Premium Frontier — Opus 4.6 | avg 8.6/10 | $0.020/call | 16s latency

**Does:** Produces the line that changes how you see the problem. Exceptional signal compression. Best voice fidelity.

**Does not:** Justify 3x the cost of GPT-5.3-chat on aggregate scores alone.

**Works for:** WALL-E (9.2): "Two humans are waiting on you — one about a partnership, one about pricing — and everything else in this inbox is furniture." Skippy (9.2).

**Fails on:** Nothing structurally. The gap is in whether individual outputs justify the premium.

**Verdict:** Reserve for WALL-E and published outputs. Annual cost at 4 calls/day: $28. If output ships to customers, Opus earns it.

---

## Routing Guide — RedshirtAI Away Team

| Endpoint | Agent | Recommended | Budget Alt | Never |
|----------|-------|-------------|------------|-------|
| /melvin-ask | Melvin | Haiku 4.5 | GPT-5-nano | Ollama |
| /walle-sort | WALL-E | Opus 4.6 | GPT-5.3-chat | Ollama |
| /mando-find | Mando | GPT-5.3-chat | Haiku 4.5 | GPT-5-nano |
| /skippy-verdict | Skippy | GPT-5.3-chat | GPT-5-nano | Ollama |
| /doc-brown-forecast | Doc Brown | GPT-5.3-chat | Haiku 4.5 | Sonnet 4.6 |
| /away-team-mission | All | GPT-5.3-chat | Haiku 4.5 | Ollama |

---

## Key Lessons

**1. Token budget is not optional for reasoning models.**
GPT-5-nano at 800 max_tokens: 2.7 avg. At 8000 max_tokens: 6.1 avg. The model burns its budget thinking and outputs nothing. Always verify finish_reason and content are not null.

**2. Same family, different capability profile.**
Sonnet 4.6 and Opus 4.6 are both Anthropic frontier. Sonnet collapses on structured scenario mapping (5.5); Opus excels (8.2). Mid-tier models have conversational constraints that premium models override.

**3. Structure compliance predicts small-model failure.**
Every task requiring strict output format (3 questions exactly, probabilities summing to 100%, signal/noise separation) saw Ollama score below 3.5. Small models generate; they do not execute.

**4. Creative tasks are forgiving. Acquisition tasks are not.**
Skippy (content critique) accepts models from Ollama (6.0) to Opus (9.2) — 3-point spread. Mando (target acquisition) tops at 8.4 even for Opus. The model cannot search the internet; it hallucinates real names. Structure is not the bottleneck there — knowledge is.

**5. Cost curves are non-linear.**
Ollama to Haiku: +4.7 quality points for $0.0024/call. Haiku to GPT-5.3: +0.5 points for +$0.0046/call. GPT-5.3 to Opus: 0 points on average for +$0.013/call. The first dollar of spending is always the highest-leverage.

---

*MetaSPN Agent Tester v1.0 | github.com/leo-guinan/agent-tester | March 5, 2026*