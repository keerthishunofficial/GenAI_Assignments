import type { NextApiRequest, NextApiResponse } from "next";
import { ensureIndexBuilt, searchTopK } from "../../lib/vectorStore";
import { groqComplete } from "../../lib/groq";

const PREDEFINED_QUERIES = [
  "When was Acme Research founded?",
  "What are the main features of AcmeVector?",
  "What's the API rate limit for ingestion?",
  "How do I integrate the Acme API in Python (brief steps)?",
  "What chunk size does Acme recommend for document ingestion?",
  "Does Acme store user data long-term?",
  "What are best practices for batch ingestion?",
  "Estimate time to embed 10,000 documents given a 100 req/min rate limit.",
  "What does Acme recommend for low-latency retrieval?",
  "Is there a CLI tool for ingestion and how does it work?"
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await ensureIndexBuilt();
    const results: Array<{ query: string; nonRag: string; rag: string }> = [];

    for (const q of PREDEFINED_QUERIES) {
      const nonRagPrompt = `Answer concisely:\n\n${q}`;
      const nonRagResp = await groqComplete(nonRagPrompt);

      const top = await searchTopK(q, 3);
      const context = top.map((t) => `- ${t.text}`).join("\n\n");
      const ragPrompt = `Use the following context excerpts to answer the question. If the answer isn't present, say "Not in corpus."\n\nContext:\n${context}\n\nQuestion: ${q}\n\nAnswer concisely:`;
      const ragResp = await groqComplete(ragPrompt);

      results.push({
        query: q,
        nonRag: nonRagResp.trim(),
        rag: ragResp.trim()
      });
    }

    res.status(200).json({ results });
  } catch (err: any) {
    console.error("runBatch error", err);
    res.status(500).send(String(err?.message || err));
  }
}
