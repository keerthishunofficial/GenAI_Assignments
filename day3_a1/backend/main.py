from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, AsyncGenerator
from graph import app as recruitment_graph
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio

app = FastAPI(title="Recruitment Pipeline API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecruitmentRequest(BaseModel):
    resume_text: str
    job_role: str
    availability: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Recruitment Pipeline API is running"}

async def recruitment_generator(request_data: dict) -> AsyncGenerator[str, None]:
    """Generates SSE events from the LangGraph execution."""
    try:
        initial_state = {
            "resume_text": request_data["resume_text"],
            "job_role": request_data["job_role"],
            "availability": request_data.get("availability"),
            "screening_result": None,
            "schedule_proposal": None,
            "final_evaluation": None,
            "next_step": "start"
        }

        # Use astream to get updates from the graph
        async for event in recruitment_graph.astream(initial_state):
            # Each event is a dict representing the state update from a node
            # Example: {'screener': {'screening_result': {...}, 'next_step': 'scheduling'}}
            for node_name, output in event.items():
                data = {
                    "node": node_name,
                    "output": output
                }
                yield f"data: {json.dumps(data)}\n\n"
            
            # Artificial delay for better UX in UI
            await asyncio.sleep(1)

    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"

@app.post("/process")
async def process_recruitment(request: RecruitmentRequest):
    return StreamingResponse(
        recruitment_generator(request.dict()),
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

