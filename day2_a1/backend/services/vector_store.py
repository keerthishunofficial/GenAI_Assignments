import chromadb
from chromadb.utils import embedding_functions
from typing import List, Dict
import os

class VectorService:
    def __init__(self, persist_directory: str = "./backend/chroma_db"):
        self.client = chromadb.PersistentClient(path=persist_directory)
        self._embedding_fn = None

    @property
    def embedding_fn(self):
        if self._embedding_fn is None:
            self._embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
        return self._embedding_fn

    def create_collection(self, name: str):
        """Creates or resets a collection."""
        try:
            self.client.delete_collection(name)
        except Exception:
            pass
        return self.client.create_collection(name=name, embedding_function=self.embedding_fn)

    def add_documents(self, collection_name: str, chunks: List[str]):
        """Adds text chunks to a collection."""
        collection = self.client.get_collection(name=collection_name, embedding_function=self.embedding_fn)
        ids = [f"id_{i}" for i in range(len(chunks))]
        collection.add(
            documents=chunks,
            ids=ids
        )

    def query(self, collection_name: str, query_text: str, n_results: int = 3) -> List[str]:
        """Queries a collection for relevant chunks."""
        collection = self.client.get_collection(name=collection_name, embedding_function=self.embedding_fn)
        results = collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        # results["documents"] is a list of lists
        return results["documents"][0] if results["documents"] else []
