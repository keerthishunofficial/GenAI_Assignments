import os
import re
from pypdf import PdfReader
from docx import Document
from typing import List

class IngestionService:
    @staticmethod
    def extract_text(file_path: str) -> str:
        """Main entry point for text extraction based on file extension."""
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.pdf':
            return IngestionService.extract_text_from_pdf(file_path)
        elif ext in ['.doc', '.docx']:
            return IngestionService.extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """Extracts content from PDF files."""
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        """Extracts content from DOCX files."""
        doc = Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text

    @staticmethod
    def clean_text(text: str) -> str:
        """Cleans extracted text by removing extra whitespaces and noise."""
        # Replace multiple newlines with single ones
        text = re.sub(r'\n\s*\n', '\n', text)
        # Replace multiple spaces with single ones
        text = re.sub(r' +', ' ', text)
        return text.strip()
