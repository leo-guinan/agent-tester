#!/usr/bin/env node
/**
 * agent-tester/run.mjs
 * Run any agent's SOUL.md through multiple models and collect outputs.
 *
 * Usage:
 *   node run.mjs --agent ~/caption-writer-agent --cases cases/caption-writer.json
 *   node run.mjs --agent ~/caption-writer-agent --cases cases/caption-writer.json --groups free,anthropic
 *   node run.mjs --agent ~/caption-writer-agent --cases cases/caption-writer.json --models "anthropic/claude-3-haiku,openai/gpt-4.1-nano"
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const OR_KEY = readFileSync(join(homedir(), '.marvin/secrets/openrouter-api-key'), 'utf8').trim();
const OR_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_LIST = JSON.parse(readFileSync(join(__dirname, 'models.json'), 'utf8'));

// --- CLI args ---
const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i+1] : null; };

const agentPath = resolve(get('--agent') || '.');
const casesPath = resolve(get('--cases') || join(agentPath, 'test-cases.json'));
const groupsArg = get('--groups');
const modelsArg = get('--models');
const outputDir = resolve(get('--output') || join(__dirname, 'results'));
const concurrency = parseInt(get('--concurrency') || '3');
const temperature = parseFloat(get('--temperature') || '0.7');

// --- Load agent ---
const soulPath = join(agentPath, 'SOUL.md');
const toolsPath = join(agentPath, 'TOOLS.md');

if (!existsSync(soulPath)) {
  console.error(`No SOUL.md found at ${soulPath}`);
  process.exit(1);
}

const soul = readFileSync(soulPath, 'utf8');
const tools = existsSync(toolsPath) ? readFileSync(toolsPath, 'utf8') : null;
const systemPrompt = tools
  ? `${soul}\n\n---\n\n${tools}`
  : soul;

// --- Load test cases ---
const cases = JSON.parse(readFileSync(casesPath, 'utf8'));
console.log(`Agent: ${agentPath}`);
console.log(`Cases: ${cases.length} test cases`);

// --- Resolve model list ---
let models = [];
if (modelsArg) {
  models = modelsArg.split(',').map(id => ({ id: id.trim(), label: id.trim() }));
} else if (groupsArg) {
  for (const g of groupsArg.split(',')) {
    if (MODEL_LIST.groups[g.trim()]) models.push(...MODEL_LIST.groups[g.trim()]);
    else console.warn(`Unknown group: ${g}`);
  }
} else {
  // Default: free + openai nano + haiku
  models = [
    ...MODEL_LIST.groups.free,
    MODEL_LIST.groups.openai[0],
    MODEL_LIST.groups.anthropic[0],
  ];
}

console.log(`Models: ${models.map(m => m.label).join(', ')}\n`);

// --- Runner ---
async function callModel(model, userMessage) {
  const start = Date.now();
  try {
    const res = await fetch(OR_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OR_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://metaspn.network',
        'X-Title': 'MetaSPN Agent Tester',
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: 400,
      }),
    });

    const data = await res.json();
    const latency = Date.now() - start;

    if (data.error) {
      return { model: model.id, label: model.label, error: data.error.message, latency };
    }

    const output = data.choices?.[0]?.message?.content?.trim() || '';
    const usage = data.usage || {};
    return {
      model: model.id,
      label: model.label,
      output,
      latency,
      tokens: { prompt: usage.prompt_tokens, completion: usage.completion_tokens },
    };
  } catch (e) {
    return { model: model.id, label: model.label, error: e.message, latency: Date.now() - start };
  }
}

// Run with concurrency limit
async function runPool(tasks, limit) {
  const results = [];
  const queue = [...tasks];
  const active = new Set();

  return new Promise((resolve) => {
    const next = () => {
      while (active.size < limit && queue.length > 0) {
        const task = queue.shift();
        const p = task().then(r => { results.push(r); active.delete(p); next(); });
        active.add(p);
      }
      if (active.size === 0 && queue.length === 0) resolve(results);
    };
    next();
  });
}

// --- Main ---
const allResults = [];

for (const tc of cases) {
  console.log(`\n=== Case: ${tc.name || tc.id} ===`);
  console.log(`Input: ${tc.user_message?.slice(0, 80)}...`);

  const tasks = models.map(model => async () => {
    process.stdout.write(`  [${model.label}] ... `);
    const r = await callModel(model, tc.user_message);
    if (r.error) {
      console.log(`✗ ${r.error.slice(0, 60)}`);
    } else {
      console.log(`✓ ${r.latency}ms | ${r.tokens?.completion || '?'} tokens`);
    }
    return { case_id: tc.id || tc.name, case_name: tc.name, ...r };
  });

  const caseResults = await runPool(tasks, concurrency);
  allResults.push({ case: tc, results: caseResults });
}

// --- Save results ---
mkdirSync(outputDir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outFile = join(outputDir, `run-${timestamp}.json`);
writeFileSync(outFile, JSON.stringify({ agent: agentPath, timestamp, models, cases, results: allResults }, null, 2));
console.log(`\n✓ Results saved to: ${outFile}`);
console.log(`\nNext: node judge.mjs --results ${outFile}`);
