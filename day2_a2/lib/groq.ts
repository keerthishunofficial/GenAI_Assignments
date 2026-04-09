import fetch from "node-fetch";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_BASE = process.env.GROQ_API_BASE || "https://api.groq.ai";
const MOCK = process.env.GROQ_MOCK === "true";

if (!GROQ_API_KEY && !MOCK) {
  console.warn("GROQ_API_KEY not set. Set it in .env.local before running.");
}

function simpleHashVector(text: string, dim = 128) {
  const codes = Array.from(text).map((c) => c.charCodeAt(0));
  const out: number[] = new Array(dim);
  const base = codes.reduce((a, b) => a + b, 0) || 1;
  for (let i = 0; i < dim; i++) {
    // deterministic but simple pseudo-random value based on text and index
    let s = 0;
    for (let j = 0; j < codes.length; j += (i % 7) + 1) {
      s += codes[j] * (i + 1) * (j + 1);
    }
    out[i] = ((s % (base + 997)) / (base + 997));
  }
  return out;
}

export async function groqComplete(prompt: string) {
  if (MOCK) {
    // If a RAG-style prompt with 'Context:' exists, synthesize answer from context excerpts
    const contextMatch = prompt.match(/Context:\n([\s\S]*?)\n\nQuestion:/);
    if (contextMatch) {
      const ctx = contextMatch[1]
        .split(/\n\n/)
        .map((s) => s.replace(/^-\s*/, "").trim())
        .filter(Boolean);
      if (ctx.length === 0) return "Not in corpus.";
      // Return a short synthesized answer by joining first clauses of each snippet
      const summary = ctx
        .slice(0, 3)
        .map((s) => s.split(/[:.]/)[0].trim())
        .join("; ");
      return `MockAnswer: ${summary}`;
    }

    // For non-RAG prompts, return a concise mock completion that echoes the question
    const qMatch = prompt.match(/(?:Question:)?\s*([\s\S]{1,400})$/);
    const q = qMatch ? qMatch[1].trim() : prompt.trim().slice(0, 200);
    return `MockCompletion: ${q.split("\n")[0].slice(0, 300)}`;
  }

  // Real Groq completion path
  const url = `${GROQ_API_BASE}/v1/completions`;
  const body = {
    model: process.env.GROQ_MODEL || "groq-1",
    prompt,
    max_tokens: 400,
    temperature: 0.2
  };

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Groq completion error ${r.status}: ${txt}`);
  }

  const json = await r.json();
  if (json.choices && json.choices[0]?.text) return json.choices[0].text;
  if (json.output && Array.isArray(json.output) && json.output[0]?.content) {
    return typeof json.output[0].content === "string"
      ? json.output[0].content
      : Array.isArray(json.output[0].content)
      ? json.output[0].content.join(" ")
      : JSON.stringify(json.output[0].content);
  }
  return JSON.stringify(json);
}

export async function groqEmbed(text: string) {
  if (MOCK) {
    // return deterministic pseudo-embedding vector
    return simpleHashVector(text, 128);
  }

  const url = `${GROQ_API_BASE}/v1/embeddings`;
  const body = {
    model: process.env.GROQ_EMBED_MODEL || "groq-embed-1",
    input: text
  };
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Groq embed error ${r.status}: ${txt}`);
  }
  const json = await r.json();
  if (json.data && json.data[0]?.embedding) return json.data[0].embedding as number[];
  if (json.embedding) return json.embedding as number[];
  throw new Error("Unexpected embeddings response shape: " + JSON.stringify(json));
}
