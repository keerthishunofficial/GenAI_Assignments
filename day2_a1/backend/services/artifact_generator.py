import os
from jinja2 import Template

class ArtifactGenerator:
    @staticmethod
    def generate_pipeline_script(best_strategy: str, best_params: dict) -> str:
        """Generates a standalone Python script for the RAG pipeline."""
        template_str = """
import os
import logging
from typing import List, Optional
from groq import Groq
from pypdf import PdfReader
from docx import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb
from chromadb.utils import embedding_functions

# --- CONFIGURATION ---
# Replace with your actual Groq API Key or set as environment variable
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "YOUR_GROQ_API_KEY_HERE")
STRATEGY = "{{ strategy }}"
PARAMS = {{ params }}

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("RAGPipeline")

class RAGPipeline:
    def __init__(self, collection_name: str = "product_manual"):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.db = chromadb.Client()
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        self.collection = self.db.create_collection(
            name=collection_name, 
            embedding_function=self.embedding_fn
        )

    def extract_text(self, file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()
        text = ""
        if ext == '.pdf':
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text() + "\\n"
        elif ext in ['.doc', '.docx']:
            doc = Document(file_path)
            text = "\\n".join([p.text for p in doc.paragraphs])
        return text

    def ingest(self, file_path: str):
        logger.info(f"Ingesting file: {file_path}")
        text = self.extract_text(file_path)
        
        # Using optimized strategy: {{ strategy }}
        if STRATEGY == "fixed":
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=PARAMS.get('size', 1000), 
                chunk_overlap=0
            )
        elif STRATEGY == "overlap":
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=PARAMS.get('size', 1000), 
                chunk_overlap=PARAMS.get('overlap', 200)
            )
        else: # semantic
            from langchain_experimental.text_splitter import SemanticChunker
            from langchain_huggingface import HuggingFaceEmbeddings
            splitter = SemanticChunker(HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2"))
        
        if STRATEGY == "semantic":
             docs = splitter.create_documents([text])
             chunks = [d.page_content for d in docs]
        else:
             chunks = splitter.split_text(text)
             
        logger.info(f"Created {len(chunks)} chunks using {STRATEGY} strategy.")
        self.collection.add(
            documents=chunks, 
            ids=[f"id_{i}" for i in range(len(chunks))]
        )

    def query(self, question: str, n_results: int = 3) -> str:
        logger.info(f"Querying: {question}")
        results = self.collection.query(query_texts=[question], n_results=n_results)
        context = "\\n---\\n".join(results['documents'][0])
        
        prompt = f"Context:\\n{context}\\n\\nQuestion: {question}\\nAnswer based ONLY on context:"
        
        response = self.client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
        )
        return response.choices[0].message.content

if __name__ == "__main__":
    # Example usage:
    # pipe = RAGPipeline()
    # pipe.ingest("your_manual.pdf")
    # print(pipe.query("How to reset?"))
    pass
"""
        template = Template(template_str)
        return template.render(strategy=best_strategy, params=best_params)

    @staticmethod
    def generate_evaluation_report(results: dict) -> str:
        """Generates a structured Markdown evaluation report."""
        report = f"""# RAG Strategy Evaluation Report

This report summarizes the performance of different chunking strategies for your document.

## 📊 Performance Benchmark

| Strategy | Relevance | Faithfulness | Overall Score |
|:---|:---:|:---:|:---:|
| **Fixed-Size** | {results['fixed']['relevance']:.2f} | {results['fixed']['faithfulness']:.2f} | {results['fixed']['total']:.2f} |
| **Overlap** | {results['overlap']['relevance']:.2f} | {results['overlap']['faithfulness']:.2f} | {results['overlap']['total']:.2f} |
| **Semantic** | {results['semantic']['relevance']:.2f} | {results['semantic']['faithfulness']:.2f} | {results['semantic']['total']:.2f} |

> [!TIP]
> **Winner: {results['best_strategy'].upper()}**
> This strategy achieved the highest overall score and is recommended for your specific document structure.

## 🔍 Strategy Insights

### 1. Fixed-Size Chunking
Strict character count splits. Fast but can break semantic context at boundaries.

### 2. Overlap-based Sliding Window
Fixed-size chunks with shared text at edges. Better continuity, often improving retrieval recall.

### 3. Semantic Chunking
Splits based on embedding similarity. Most accurate for complex documents where sections vary in length but share themes.

## 📝 Conclusion
Based on the metrics, `{results['best_strategy']}` is the most robust pipeline for this manual. You can download the optimized script to integrate this into your workflow.
"""
        return report
