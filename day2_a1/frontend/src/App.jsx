import React, { useState, useEffect } from 'react';
import './index.css';

const API_BASE = 'http://localhost:8001';

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, ready, evaluating
  const [results, setResults] = useState(null);
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState([]);
  const [strategy, setStrategy] = useState('fixed');
  const [filename, setFilename] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('GROQ_API_KEY') || '');

  useEffect(() => {
    localStorage.setItem('GROQ_API_KEY', apiKey);
  }, [apiKey]);

  const handleUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStatus('uploading');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const resp = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json();
      setFilename(data.filename);
      setStatus('processing');
      
      const processResp = await fetch(`${API_BASE}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: data.filename }),
      });
      await processResp.json();
      setStatus('ready');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleEvaluate = async () => {
    if (!apiKey) {
      alert("Please set your Groq API Key first!");
      return;
    }
    setStatus('evaluating');
    try {
      const resp = await fetch(`${API_BASE}/evaluate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}` // In a real app we'd pass it securely
        },
        body: JSON.stringify({ filename }),
      });
      const data = await resp.json();
      setResults(data.results);
      setStatus('ready');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleQuery = async () => {
    if (!query || !filename) return;
    const userMsg = { role: 'user', content: query };
    setChat([...chat, userMsg]);
    setQuery('');

    try {
      const resp = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, collection_name: strategy }),
      });
      const data = await resp.json();
      setChat(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch (err) {
      setChat(prev => [...prev, { role: 'ai', content: 'Connection error to backend.' }]);
    }
  };

  return (
    <>
    <div className="container">
      <header className="header">
        <h1>RAG ARCHITECT</h1>
        <p>Advanced RAG Benchmarking & Pipeline Generator</p>
      </header>

      <div className="grid">
        <aside>
          <section className="card" style={{marginBottom: '2rem'}}>
            <h2>Settings</h2>
            <div className="input-group">
              <label>Groq API Key</label>
              <input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                placeholder="gsk_..." 
                style={{width: '100%'}}
              />
              <p style={{fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.5rem'}}>
                Stored locally in your browser.
              </p>
            </div>
          </section>

          <section className="card">
            <h2>Ingestion</h2>
            <div className="input-group">
              <label>Upload Manual (PDF/DOCX)</label>
              <div className={`upload-zone ${status === 'uploading' ? 'disabled' : ''}`}>
                <input type="file" onChange={handleUpload} style={{display: 'none'}} id="doc-upload" accept=".pdf,.docx,.doc" />
                <label htmlFor="doc-upload" style={{cursor: 'pointer', display: 'block'}}>
                  {filename ? (
                    <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>📄 {filename}</span>
                  ) : (
                    <>
                      <div style={{fontSize: '2rem', marginBottom: '1rem'}}>📁</div>
                      Click or Drag to Upload
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="input-group">
              <label>Pipeline Status</label>
              <div className="badge badge-blue">
                {status.toUpperCase()}
              </div>
            </div>

            <button 
              className="btn" 
              onClick={handleEvaluate} 
              disabled={status !== 'ready' || status === 'evaluating'}
            >
              {status === 'evaluating' ? (
                <>
                  <div className="spinner"></div>
                  Benchmarking...
                </>
              ) : (
                <>🚀 Run Benchmark</>
              )}
            </button>

            {results && (
              <div style={{marginTop: '2.5rem', animation: 'fadeInDown 0.5s'}}>
                <h3 style={{fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-dim)'}}>Benchmark Results</h3>
                <table className="metrics-table">
                  <thead>
                    <tr>
                      <th>Strategy</th>
                      <th>Rel.</th>
                      <th>Faith.</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['fixed', 'overlap', 'semantic'].map(s => (
                      <tr key={s} style={{opacity: results.best_strategy === s ? 1 : 0.6}}>
                        <td style={{fontWeight: results.best_strategy === s ? 'bold' : 'normal'}}>
                          {s} {results.best_strategy === s && '⭐'}
                        </td>
                        <td>{results[s].relevance.toFixed(2)}</td>
                        <td>{results[s].faithfulness.toFixed(2)}</td>
                        <td>{results[s].total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                  <a href={`${API_BASE}/artifacts/rag_pipeline.py`} download className="btn" style={{background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)'}}>
                    Download .py Pipeline
                  </a>
                  <a href={`${API_BASE}/artifacts/evaluation_report.md`} download className="btn" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)'}}>
                    Download MD Report
                  </a>
                </div>
              </div>
            )}
          </section>
        </aside>

        <main className="card">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
            <h2 style={{margin: 0}}>RAG Sandbox</h2>
            <div className="input-group" style={{margin: 0, width: '250px'}}>
              <select value={strategy} onChange={(e) => setStrategy(e.target.value)} style={{width: '100%'}}>
                <option value="fixed">Fixed-Size Chunking</option>
                <option value="overlap">Overlap Windows</option>
                <option value="semantic">Semantic (Embeddings)</option>
              </select>
            </div>
          </div>

          <div className="chat-box">
            {chat.length === 0 && (
              <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', textAlign: 'center'}}>
                <div>
                  <div style={{fontSize: '3rem', marginBottom: '1rem'}}>💬</div>
                  <p>Injest a document and select a strategy<br/>to start querying the knowledge base.</p>
                </div>
              </div>
            )}
            {chat.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
          </div>

          <div style={{display: 'flex', gap: '1rem'}}>
            <input 
              type="text"
              style={{flex: 1}}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about the manual..."
              onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
              disabled={status === 'idle' || status === 'uploading'}
            />
            <button className="btn" style={{width: 'auto', padding: '0 2rem'}} onClick={handleQuery} disabled={!query || status === 'idle'}>
              Send
            </button>
          </div>
        </main>
      </div>
    </div>
      { (status === 'evaluating' || status === 'processing' || status === 'uploading') && (
        <div className="loading-overlay">
          <div className="spinner" style={{width: '60px', height: '60px'}}></div>
          <div className="loading-text">
            {status === 'evaluating' && "Evaluating RAG Strategies"}
            {status === 'processing' && "Processing Document"}
            {status === 'uploading' && "Uploading Document"}
          </div>
          <p style={{color: 'var(--text-dim)', marginTop: '-1rem'}}>
            {status === 'evaluating' && "Running benchmarks across multiple chunking strategies. This usually takes 30-60 seconds."}
            {status === 'processing' && "Extracting text and initializing vector collections..."}
            {status === 'uploading' && "Sending your file to the secure backend..."}
          </p>
        </div>
      )}
    </>
  );
}

export default App;
