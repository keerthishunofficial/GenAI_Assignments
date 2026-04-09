from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_experimental.text_splitter import SemanticChunker
from langchain_huggingface import HuggingFaceEmbeddings

class ChunkingService:
    def __init__(self):
        self._embeddings = None

    @property
    def embeddings(self):
        if self._embeddings is None:
            self._embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        return self._embeddings

    def fixed_size_chunking(self, text: str, chunk_size: int = 1000) -> List[str]:
        """Splits text into fixed-size chunks without overlap."""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=0,
            separators=["\n\n", "\n", " ", ""]
        )
        return splitter.split_text(text)

    def overlap_chunking(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Splits text into chunks with a sliding window overlap."""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap,
            separators=["\n\n", "\n", " ", ""]
        )
        return splitter.split_text(text)

    def semantic_chunking(self, text: str) -> List[str]:
        """Splits text based on semantic meaning using embeddings."""
        chunker = SemanticChunker(self.embeddings)
        # The split_text method returns a list of LangChain Documents, so we extract the content
        docs = chunker.create_documents([text])
        return [doc.page_content for doc in docs]
