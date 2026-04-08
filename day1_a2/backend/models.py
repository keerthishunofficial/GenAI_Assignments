from pydantic import BaseModel
from typing import List

class ImproveRequest(BaseModel):
    prompts: List[str]

class ImproveResult(BaseModel):
    index: int
    original: str
    improved: str
    explanation: str

class ImproveResponse(BaseModel):
    results: List[ImproveResult]

class ReportRequest(BaseModel):
    results: List[ImproveResult]
