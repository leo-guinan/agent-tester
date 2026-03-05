#!/usr/bin/env node
/**
 * agent-tester/judge.mjs
 * Score outputs from a run using a judge model.
 *
 * Usage:
 *   node judge.mjs --results results/run-2026-03-04.json
 *   node judge.mjs --results results/run-2026-03-04.json --judge anthropic/claude-3-5-haiku
 *   node judge.mjs --results results/run-2026-03-04.json --criteria path/to/criteria.md
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const OR_KEY = readFileSync(join(homedir(), '.marvin/secrets/openrouter-api-key'), 'utf8').trim();
const OR_URL = 'https://openrouter.ai/api/v1/chat/completions';

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i+1] : null; };

const resultsPath = resolve(get('--results') || '');
const judgeModel = get('--judge') || 'anthropic/claude-3-5-haiku';
const criteriaOverride = get('--criteria');

if (!resultsPath) { console.error('--results required'); process.exit(1); }

const run = JSON.parse(readFileSync(resultsPath, 'utf8'));

// Load criteria: prefer --criteria flag, else look for criteria.md in agent dir
let criteria = null;
if (criteriaOverride) {
  criteria = readFileSync(resolve(criteriaOverride), 'utf8');
} else {
  const agentCriteriaPath = join(run.agent, 'criteria.md');
  try { criteria = readFileSync(agentCriteriaPath, 'utf8'); } catch {}
}

const JUDGE_SYSTEM = `You are an objective evaluator scoring AI agent outputs.
Score each output on the criteria provided. Return ONLY valid JSON.
Be calibrated: a score of 7/10 means genuinely good. 10/10 is rare.
Penalize heavily for: banned phrases, wrong format, missing required elements, hallucination.`;

async function judgeOutput(caseName, userMessage, output, caseContext) {
  if (!output) return { score: 0, breakdown: {}, reasoning: 'No output (error)' };

  const prompt = `## Task Context
${caseContext ? caseContext : 'Evaluate the output for quality and adherence to the agent\'s guidelines.'}

${criteria ? `## Evaluation Criteria\n${criteria}\n` : ''}

## Test Case
Input: "${userMessage}"

## Output to Evaluate
${output}

## Instructions
Score this output from 0-10. Return JSON with this exact shape:
{
  "score": <0-10 float>,
  "breakdown": {
    "voice_accuracy": <0-10>,
    "format_compliance": <0-10>,
    "specificity": <0-10>,
    "hook_quality": <0-10>
  },
  "best_line": "<the strongest single line from the output>",
  "worst_issue": "<the biggest problem, or 'none'>",
  "reasoning": "<2 sentences max>"
}`;

  try {
    const res = await fetch(OR_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OR_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://metaspn.network',
      },
      body: JSON.stringify({
        model: judgeModel,
        messages: [
          { role: 'system', content: JUDGE_SYSTEM },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    // Extract JSON from response
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return { score: 0, reasoning: 'Judge returned non-JSON: ' + text.slice(0, 100) };
  } catch (e) {
    return { score: 0, reasoning: 'Judge error: ' + e.message };
  }
}

// Run judging
console.log(`Judge model: ${judgeModel}`);
console.log(`Scoring ${run.results.length} cases...\n`);

const scored = [];

for (const { case: tc, results } of run.results) {
  console.log(`Case: ${tc.name || tc.id}`);
  const scoredResults = [];

  for (const r of results) {
    if (r.error) {
      scoredResults.push({ ...r, judgment: { score: 0, reasoning: 'Error: ' + r.error } });
      console.log(`  ${r.label}: ERROR — skipped`);
      continue;
    }
    process.stdout.write(`  [${r.label}] judging... `);
    const judgment = await judgeOutput(tc.name, tc.user_message, r.output, tc.context);
    scoredResults.push({ ...r, judgment });
    console.log(`score: ${judgment.score}/10`);
    await new Promise(res => setTimeout(res, 300)); // rate limit
  }

  scored.push({ case: tc, results: scoredResults });
}

// Build summary table
console.log('\n' + '='.repeat(70));
console.log('RESULTS SUMMARY');
console.log('='.repeat(70));

// Aggregate per model
const modelScores = {};
for (const { results } of scored) {
  for (const r of results) {
    if (!modelScores[r.label]) modelScores[r.label] = { scores: [], latencies: [], errors: 0 };
    if (r.judgment?.score != null) {
      modelScores[r.label].scores.push(r.judgment.score);
      modelScores[r.label].latencies.push(r.latency || 0);
    } else {
      modelScores[r.label].errors++;
    }
  }
}

const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : 'N/A';
const sorted = Object.entries(modelScores).sort(([, a], [, b]) => avg(b.scores) - avg(a.scores));

console.log(`\n${'Model'.padEnd(35)} ${'Avg Score'.padEnd(12)} ${'Avg Latency'.padEnd(14)} Errors`);
console.log('-'.repeat(70));
for (const [label, s] of sorted) {
  console.log(
    `${label.padEnd(35)} ${(avg(s.scores) + '/10').padEnd(12)} ${(avg(s.latencies) + 'ms').padEnd(14)} ${s.errors}`
  );
}

// Per-case breakdown
console.log('\n' + '='.repeat(70));
console.log('PER-CASE BREAKDOWN');
for (const { case: tc, results } of scored) {
  console.log(`\n[${tc.name}]`);
  const sorted = results.filter(r => r.judgment?.score != null).sort((a, b) => b.judgment.score - a.judgment.score);
  for (const r of sorted.slice(0, 3)) {
    console.log(`  #${sorted.indexOf(r)+1} ${r.label}: ${r.judgment.score}/10`);
    if (r.judgment.best_line) console.log(`     Best: "${r.judgment.best_line}"`);
    if (r.judgment.worst_issue && r.judgment.worst_issue !== 'none') console.log(`     Issue: ${r.judgment.worst_issue}`);
  }
}

// Save scored results
const outPath = resultsPath.replace('.json', '-scored.json');
writeFileSync(outPath, JSON.stringify({ ...run, judge: judgeModel, scored }, null, 2));
console.log(`\n✓ Scored results saved to: ${outPath}`);
console.log(`\nNext: node report.mjs --results ${outPath}`);
