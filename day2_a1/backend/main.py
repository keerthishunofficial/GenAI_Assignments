import os
import shutil
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional

from services.ingestion import IngestionService
from services.chunking import ChunkingService
from services.vector_store import VectorService
from services.evaluation import EvaluationService
from services.artifact_generator import ArtifactGenerator

app = FastAPI(title="RAG Architect & Evaluation System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared state (in-memory for demo purposes)
UPLOAD_DIR = "backend/uploads"
ARTIFACT_DIR = "backend/artifacts"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

app.mount("/artifacts", StaticFiles(directory=ARTIFACT_DIR), name="artifacts")
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

class ProcessRequest(BaseModel):
    filename: str
    chunk_size: int = 1000
    overlap: int = 200

class QueryRequest(BaseModel):
    query: str
    collection_name: str

# Initialize services
vector_service = VectorService()
chunking_service = ChunkingService()
evaluation_service = EvaluationService()

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "message": "File uploaded successfully"}

@app.post("/process")
async def process_document(req: ProcessRequest):
    file_path = os.path.join(UPLOAD_DIR, req.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    raw_text = IngestionService.extract_text(file_path)
    clean_text = IngestionService.clean_text(raw_text)

    # Process all 3 strategies for comparison
    strategies = {
        "fixed": chunking_service.fixed_size_chunking(clean_text, req.chunk_size),
        "overlap": chunking_service.overlap_chunking(clean_text, req.chunk_size, req.overlap),
        "semantic": chunking_service.semantic_chunking(clean_text)
    }

    results = {}
    for name, chunks in strategies.items():
        vector_service.create_collection(name)
        vector_service.add_documents(name, chunks)
        results[name] = {"chunk_count": len(chunks)}

    return {"message": "Document processed", "stats": results}

@app.post("/query")
async def query_rag(req: QueryRequest):
    chunks = vector_service.query(req.collection_name, req.query)
    if not chunks:
        return {"answer": "I'm sorry, I couldn't find any relevant information in the manual for that question.", "context": []}

    context_str = "\n---\n".join(chunks)
    system_prompt = "You are a helpful product manual assistant. Answer questions concisely based ONLY on the provided context. If the answer is not in the context, say you don't know."
    user_prompt = f"Context:\n{context_str}\n\nQuestion: {req.query}"
    
    if not evaluation_service.is_available():
        return {"answer": "Groq API Key is not configured. Please check your settings.", "context": chunks}

    try:
        response = evaluation_service.client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.1-8b-instant",
        )
        answer = response.choices[0].message.content
        return {"answer": answer, "context": chunks}
    except Exception as e:
        return {"answer": f"Error querying Groq: {str(e)}", "context": chunks}

@app.post("/evaluate")
async def evaluate_strategies(req: ProcessRequest):
    # Sample queries for evaluation
    test_queries = [
        "What is the primary function of this device?",
        "How do I troubleshoot connection issues?",
        "What are the safety requirements and warnings?",
        "List the technical specifications provided.",
        "How do I perform a factory reset?"
    ]

    if not evaluation_service.is_available():
        raise HTTPException(status_code=400, detail="Groq API Key is not configured.")

    report_data = {}
    
    for strategy in ["fixed", "overlap", "semantic"]:
        def rag_func(q):
            context = vector_service.query(strategy, q)
            context_str = "\n---\n".join(context)
            prompt = f"Context:\n{context_str}\n\nQuestion: {q}\nAnswer concisely:"
            resp = evaluation_service.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
            )
            return context, resp.choices[0].message.content

        metrics = evaluation_service.run_benchmark(test_queries, rag_func)
        report_data[strategy] = {
            "relevance": metrics["avg_relevance"],
            "faithfulness": metrics["avg_faithfulness"],
            "total": (metrics["avg_relevance"] + metrics["avg_faithfulness"]) / 2
        }

    best_strategy = max(["fixed", "overlap", "semantic"], key=lambda x: report_data[x]["total"])
    report_data["best_strategy"] = best_strategy

    # Generate artifacts
    script_content = ArtifactGenerator.generate_pipeline_script(
        best_strategy, 
        {"size": req.chunk_size, "overlap": req.overlap}
    )
    report_content = ArtifactGenerator.generate_evaluation_report(report_data)

    with open(os.path.join(ARTIFACT_DIR, "rag_pipeline.py"), "w", encoding="utf-8") as f:
        f.write(script_content)
    with open(os.path.join(ARTIFACT_DIR, "evaluation_report.md"), "w", encoding="utf-8") as f:
        f.write(report_content)

    return {"results": report_data, "message": "Benchmarking complete. Artifacts generated."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
