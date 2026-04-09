import fs from "fs";
import path from "path";
import { groqEmbed } from "./groq";

type Chunk = { id: string; text: string; embedding?: number[] };

const DATA_PATH = path.join(process.cwd(), "data", "corpus.txt");

let INDEX: { chunks: Chunk[] } | null = null;

function chunkText(text: string, maxChars = 800) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of paragraphs) {
    if (p.length <= maxChars) {
      out.push(p);
    } else {
      let start = 0;
      while (start < p.length) {
        out.push(p.slice(start, start + maxChars));
        start += maxChars;
      }
    }
  }
  return out;
}

export async function ensureIndexBuilt() {
  if (INDEX) return;
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const chunksText = chunkText(raw, 800);
  const chunks: Chunk[] = chunksText.map((t, i) => ({ id: String(i), text: t }));
  for (const c of chunks) {
    try {
      c.embedding = await groqEmbed(c.text);
      await new Promise((r) => setTimeout(r, 50));
    } catch (err) {
      console.error("embed error for chunk:", c.id, err);
      c.embedding = Array(768).fill(0);
    }
  }
  INDEX = { chunks };
}

function cosine(a: number[], b: number[]) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function searchTopK(query: string, k = 3) {
  if (!INDEX) throw new Error("Index not built");
  const qEmb = await groqEmbed(query);
  const scored = INDEX.chunks.map((c) => ({
    text: c.text,
    score: cosine(qEmb, c.embedding || [])
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
