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
const OLLAMA_URL = 'http://localhost:11434/v1/chat/completions';
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
    if (g === 'ollama') models.push(...MODEL_LIST.ollama);
    else if (MODEL_LIST.groups[g.trim()]) models.push(...MODEL_LIST.groups[g.trim()]);
    else console.warn(`Unknown group: ${g}`);
  }
} else {
  // Default: ollama + the three benchmark models
  models = [
    ...MODEL_LIST.ollama,
    MODEL_LIST.groups.openai.find(m => m.id.includes('gpt-5-nano')),
    MODEL_LIST.groups.anthropic.find(m => m.id.includes('haiku-4-5')),
    { id: 'qwen/qwen3.5-27b', label: 'Qwen 3.5 27B' },
  ].filter(Boolean);
}

console.log(`Models: ${models.map(m => m.label).join(', ')}\n`);

// Pricing per token (from models.json pricing data)
const PRICING = {
  'qwen/qwen3.5-27b':          { prompt: 0.000000195, completion: 0.00000156 },
  'anthropic/claude-haiku-4-5': { prompt: 0.000001,    completion: 0.000005   },
  'openai/gpt-5-nano':         { prompt: 0.00000005,  completion: 0.0000004  },
  // Free models
  'meta-llama/llama-3.2-3b-instruct:free':  { prompt: 0, completion: 0 },
  'meta-llama/llama-3.3-70b-instruct:free': { prompt: 0, completion: 0 },
};

function estimateCost(modelId, promptTokens, completionTokens) {
  const p = PRICING[modelId];
  if (!p) return null;
  return (promptTokens || 0) * p.prompt + (completionTokens || 0) * p.completion;
}

// --- Runner ---
async function callModel(model, userMessage) {
  const start = Date.now();
  const isOllama = model.id.startsWith('ollama/');
  const ollamaModel = isOllama ? model.id.replace('ollama/', '') : null;

  try {
    const url = isOllama ? OLLAMA_URL : OR_URL;
    const headers = isOllama
      ? { 'Content-Type': 'application/json' }
      : {
          'Authorization': `Bearer ${OR_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://metaspn.network',
          'X-Title': 'MetaSPN Agent Tester',
        };

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: isOllama ? ollamaModel : model.id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: 800,  // Reasoning models need budget before they output
      }),
    });

    const data = await res.json();
    const latency = Date.now() - start;

    if (data.error) {
      return { model: model.id, label: model.label, error: data.error.message, latency };
    }

    const msg = data.choices?.[0]?.message || {};
    // Reasoning models (o1/o3/gpt-5-nano) may return content=null with text in reasoning_details
    // or in a separate output array — fall through to find text
    let output = msg.content?.trim() || '';
    if (!output && msg.reasoning_details) {
      // Extract summary text if direct content is absent
      const summary = msg.reasoning_details.find(d => d.type === 'reasoning.summary');
      output = summary?.summary?.trim() || '';
    }
    const usage = data.usage || {};
    const promptTok = usage.prompt_tokens || 0;
    const completionTok = usage.completion_tokens || 0;
    return {
      model: model.id,
      label: model.label,
      output,
      latency,
      tokens: { prompt: promptTok, completion: completionTok, reasoning: usage.reasoning_tokens },
      cost_usd: estimateCost(model.id, promptTok, completionTok),
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
