import React, { useState } from "react";

type ResultRow = {
  query: string;
  nonRag: string;
  rag: string;
};

export default function Home() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAll() {
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/runBatch");
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }
      const data = await res.json();
      setResults(data.results);
    } catch (err: any) {
      setError(err.message || String(err));
    }
    setRunning(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow p-6 rounded">
        <h1 className="text-2xl font-semibold mb-4">RAG vs Non-RAG - Groq comparison</h1>

        <p className="mb-4 text-sm text-gray-600">
          Click "Run 10 queries" to execute both pipelines for a set of predefined queries. Make sure
          the server has your Groq API key in environment variable <code>GROQ_API_KEY</code>.
        </p>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={runAll}
            disabled={running}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
          >
            {running ? "Running…" : "Run 10 queries"}
          </button>
        </div>

        {error && <div className="text-red-600 mb-4">Error: {error}</div>}

        {results && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">#</th>
                    <th className="p-2 border">Query</th>
                    <th className="p-2 border">Non-RAG (summary)</th>
                    <th className="p-2 border">RAG (summary)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="align-top">
                      <td className="p-2 border">{i + 1}</td>
                      <td className="p-2 border text-sm">{r.query}</td>
                      <td className="p-2 border text-sm">
                        {r.nonRag.length > 250 ? r.nonRag.slice(0, 250) + "…" : r.nonRag}
                      </td>
                      <td className="p-2 border text-sm">
                        {r.rag.length > 250 ? r.rag.slice(0, 250) + "…" : r.rag}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Full responses are in developer console logs returned by the server.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
