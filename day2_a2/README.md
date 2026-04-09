# Groq RAG vs Non-RAG comparison

Minimal Next.js app that compares Groq LLM responses with and without Retrieval-Augmented Generation (RAG).

Setup
1. Install dependencies:

   npm install

2. Ensure `.env.local` contains your Groq API key (already added in this workspace).

3. Run dev server:

   npm run dev

4. Open http://localhost:3000 and click "Run 10 queries".

Notes
- The first run will build embeddings for the small corpus in `data/corpus.txt` and will call the embeddings endpoint; expect some API usage.
- Adjust models in `.env.local` if needed.
