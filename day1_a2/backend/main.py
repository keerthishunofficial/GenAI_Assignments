from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from .models import ImproveRequest, ImproveResponse, ReportRequest
from .prompt_service import improve_prompt
from .report_generator import generate_markdown_report
import os

app = FastAPI(title="Prompt Debugger API")

# API Routes
@app.post("/api/improve", response_model=ImproveResponse)
async def api_improve(request: ImproveRequest):
    if not request.prompts:
        raise HTTPException(status_code=400, detail="No prompts provided")
    
    results = []
    for i, p in enumerate(request.prompts):
        if not p.strip():
            continue
        result = improve_prompt(i + 1, p)
        results.append(result)
    
    return ImproveResponse(results=results)

@app.post("/api/report")
async def api_report(request: ReportRequest):
    content = generate_markdown_report(request.results)
    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": "attachment; filename=prompt_evaluation_report.md"}
    )

# Serve Frontend
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
